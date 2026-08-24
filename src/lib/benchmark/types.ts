import { LanguageType } from '@/types';

/** Maximum number of benchmark runs allowed */
export const MAX_BENCHMARK_RUNS = 100;

/** Default number of runs */
export const DEFAULT_BENCHMARK_RUNS = 10;

/** Preset run count options exposed to the UI */
export const BENCHMARK_RUN_PRESETS = [5, 10, 25, 50] as const;

export interface BenchmarkRun {
  runNumber: number;
  /** Execution time from the provider's ExecutionResult.executionTimeMs (server-side timing). */
  executionTimeMs: number;
  /** True if client round-trip timing was used as fallback because provider execution time was unavailable */
  isRoundTripFallback?: boolean;
  status: 'success' | 'error' | 'timeout' | 'compile_error';
  /** Stdout of this run (used for output-consistency check) */
  output: string;
  /** Stderr / error message for failed runs */
  error?: string;
}

export interface BenchmarkResult {
  status: 'completed' | 'partial' | 'failed' | 'cancelled';

  runsRequested: number;
  runsCompleted: number;
  successfulRuns: number;
  failedRuns: number;

  /** Timings from successful runs only (ms) */
  timingsMs: number[];

  /** Computed statistics — only present when successfulRuns > 0 */
  fastestMs?: number;
  slowestMs?: number;
  averageMs?: number;
  medianMs?: number;

  executionMode?: string;
  language: LanguageType;

  /** True if any run relied on client round-trip fallback timing */
  isRoundTripFallback?: boolean;

  /** Lightweight fingerprint: `${language}::${code}::${input}`.
   *  Used to detect stale results when code/input/language changes. */
  fingerprint: string;

  /** True if at least two successful runs produced different stdout */
  outputVaried: boolean;

  error?: string;
}

export interface BenchmarkRequest {
  language: LanguageType;
  code: string;
  stdin: string;
  mode?: string;
  runs: number;
}

/** Compute a simple fingerprint for stale-detection (no heavy dep needed). */
export function computeFingerprint(
  language: LanguageType,
  code: string,
  input: string
): string {
  // Lightweight djb2-style hash — good enough for stale detection
  let h = 5381;
  const s = `${language}::${code}::${input}`;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  return `${language}:${h.toString(16)}`;
}

/** Calculate median from a sorted (or unsorted) array of numbers. */
export function calcMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** Round to 1 decimal place for display. */
export function fmtMs(ms: number): string {
  return ms.toFixed(1);
}
