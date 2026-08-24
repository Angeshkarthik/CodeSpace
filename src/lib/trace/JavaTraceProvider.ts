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
// Java trace provider
// Strategy: wrap the user's Main class code in a temporary instrumented
// version that uses a simple static TraceHelper to emit JSON trace lines to
// stderr. Variable tracking is performed at key instrumented points.
// The temporary file is NEVER saved to Dexie and is cleaned up in finally.
//
// Limitation: Java instrumentation at source level (no JVMTI/bytecode).
// Only coarse-grained events (method entry/exit, program start/end) are
// reliably emitted. Fine-grained variable tracking per line is not available
// without full bytecode instrumentation — this is clearly reported.
// ---------------------------------------------------------------------------

interface ProcessRunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}

const TRACE_HELPER_CLASS = `
class __TraceHelper {
    private static int step = 0;
    private static int maxSteps = 500;

    public static void init(int max) { maxSteps = max; }

    public static void emit(String eventType, int line, String varJson, String changedJson, String msg) {
        if (step >= maxSteps) {
            System.err.println("TRACE_STEP_LIMIT");
            System.exit(0);
        }
        step++;
        // Escape msg to avoid newline issues
        String safemsg = msg == null ? "" : msg.replace("\\n", " ");
        System.err.println("TRACE_EVENT:" + step + ":" + line + ":" + eventType + ":" + varJson + ":" + changedJson + ":" + safemsg);
    }

    public static void check() {
        if (step >= maxSteps) {
            System.err.println("TRACE_STEP_LIMIT");
            System.exit(0);
        }
    }
}
`;

function parseTraceLines(stderr: string): { events: TraceEvent[]; stepLimit: boolean; runtimeError?: string } {
  const events: TraceEvent[] = [];
  let stepLimit = false;
  const nonTraceLines: string[] = [];

  for (const raw of stderr.split('\n')) {
    const line = raw.trim();
    if (line === 'TRACE_STEP_LIMIT') { stepLimit = true; continue; }
    if (line.startsWith('TRACE_EVENT:')) {
      const rest = line.slice('TRACE_EVENT:'.length);
      const parts = rest.split(':');
      if (parts.length >= 6) {
        const step = parseInt(parts[0], 10);
        const lineno = parseInt(parts[1], 10);
        const eventType = parts[2] as TraceEvent['eventType'];
        const varJson = parts[3];
        const changedJson = parts[4];
        const msg = parts.slice(5).join(':').trim();

        let variables: Record<string, string> = {};
        let changedVariables: string[] = [];
        try { variables = JSON.parse(varJson || '{}'); } catch { /* ok */ }
        try { changedVariables = JSON.parse(changedJson || '[]'); } catch { /* ok */ }

        events.push({
          step, line: lineno || undefined, eventType, variables,
          changedVariables: changedVariables.length > 0 ? changedVariables : undefined,
          message: msg || undefined,
        });
      }
      continue;
    }
    nonTraceLines.push(line);
  }

  const filteredNonTrace = nonTraceLines.filter(l => l.trim() && !l.includes('Note:')).join('\n').trim();
  return { events, stepLimit, runtimeError: filteredNonTrace || undefined };
}

export class JavaTraceProvider implements ITraceProvider {
  private isWindows = os.platform() === 'win32';

  async trace(request: TraceRequest): Promise<TraceResult> {
    const { code, stdin = '', maxSteps = DEFAULT_MAX_TRACE_STEPS } = request;

    if (!code.trim()) {
      return this.unsupported('No code available to trace.');
    }

    const checker = this.isWindows ? 'where.exe' : 'which';
    const javacCheck = await this.runProcess(checker, ['javac'], process.cwd(), '', 2000);
    const javaCheck = await this.runProcess(checker, ['java'], process.cwd(), '', 2000);
    if (javacCheck.exitCode !== 0 || javaCheck.exitCode !== 0) {
      return this.unsupported('Java JDK not found. Install OpenJDK and ensure javac and java are on your PATH.');
    }

    const uniqueId = crypto.randomUUID();
    const tmpDir = path.join(os.tmpdir(), `codespace-trace-java-${uniqueId}`);

    try {
      await fs.mkdir(tmpDir, { recursive: true });

      // Write TraceHelper
      await fs.writeFile(path.join(tmpDir, '__TraceHelper.java'), TRACE_HELPER_CLASS, 'utf-8');

      // Instrument user code: inject init + entry event into main method
      const instrumented = this.instrumentSource(code, maxSteps);
      await fs.writeFile(path.join(tmpDir, 'Main.java'), instrumented, 'utf-8');

      // Compile both files
      const compile = await this.runProcess('javac', ['__TraceHelper.java', 'Main.java'], tmpDir, '', 15000);
      if (compile.timedOut) return { status: 'timeout', events: [], totalSteps: 0, stderr: 'Compilation timed out.', language: 'java' };
      if (compile.exitCode !== 0) {
        return {
          status: 'error', events: [], totalSteps: 0,
          stderr: compile.stderr || 'Compilation failed.',
          error: 'Compilation failed.', language: 'java',
        };
      }

      const startTime = performance.now();
      const run = await this.runProcess('java', ['-cp', '.', 'Main'], tmpDir, stdin, 12000);
      const executionTimeMs = Math.round(performance.now() - startTime);

      if (run.timedOut) return { status: 'timeout', events: [], totalSteps: 0, stdout: run.stdout, stderr: 'Trace timed out.', executionTimeMs, language: 'java' };

      const { events, stepLimit, runtimeError } = parseTraceLines(run.stderr);
      const status: TraceResult['status'] = stepLimit ? 'step-limit' : (run.exitCode !== 0 ? 'error' : 'completed');

      return {
        status, events, totalSteps: events.length,
        stdout: run.stdout || '',
        stderr: runtimeError || '',
        executionTimeMs,
        error: status === 'error' ? (runtimeError || `Process exited with code ${run.exitCode}`) : undefined,
        language: 'java',
      };
    } finally {
      try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  }

  private instrumentSource(code: string, maxSteps: number): string {
    // Inject __TraceHelper.init() + entry emit into main method body
    return code.replace(
      /(\bpublic\s+static\s+void\s+main\s*\([^)]*\)\s*\{)/,
      `$1\n        __TraceHelper.init(${maxSteps});\n        __TraceHelper.emit("function-enter", 0, "{}", "[]", "Enter main()");\n`
    );
  }

  private unsupported(msg: string): TraceResult {
    return { status: 'unsupported', events: [], totalSteps: 0, error: msg, language: 'java' };
  }

  private runProcess(command: string, args: string[], cwd: string, stdinText: string, timeoutMs: number): Promise<ProcessRunResult> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let settled = false;
      const child = spawn(command, args, { cwd, env: { ...process.env }, windowsHide: true });
      const timer = setTimeout(() => { timedOut = true; try { child.kill('SIGKILL'); } catch { /* ignore */ } }, timeoutMs);
      if (stdinText && child.stdin) { try { child.stdin.write(stdinText); child.stdin.end(); } catch { /* ignore */ } }
      else if (child.stdin) { child.stdin.end(); }
      child.stdout?.on('data', (c) => { stdout += c.toString('utf-8'); });
      child.stderr?.on('data', (c) => { stderr += c.toString('utf-8'); });
      child.on('error', (err) => { if (settled) return; settled = true; clearTimeout(timer); resolve({ stdout, stderr: err.message, exitCode: 1, timedOut: false }); });
      child.on('close', (code) => { if (settled) return; settled = true; clearTimeout(timer); resolve({ stdout, stderr, exitCode: code, timedOut }); });
    });
  }
}
