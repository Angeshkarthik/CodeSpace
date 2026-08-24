'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Gauge,
  Play,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart2,
} from 'lucide-react';
import { BenchmarkResult, BENCHMARK_RUN_PRESETS, DEFAULT_BENCHMARK_RUNS, fmtMs } from '@/lib/benchmark/types';
import { LanguageType } from '@/types';
interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: BenchmarkResult | null;
  isBenchmarking: boolean;
  benchmarkProgress: { completed: number; total: number } | null;
  error: string | null;
  language: LanguageType;
  mode?: string;
  /** Input currently in the editor Input panel */
  currentInput: string;
  onRunBenchmark: (runs: number) => void;
  onCancelBenchmark: () => void;
  /** Whether result is stale (code/input/language changed since last benchmark) */
  isStale: boolean;
}

const LANGUAGE_LABELS: Record<LanguageType, string> = {
  c: 'C',
  cpp: 'C++',
  python: 'Python',
  java: 'Java',
};

// ─── Stat row ────────────────────────────────────────────────────────────────
function StatRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded hover:bg-[#21262d] transition-colors">
      <span className="text-[11px] text-gray-400 font-medium">{label}</span>
      <span className={`font-mono text-sm font-semibold ${accent ? 'text-emerald-300' : 'text-gray-100'}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function RunTimingChart({ timings }: { timings: number[] }) {
  if (timings.length < 2) return null;
  const max = Math.max(...timings);
  const min = Math.min(...timings);
  const range = max - min || 1;

  return (
    <div className="mt-2 mb-1">
      <div className="flex items-end gap-0.5 h-10">
        {timings.map((t, i) => {
          const pct = ((t - min) / range) * 80 + 20; // 20-100% height
          const isMin = t === min;
          const isMax = t === max;
          return (
            <div
              key={i}
              title={`Run ${i + 1}: ${fmtMs(t)} ms`}
              className={`flex-1 rounded-t-sm transition-all ${
                isMin ? 'bg-emerald-500' : isMax ? 'bg-red-500/70' : 'bg-violet-500/60'
              }`}
              style={{ height: `${pct}%` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-gray-600 font-mono mt-0.5 px-0.5">
        <span>1</span>
        <span>{timings.length}</span>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: BenchmarkResult['status'] }) {
  const map: Record<BenchmarkResult['status'], { label: string; cls: string }> = {
    completed: { label: 'Completed', cls: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40' },
    partial: { label: 'Partial', cls: 'bg-amber-900/40 text-amber-300 border-amber-700/40' },
    failed: { label: 'Failed', cls: 'bg-red-900/40 text-red-300 border-red-700/40' },
    cancelled: { label: 'Cancelled', cls: 'bg-gray-700/40 text-gray-300 border-gray-600/40' },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({
  isOpen,
  onClose,
  result,
  isBenchmarking,
  benchmarkProgress,
  error,
  language,
  mode,
  currentInput,
  onRunBenchmark,
  onCancelBenchmark,
  isStale,
}) => {
  const [selectedRuns, setSelectedRuns] = useState(DEFAULT_BENCHMARK_RUNS);
  const [showAllRuns, setShowAllRuns] = useState(false);

  // Reset showAllRuns when result changes
  useEffect(() => {
    setShowAllRuns(false);
  }, [result]);

  const handleStart = useCallback(() => {
    if (isBenchmarking) return;
    onRunBenchmark(selectedRuns);
  }, [isBenchmarking, onRunBenchmark, selectedRuns]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBenchmarking) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, isBenchmarking, onClose]);

  if (!isOpen) return null;

  const hasStats = result && result.successfulRuns > 0;
  const previewRuns = result?.timingsMs ?? [];
  const displayRuns = showAllRuns ? previewRuns : previewRuns.slice(0, 15);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 pointer-events-auto"
        onClick={() => { if (!isBenchmarking) onClose(); }}
      />

      {/* Panel */}
      <div className="relative z-10 flex flex-col h-full w-[380px] bg-[#0d1117] border-l border-[#30363d] pointer-events-auto shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#161b22] shrink-0">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-gray-100">Benchmark</span>
          </div>
          <button
            onClick={onClose}
            disabled={isBenchmarking}
            className="p-1 rounded hover:bg-[#30363d] text-gray-400 hover:text-gray-100 transition-colors disabled:opacity-40"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Config bar ── */}
        <div className="shrink-0 px-4 py-3 border-b border-[#30363d] bg-[#0d1117] space-y-3">
          {/* Language */}
          <div className="flex gap-3 text-[11px] text-gray-400">
            <span>
              Language:{' '}
              <span className="text-gray-200 font-semibold">{LANGUAGE_LABELS[language]}</span>
            </span>
          </div>

          {/* Run count selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 shrink-0">Runs</span>
            <div className="flex gap-1">
              {BENCHMARK_RUN_PRESETS.map((n) => (
                <button
                  key={n}
                  onClick={() => setSelectedRuns(n)}
                  disabled={isBenchmarking}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border transition-colors ${
                    selectedRuns === n
                      ? 'bg-amber-600/30 border-amber-500/50 text-amber-300'
                      : 'bg-[#21262d] border-[#30363d] text-gray-400 hover:text-gray-200'
                  } disabled:opacity-40`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Input preview */}
          {currentInput.trim() && (
            <div className="text-[10px] text-gray-500 font-mono">
              Input:{' '}
              <span className="text-gray-400">
                {currentInput.slice(0, 40)}{currentInput.length > 40 ? '…' : ''}
              </span>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">

          {/* Stale warning */}
          {isStale && result && !isBenchmarking && (
            <div className="flex items-start gap-2 bg-amber-900/15 border border-amber-700/30 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300">
                Benchmark results are outdated — code, input, language, or mode changed. Run Benchmark again.
              </p>
            </div>
          )}

          {/* In-progress */}
          {isBenchmarking && benchmarkProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                  Benchmarking...
                </span>
                <span className="font-mono text-[11px] text-gray-400">
                  Run {benchmarkProgress.completed} / {benchmarkProgress.total}
                </span>
              </div>
              <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${(benchmarkProgress.completed / benchmarkProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* API error */}
          {error && !isBenchmarking && (
            <div className="flex items-start gap-2 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-200 font-mono break-all">{error}</p>
            </div>
          )}

          {/* Compile error from result */}
          {result?.error && !isBenchmarking && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
              <p className="text-[10px] text-red-400 font-mono uppercase tracking-wide mb-1">Benchmark stopped</p>
              <pre className="text-[10px] text-red-200 font-mono whitespace-pre-wrap break-all">{result.error}</pre>
            </div>
          )}

          {/* Output variation warning */}
          {result?.outputVaried && !isBenchmarking && (
            <div className="flex items-start gap-2 bg-amber-900/15 border border-amber-700/30 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300">
                Output varied between benchmark runs. This program may use random values, time, or other non-deterministic state.
              </p>
            </div>
          )}

          {/* Results summary */}
          {result && !isBenchmarking && (
            <>
              {/* Status + run count */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <StatusBadge status={result.status} />
                  <span className="text-[11px] font-mono text-gray-400">
                    {result.successfulRuns} / {result.runsCompleted} successful
                  </span>
                </div>

                {/* Fallback notice if round-trip timer used */}
                {result.isRoundTripFallback && (
                  <p className="text-[10px] text-amber-400/80">
                    Timings reflect client HTTP Round-trip time (server execution time was unavailable).
                  </p>
                )}
              </div>

              {/* Statistics */}
              {hasStats && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wide px-3 pt-2 pb-1">
                    {result.isRoundTripFallback ? 'Round-trip Statistics' : 'Runtime Statistics'}
                  </p>
                  <StatRow label="Fastest" value={`${fmtMs(result.fastestMs!)} ms`} accent />
                  <StatRow label="Average" value={`${fmtMs(result.averageMs!)} ms`} />
                  <StatRow label="Median"  value={`${fmtMs(result.medianMs!)} ms`} />
                  <StatRow label="Slowest" value={`${fmtMs(result.slowestMs!)} ms`} />

                  {/* Chart */}
                  {result.timingsMs.length >= 2 && (
                    <div className="px-3 pb-3">
                      <div className="flex items-center gap-1 mb-1 mt-2">
                        <BarChart2 className="w-3 h-3 text-gray-500" />
                        <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wide">Run times</span>
                      </div>
                      <RunTimingChart timings={result.timingsMs} />
                    </div>
                  )}
                </div>
              )}

              {/* Per-run table */}
              {result.timingsMs.length > 0 && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wide px-3 pt-2 pb-1">
                    Individual Runs
                  </p>
                  <div className="divide-y divide-[#21262d]">
                    {displayRuns.map((t, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-1.5 text-[11px] font-mono"
                      >
                        <span className="text-gray-500">{i + 1}</span>
                        <span className={t === result.fastestMs ? 'text-emerald-300 font-semibold' : t === result.slowestMs ? 'text-red-300' : 'text-gray-300'}>
                          {fmtMs(t)} ms
                        </span>
                      </div>
                    ))}
                  </div>
                  {previewRuns.length > 15 && (
                    <button
                      onClick={() => setShowAllRuns((p) => !p)}
                      className="w-full text-center py-1.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors border-t border-[#21262d]"
                    >
                      {showAllRuns ? 'Show less' : `Show all ${previewRuns.length} runs`}
                    </button>
                  )}
                </div>
              )}

              {/* Failed run info */}
              {result.failedRuns > 0 && (
                <div className="flex items-center gap-2 text-[11px] text-amber-400 bg-amber-900/10 border border-amber-700/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {result.failedRuns} run{result.failedRuns > 1 ? 's' : ''} failed — excluded from statistics.
                </div>
              )}

              {/* Environment disclaimer */}
              <p className="text-[10px] text-gray-600 leading-relaxed">
                Benchmark results depend on your hardware, runtime, compiler, system load, and execution environment. Results from different environments are not directly comparable.
              </p>
            </>
          )}

          {/* Empty state */}
          {!result && !isBenchmarking && !error && (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500 gap-2">
              <Gauge className="w-8 h-8 opacity-30" />
              <p className="text-xs text-center">
                Select a run count and press <span className="text-amber-400 font-semibold">Run Benchmark</span> to measure execution speed.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div className="shrink-0 border-t border-[#30363d] bg-[#0d1117] p-3 flex gap-2">
          {isBenchmarking ? (
            <button
              onClick={onCancelBenchmark}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700/40 text-red-300 rounded text-xs font-semibold transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Benchmark
            </button>
          ) : (
            <>
              <button
                onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-600/80 hover:bg-amber-500/80 text-white rounded text-xs font-semibold transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Benchmark ({selectedRuns} runs)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
