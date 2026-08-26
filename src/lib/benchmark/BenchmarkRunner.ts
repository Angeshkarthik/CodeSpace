import { ExecutionResult } from '@/lib/execution/types';
import {
  BenchmarkRequest,
  BenchmarkResult,
  BenchmarkRun,
  MAX_BENCHMARK_RUNS,
  calcMedian,
  computeFingerprint,
} from './types';

// ---------------------------------------------------------------------------
// BenchmarkRunner
//
// Runs the user's program N times sequentially by calling the existing
// /api/execute endpoint — the same pathway used by Run and Test.
//
// NO separate compiler engine. NO second execution system. NO AI calls.
// NO tracing. Benchmark is pure repeated execution + timing collection.
//
// Timing source:
//   ExecutionResult.executionTimeMs — this is the server-side timing
//   from LocalExecutionProvider (wall-clock around child process).
//   If the provider returns no timing, we fall back to client-side round-trip
//   timing (clearly labelled in the result as partial info).
//
// Cancellation:
//   The caller passes an AbortSignal. When cancelled, no new runs are started.
//   The currently-in-flight fetch is also cancelled via the same signal.
// ---------------------------------------------------------------------------

export type BenchmarkProgressCallback = (
  completed: number,
  total: number,
  lastRun: BenchmarkRun | null
) => void;

export async function runBenchmark(
  request: BenchmarkRequest,
  signal: AbortSignal,
  onProgress?: BenchmarkProgressCallback
): Promise<BenchmarkResult> {
  const { language, code, stdin, mode, runs } = request;

  // Guard: clamp runs to safe maximum
  const safeRuns = Math.min(Math.max(1, runs), MAX_BENCHMARK_RUNS);

  const fingerprint = computeFingerprint(language, code, stdin);

  const completedRuns: BenchmarkRun[] = [];
  let cancelled = false;

  // Detect compile error early: if first run fails with compile_error, stop.
  // This avoids N identical compile attempts on broken code.
  let earlyStopReason: string | undefined;

  for (let i = 0; i < safeRuns; i++) {
    // Check cancellation before each new run
    if (signal.aborted) {
      cancelled = true;
      break;
    }

    // Client-side round-trip timer as fallback (labelled honestly)
    const clientStart = performance.now();

    let execRes: ExecutionResult;
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, language, code, stdin }),
        signal, // propagate AbortSignal to fetch
      });
      execRes = await res.json();
    } catch (err: unknown) {
      if (signal.aborted) {
        cancelled = true;
        break;
      }
      // Network / fetch error
      const msg = err instanceof Error ? err.message : String(err);
      completedRuns.push({
        runNumber: i + 1,
        executionTimeMs: 0,
        status: 'error',
        output: '',
        error: `Fetch error: ${msg}`,
      });
      onProgress?.(completedRuns.length, safeRuns, completedRuns[completedRuns.length - 1]);
      continue;
    }

    const clientRoundTrip = Math.round(performance.now() - clientStart);

    // Determine per-run timing:
    // Prefer provider-reported executionTimeMs (server-side runtime).
    // Fall back to client round-trip ONLY if provider gives no timing.
    const isRoundTripFallback = execRes.executionTimeMs === undefined || execRes.executionTimeMs === null;
    const timingMs = execRes.executionTimeMs ?? clientRoundTrip;

    let run: BenchmarkRun;

    if (execRes.status === 'compile_error') {
      run = {
        runNumber: i + 1,
        executionTimeMs: 0,
        isRoundTripFallback,
        status: 'compile_error',
        output: '',
        error: execRes.stderr || 'Compilation failed.',
      };
      completedRuns.push(run);
      onProgress?.(completedRuns.length, safeRuns, run);
      // Stop benchmark: every subsequent run will produce the same compile error
      earlyStopReason = `Compilation Error:\n${execRes.stderr || 'Compilation failed.'}`;
      break;
    }

    if (execRes.status === 'timeout') {
      run = {
        runNumber: i + 1,
        executionTimeMs: timingMs,
        isRoundTripFallback,
        status: 'timeout',
        output: execRes.stdout || '',
        error: execRes.stderr || 'Execution timed out.',
      };
    } else if (execRes.status !== 'success') {
      run = {
        runNumber: i + 1,
        executionTimeMs: 0,
        isRoundTripFallback,
        status: 'error',
        output: execRes.stdout || '',
        error: execRes.stderr || `Execution failed (${execRes.status})`,
      };
    } else {
      run = {
        runNumber: i + 1,
        executionTimeMs: timingMs,
        isRoundTripFallback,
        status: 'success',
        output: execRes.stdout || '',
      };
    }

    completedRuns.push(run);
    onProgress?.(completedRuns.length, safeRuns, run);
  }

  // Compute statistics from successful runs only
  const successfulRuns = completedRuns.filter((r) => r.status === 'success');
  const failedRuns = completedRuns.filter((r) => r.status !== 'success');
  const timingsMs = successfulRuns.map((r) => r.executionTimeMs);
  const isAnyRoundTripFallback = completedRuns.some((r) => r.isRoundTripFallback);

  let fastestMs: number | undefined;
  let slowestMs: number | undefined;
  let averageMs: number | undefined;
  let medianMs: number | undefined;

  if (timingsMs.length > 0) {
    fastestMs = Math.min(...timingsMs);
    slowestMs = Math.max(...timingsMs);
    averageMs = timingsMs.reduce((s, t) => s + t, 0) / timingsMs.length;
    medianMs = calcMedian(timingsMs);
  }

  // Output consistency check
  const outputs = successfulRuns.map((r) => r.output.trim());
  const uniqueOutputs = new Set(outputs);
  const outputVaried = uniqueOutputs.size > 1;

  // Determine overall status
  let status: BenchmarkResult['status'];
  if (cancelled) {
    status = completedRuns.length > 0 ? 'partial' : 'failed';
  } else if (earlyStopReason) {
    status = successfulRuns.length === 0 ? 'failed' : 'partial';
  } else if (successfulRuns.length === 0) {
    status = 'failed';
  } else if (failedRuns.length > 0) {
    status = 'partial';
  } else {
    status = 'completed';
  }

  return {
    status: cancelled ? 'cancelled' : status,
    runsRequested: safeRuns,
    runsCompleted: completedRuns.length,
    successfulRuns: successfulRuns.length,
    failedRuns: failedRuns.length,
    timingsMs,
    fastestMs,
    slowestMs,
    averageMs,
    medianMs,
    executionMode: mode,
    language,
    isRoundTripFallback: isAnyRoundTripFallback,
    fingerprint,
    outputVaried,
    error: earlyStopReason,
  };
}
