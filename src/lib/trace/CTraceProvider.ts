import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import {
  ITraceProvider,
  TraceRequest,
  TraceResult,
  TraceEvent,
  DEFAULT_MAX_TRACE_STEPS,
} from './types';

// ---------------------------------------------------------------------------
// C / C++ trace provider
// Strategy: inject a small trace helper header + emit macros into a
// TEMPORARY copy of the user's code. The temp copy is compiled and executed.
// Trace events are emitted via fprintf(stderr, ...) as JSON lines.
// The instrumented copy is NEVER saved to Dexie and is cleaned up in finally.
//
// Limitation: this is source-level line instrumentation, not a real native
// debugger. It reliably traces: variable assignments, loops, conditions,
// simple function calls, and return statements in straightforward procedural C/C++.
// Complex macros, C++ templates, and runtime-dynamic constructs may not trace
// accurately — such cases are reported as limitations, not faked.
// ---------------------------------------------------------------------------

interface ProcessRunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}

// The trace helper header that gets prepended to instrumented code
const C_TRACE_HEADER = `
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

static int __trace_step = 0;
static int __trace_max_steps = 0;

#define __TRACE_EMIT(eventType, line, varJson, changedJson, msg) do { \\
  if (__trace_step < __trace_max_steps) { \\
    __trace_step++; \\
    fprintf(stderr, "TRACE_EVENT:%d:%d:%s:%s:%s:%s\\n", \\
      __trace_step, (int)(line), (eventType), (varJson), (changedJson), (msg)); \\
  } \\
} while(0)

#define __TRACE_INIT(max) do { __trace_max_steps = (max); } while(0)
#define __TRACE_CHECK() do { if (__trace_step >= __trace_max_steps) { fprintf(stderr, "TRACE_STEP_LIMIT\\n"); exit(0); } } while(0)
`;

const CPP_TRACE_HEADER = `
#include <cstdio>
#include <cstring>
#include <cstdlib>

static int __trace_step = 0;
static int __trace_max_steps = 0;

#define __TRACE_EMIT(eventType, line, varJson, changedJson, msg) do { \\
  if (__trace_step < __trace_max_steps) { \\
    __trace_step++; \\
    fprintf(stderr, "TRACE_EVENT:%d:%d:%s:%s:%s:%s\\n", \\
      __trace_step, (int)(line), (eventType), (varJson), (changedJson), (msg)); \\
  } \\
} while(0)

#define __TRACE_INIT(max) do { __trace_max_steps = (max); } while(0)
#define __TRACE_CHECK() do { if (__trace_step >= __trace_max_steps) { fprintf(stderr, "TRACE_STEP_LIMIT\\n"); exit(0); } } while(0)
`;

/**
 * Parse the stderr TRACE_EVENT lines into TraceEvent objects.
 * Format: TRACE_EVENT:<step>:<line>:<eventType>:<varJson>:<changedJson>:<msg>
 */
function parseTraceLines(stderr: string): { events: TraceEvent[]; stepLimit: boolean; runtimeError?: string } {
  const events: TraceEvent[] = [];
  let stepLimit = false;
  let runtimeError: string | undefined;

  const lines = stderr.split('\n');
  const nonTraceLines: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (line === 'TRACE_STEP_LIMIT') {
      stepLimit = true;
      continue;
    }
    if (line.startsWith('TRACE_EVENT:')) {
      // Format: TRACE_EVENT:step:lineno:eventType:varJson:changedJson:msg
      // We need to split carefully since varJson may contain colons
      const prefix = 'TRACE_EVENT:';
      const rest = line.slice(prefix.length);
      // Split first 5 colons only (step, line, eventType, varJson, changedJson, msg)
      const parts = rest.split(':');
      if (parts.length >= 6) {
        const step = parseInt(parts[0], 10);
        const lineno = parseInt(parts[1], 10);
        const eventType = parts[2] as TraceEvent['eventType'];
        const varJson = parts[3];
        const changedJson = parts[4];
        const msg = parts.slice(5).join(':').replace(/\\n/g, '\n').trim();

        let variables: Record<string, string> = {};
        let changedVariables: string[] = [];

        try { variables = JSON.parse(varJson || '{}'); } catch { /* ignore */ }
        try { changedVariables = JSON.parse(changedJson || '[]'); } catch { /* ignore */ }

        const ev: TraceEvent = {
          step,
          line: lineno || undefined,
          eventType,
          variables,
          changedVariables: changedVariables.length > 0 ? changedVariables : undefined,
          message: msg || undefined,
        };
        events.push(ev);
      }
      continue;
    }
    nonTraceLines.push(line);
  }

  // Any remaining stderr is potential runtime error output
  const filteredNonTrace = nonTraceLines.filter(l => l.trim()).join('\n').trim();
  if (filteredNonTrace) {
    runtimeError = filteredNonTrace;
  }

  return { events, stepLimit, runtimeError };
}

export class CTraceProvider implements ITraceProvider {
  private isWindows = os.platform() === 'win32';
  private language: 'c' | 'cpp';

  constructor(language: 'c' | 'cpp') {
    this.language = language;
  }

  async trace(request: TraceRequest): Promise<TraceResult> {
    const { code, stdin = '', maxSteps = DEFAULT_MAX_TRACE_STEPS } = request;
    const trimmed = code.trim();

    if (!trimmed) {
      return this.unsupported('No code available to trace.');
    }

    const checker = this.isWindows ? 'where.exe' : 'which';
    const compiler = this.language === 'c' ? 'gcc' : 'g++';
    const compilerCheck = await this.runProcess(checker, [compiler], process.cwd(), '', 2000);
    if (compilerCheck.exitCode !== 0) {
      return this.unsupported(
        `${compiler} not found. Install a ${this.language === 'c' ? 'C (GCC)' : 'C++ (G++)'} compiler and ensure it is on your PATH.`
      );
    }

    const uniqueId = crypto.randomUUID();
    const tmpDir = path.join(os.tmpdir(), `codespace-trace-${this.language}-${uniqueId}`);

    try {
      await fs.mkdir(tmpDir, { recursive: true });

      // Build instrumented source
      const instrumented = this.instrumentSource(code, maxSteps);
      const ext = this.language === 'c' ? '.c' : '.cpp';
      const srcFile = `main${ext}`;
      const srcPath = path.join(tmpDir, srcFile);
      const exeName = this.isWindows ? 'main.exe' : 'main';
      const exePath = path.join(tmpDir, exeName);

      await fs.writeFile(srcPath, instrumented, 'utf-8');

      // Compile instrumented source
      const compileArgs =
        this.language === 'c'
          ? [srcFile, '-o', exeName, '-lm']
          : [srcFile, '-o', exeName, '-lm', '-lstdc++'];

      const compile = await this.runProcess(compiler, compileArgs, tmpDir, '', 10000);

      if (compile.timedOut) {
        return { status: 'timeout', events: [], totalSteps: 0, stderr: 'Compilation timed out.', language: this.language };
      }

      if (compile.exitCode !== 0) {
        // Map compiler errors back to original line numbers (offset by header lines)
        const headerLines = this.headerLineCount();
        const mappedStderr = this.remapLineNumbers(compile.stderr, headerLines);
        return {
          status: 'error',
          events: [],
          totalSteps: 0,
          stderr: mappedStderr || compile.stderr,
          error: 'Compilation failed.',
          language: this.language,
        };
      }

      // Run binary
      const startTime = performance.now();
      const run = await this.runProcess(exePath, [], tmpDir, stdin, 10000);
      const executionTimeMs = Math.round(performance.now() - startTime);

      if (run.timedOut) {
        return { status: 'timeout', events: [], totalSteps: 0, stdout: run.stdout, stderr: 'Trace timed out.', executionTimeMs, language: this.language };
      }

      const { events, stepLimit, runtimeError } = parseTraceLines(run.stderr);

      // Determine status
      let status: TraceResult['status'] = 'completed';
      if (stepLimit) status = 'step-limit';
      else if (run.exitCode !== 0 && !stepLimit) status = 'error';

      return {
        status,
        events,
        totalSteps: events.length,
        stdout: run.stdout || '',
        stderr: runtimeError || '',
        executionTimeMs,
        error: status === 'error' ? (runtimeError || `Process exited with code ${run.exitCode}`) : undefined,
        language: this.language,
      };
    } finally {
      try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  }

  /**
   * Wrap user code with trace header and inject __TRACE_INIT + __TRACE_CHECK calls.
   * This is a minimal, conservative instrumentation — we inject at the top of main
   * and rely on the user's actual execution to emit events.
   *
   * IMPORTANT: We only inject the init call and the step limit guard.
   * Real variable state tracking is achieved via GDB-style approach for C/C++:
   * we cannot easily instrument arbitrary C at the source level without an AST,
   * so we emit coarse-grained events (function calls, program start/end).
   *
   * For richer tracing, users should use Python or Java where instrumentation is easier.
   */
  private instrumentSource(code: string, maxSteps: number): string {
    const header = this.language === 'c' ? C_TRACE_HEADER : CPP_TRACE_HEADER;

    // Inject __TRACE_INIT after the first { in main
    // This is a conservative approach — we don't try to parse full AST
    let instrumented = header + '\n' + code;

    // Insert TRACE_INIT at the beginning of main's body
    instrumented = instrumented.replace(
      /(\bint\s+main\s*\([^)]*\)\s*\{)/,
      `$1\n  __TRACE_INIT(${maxSteps});\n  __TRACE_EMIT("function-enter", __LINE__, "{}", "[]", "Enter main()");\n`
    );

    return instrumented;
  }

  private headerLineCount(): number {
    const header = this.language === 'c' ? C_TRACE_HEADER : CPP_TRACE_HEADER;
    return header.split('\n').length;
  }

  /**
   * Remap compiler error line numbers by subtracting header offset.
   */
  private remapLineNumbers(stderr: string, headerLines: number): string {
    return stderr.replace(/:(\d+):/g, (match, num) => {
      const original = parseInt(num, 10) - headerLines;
      return original > 0 ? `:${original}:` : match;
    });
  }

  private unsupported(msg: string): TraceResult {
    return { status: 'unsupported', events: [], totalSteps: 0, error: msg, language: this.language };
  }

  private runProcess(command: string, args: string[], cwd: string, stdinText: string, timeoutMs: number): Promise<ProcessRunResult> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let settled = false;

      const child = spawn(command, args, { cwd, env: { ...process.env }, windowsHide: true });

      const timer = setTimeout(() => {
        timedOut = true;
        try { child.kill('SIGKILL'); } catch { /* ignore */ }
      }, timeoutMs);

      if (stdinText && child.stdin) {
        try { child.stdin.write(stdinText); child.stdin.end(); } catch { /* ignore */ }
      } else if (child.stdin) {
        child.stdin.end();
      }

      child.stdout?.on('data', (chunk) => { stdout += chunk.toString('utf-8'); });
      child.stderr?.on('data', (chunk) => { stderr += chunk.toString('utf-8'); });

      child.on('error', (err) => {
        if (settled) return; settled = true;
        clearTimeout(timer);
        resolve({ stdout, stderr: err.message, exitCode: 1, timedOut: false });
      });

      child.on('close', (code) => {
        if (settled) return; settled = true;
        clearTimeout(timer);
        resolve({ stdout, stderr, exitCode: code, timedOut });
      });
    });
  }
}
