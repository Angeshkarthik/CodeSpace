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
  MAX_VAR_VALUE_LENGTH,
} from './types';

// ---------------------------------------------------------------------------
// Python trace provider
// Uses sys.settrace() — actual CPython execution observation, NOT simulation.
// A small wrapper script is written to a temp directory alongside the user code.
// The wrapper captures real line events, variable snapshots, and function calls.
// The instrumented wrapper is NEVER saved to Dexie and is cleaned up in finally.
// ---------------------------------------------------------------------------

const TRACER_BOOTSTRAP = (userFile: string, maxSteps: number, stdinAvailable: boolean) => `
import sys
import os
import json
import types as _types

_MAX_STEPS = ${maxSteps}
_STEP = 0
_EVENTS = []
_USER_FILE = ${JSON.stringify(userFile)}
_PREV_VARS: dict = {}
_CALL_STACK: list = []
_STDOUT_LINES: list = []
_PROGRAM_OUTPUT: list = []

# ---------- helpers ----------

def _safe_repr(v, depth=0):
    if depth > 3:
        return '...'
    try:
        if isinstance(v, (int, float, bool, type(None))):
            return str(v)
        if isinstance(v, str):
            s = repr(v)
            return s[:${MAX_VAR_VALUE_LENGTH}] + '...' if len(s) > ${MAX_VAR_VALUE_LENGTH} else s
        if isinstance(v, (list, tuple)):
            if len(v) > 20:
                preview = [_safe_repr(x, depth+1) for x in v[:20]]
                return ('[' if isinstance(v, list) else '(') + ', '.join(preview) + f', ... ({len(v)} total)' + (']' if isinstance(v, list) else ')')
            inner = [_safe_repr(x, depth+1) for x in v]
            return ('[' if isinstance(v, list) else '(') + ', '.join(inner) + (']' if isinstance(v, list) else ')')
        if isinstance(v, dict):
            if len(v) > 10:
                return '{' + f'... ({len(v)} keys)' + '}'
            inner = [f'{_safe_repr(k, depth+1)}: {_safe_repr(val, depth+1)}' for k, val in list(v.items())[:10]]
            return '{' + ', '.join(inner) + '}'
        s = repr(v)
        return s[:${MAX_VAR_VALUE_LENGTH}] + '...' if len(s) > ${MAX_VAR_VALUE_LENGTH} else s
    except Exception:
        return '<unprintable>'

def _snap_locals(frame_locals):
    result = {}
    for k, v in frame_locals.items():
        if k.startswith('_') or isinstance(v, (_types.ModuleType, _types.FunctionType, _types.BuiltinFunctionType, type)):
            continue
        result[k] = _safe_repr(v)
    return result

def _diff_vars(prev, curr):
    changed = []
    for k in curr:
        if k not in prev or prev[k] != curr[k]:
            changed.append(k)
    return changed

def _emit(event_type, line, variables, changed, message=None, func_name=None, ret_val=None):
    global _STEP
    if _STEP >= _MAX_STEPS:
        return False
    _STEP += 1
    ev = {
        'step': _STEP,
        'line': line,
        'eventType': event_type,
        'variables': variables,
    }
    if changed:
        ev['changedVariables'] = changed
    if message:
        ev['message'] = message
    if func_name:
        ev['functionName'] = func_name
    if ret_val is not None:
        ev['returnValue'] = ret_val
    _EVENTS.append(ev)
    return True

# ---------- settrace callback ----------

def _tracer(frame, event, arg):
    global _PREV_VARS, _STEP

    # Only trace user file
    try:
        fname = os.path.abspath(frame.f_code.co_filename)
        uname = os.path.abspath(_USER_FILE)
        if fname != uname:
            return _tracer
    except Exception:
        return _tracer

    if _STEP >= _MAX_STEPS:
        raise StopIteration('__trace_step_limit__')

    lineno = frame.f_lineno
    func_name = frame.f_code.co_name
    curr_vars = _snap_locals(frame.f_locals)
    changed = _diff_vars(_PREV_VARS, curr_vars)
    _PREV_VARS = dict(curr_vars)

    if event == 'call':
        msg = f'Enter {func_name}()' if func_name != '<module>' else 'Program start'
        ok = _emit('function-enter', lineno, curr_vars, changed, message=msg, func_name=func_name if func_name != '<module>' else None)
        if not ok:
            raise StopIteration('__trace_step_limit__')
    elif event == 'line':
        ok = _emit('statement', lineno, curr_vars, changed)
        if not ok:
            raise StopIteration('__trace_step_limit__')
    elif event == 'return':
        ret_repr = _safe_repr(arg) if arg is not None else 'None'
        msg = f'Return from {func_name}()' if func_name != '<module>' else 'Program end'
        etype = 'return' if func_name != '<module>' else 'program-end'
        ok = _emit(etype, lineno, curr_vars, changed, message=msg,
                   func_name=func_name if func_name != '<module>' else None,
                   ret_val=ret_repr if func_name != '<module>' else None)
        if not ok:
            raise StopIteration('__trace_step_limit__')
    elif event == 'exception':
        exc_type, exc_val, _ = arg
        msg = f'{exc_type.__name__}: {exc_val}'
        _emit('error', lineno, curr_vars, changed, message=msg)

    return _tracer

# ---------- stdout capture ----------

import io
class _CapturingStream(io.TextIOBase):
    def __init__(self, original):
        self._buf = []
        self._orig = original
    def write(self, s):
        self._buf.append(s)
        return len(s)
    def flush(self):
        pass
    def getvalue(self):
        return ''.join(self._buf)

_cap = _CapturingStream(sys.stdout)
sys.stdout = _cap

# ---------- run user code ----------

_status = 'completed'
_error_msg = None

try:
    sys.settrace(_tracer)
    with open(_USER_FILE, 'r', encoding='utf-8') as _f:
        _src = _f.read()
    exec(compile(_src, _USER_FILE, 'exec'), {'__name__': '__main__', '__file__': _USER_FILE})
except StopIteration as _e:
    if '__trace_step_limit__' in str(_e):
        _status = 'step-limit'
    else:
        _error_msg = str(_e)
        _status = 'error'
except SystemExit:
    pass
except Exception as _e:
    _status = 'error'
    _error_msg = f'{type(_e).__name__}: {_e}'
    _emit('error', None, {}, [], message=_error_msg)
finally:
    sys.settrace(None)

sys.stdout = _cap._orig
_captured_stdout = _cap.getvalue()

# ---------- output result ----------

print(json.dumps({
    'status': _status,
    'events': _EVENTS,
    'totalSteps': _STEP,
    'stdout': _captured_stdout,
    'error': _error_msg,
}, ensure_ascii=False))
`;

interface ProcessRunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}

export class PythonTraceProvider implements ITraceProvider {
  private isWindows = os.platform() === 'win32';

  async trace(request: TraceRequest): Promise<TraceResult> {
    const { code, stdin = '', maxSteps = DEFAULT_MAX_TRACE_STEPS } = request;
    const trimmed = code.trim();

    if (!trimmed) {
      return this.unsupported('No code available to trace.');
    }

    const checker = this.isWindows ? 'where.exe' : 'which';
    let pyBin = 'python';
    const pyCheck = await this.runProcess(checker, ['python'], process.cwd(), '', 2000);
    if (pyCheck.exitCode !== 0) {
      const py3Check = await this.runProcess(checker, ['python3'], process.cwd(), '', 2000);
      if (py3Check.exitCode !== 0) {
        return this.unsupported('Python runtime not found. Install Python and ensure it is on your PATH.');
      }
      pyBin = 'python3';
    }

    const uniqueId = crypto.randomUUID();
    const tmpDir = path.join(os.tmpdir(), `codespace-trace-py-${uniqueId}`);

    try {
      await fs.mkdir(tmpDir, { recursive: true });

      const userFile = path.join(tmpDir, 'user_code.py');
      const wrapperFile = path.join(tmpDir, 'tracer_wrapper.py');

      await fs.writeFile(userFile, code, 'utf-8');
      await fs.writeFile(wrapperFile, TRACER_BOOTSTRAP(userFile, maxSteps, !!stdin.trim()), 'utf-8');

      const startTime = performance.now();
      const run = await this.runProcess(pyBin, [wrapperFile], tmpDir, stdin, 10000);
      const executionTimeMs = Math.round(performance.now() - startTime);

      if (run.timedOut) {
        return {
          status: 'timeout',
          events: [],
          totalSteps: 0,
          stdout: '',
          stderr: 'Trace timed out.',
          executionTimeMs,
          language: 'python',
        };
      }

      const raw = run.stdout.trim();
      if (!raw) {
        return {
          status: 'error',
          events: [],
          totalSteps: 0,
          stdout: '',
          stderr: run.stderr || 'Trace produced no output.',
          executionTimeMs,
          language: 'python',
        };
      }

      let parsed: {
        status: string;
        events: TraceEvent[];
        totalSteps: number;
        stdout: string;
        error?: string;
      };

      try {
        parsed = JSON.parse(raw);
      } catch {
        return {
          status: 'error',
          events: [],
          totalSteps: 0,
          stdout: '',
          stderr: `Trace output parse error: ${run.stderr || raw.slice(0, 300)}`,
          executionTimeMs,
          language: 'python',
        };
      }

      return {
        status: parsed.status as TraceResult['status'],
        events: parsed.events || [],
        totalSteps: parsed.totalSteps || 0,
        stdout: parsed.stdout || '',
        stderr: run.stderr || '',
        executionTimeMs,
        error: parsed.error ?? undefined,
        language: 'python',
      };
    } finally {
      try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  }

  private unsupported(msg: string): TraceResult {
    return { status: 'unsupported', events: [], totalSteps: 0, error: msg, language: 'python' };
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
