'use client';

import React, { useEffect, useMemo } from 'react';
import {
  X,
  ArrowLeftRight,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Gauge,
  Layers,
  FlaskConical,
  Activity,
  FileCode2,
  RefreshCw,
} from 'lucide-react';
import { DiffEditor } from '@monaco-editor/react';
import { MONACO_LANG_MAP } from '@/lib/constants';
import { CodeSnapshot, FullComparisonResult } from '@/lib/compare/types';
import { compareSnapshots } from '@/lib/compare/CompareManager';
import { fmtMs } from '@/lib/benchmark/types';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshotA: CodeSnapshot | null;
  snapshotB: CodeSnapshot;
  currentCode: string;
  onTakeSnapshot: () => void;
  onOpenBenchmarkModal: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  snapshotA,
  snapshotB,
  currentCode,
  onTakeSnapshot,
  onOpenBenchmarkModal,
}) => {
  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Compute full comparison result deterministically
  const comparisonResult: FullComparisonResult | null = useMemo(() => {
    if (!snapshotA || !snapshotB) return null;
    return compareSnapshots(snapshotA, snapshotB, currentCode);
  }, [snapshotA, snapshotB, currentCode]);

  if (!isOpen) return null;

  const monacoLanguage = MONACO_LANG_MAP[snapshotB.language] || 'plaintext';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex flex-col w-full max-w-6xl h-[90vh] bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#30363d] bg-[#161b22] shrink-0">
          <div className="flex items-center gap-2.5">
            <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                Compare Code
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-[#21262d] text-gray-400 border border-[#30363d]">
                  Phase 3C
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Compare code structure, static complexity, DSA patterns, and benchmark evidence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onTakeSnapshot}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] active:bg-[#161b22] text-gray-200 border border-[#30363d] rounded text-xs font-medium transition-colors cursor-pointer"
              title="Save current editor code as Version A snapshot"
            >
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              <span>Snapshot Current Code</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#30363d] text-gray-400 hover:text-gray-100 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Body Container ── */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-4">

          {/* Missing Version A State */}
          {!snapshotA ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-4">
              <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-full text-amber-400">
                <Camera className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-semibold text-gray-200">No Version A Snapshot Saved</h3>
                <p className="text-xs text-gray-400">
                  Save your current program code as a snapshot (Version A), edit your code to optimize it (Version B), and open Compare again to view structural and performance differences.
                </p>
              </div>
              <button
                onClick={onTakeSnapshot}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Save Current Code as Snapshot (Version A)</span>
              </button>
            </div>
          ) : (
            <>
              {/* ── Version Header Badges & Stale Warning ── */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                {/* Version A Info */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 font-semibold">
                    Version A (Snapshot)
                  </span>
                  <span className="text-gray-300 font-medium">{snapshotA.label}</span>
                  <span className="text-gray-500 text-[11px]">
                    ({new Date(snapshotA.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                  </span>
                </div>

                <ArrowLeftRight className="w-4 h-4 text-gray-500 hidden sm:block" />

                {/* Version B Info */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-sky-900/40 text-sky-300 border border-sky-700/40 font-semibold">
                    Version B (Current Code)
                  </span>
                  <span className="text-gray-300 font-medium">{snapshotB.label}</span>
                  <span className="text-gray-500 text-[11px]">
                    ({new Date(snapshotB.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                  </span>
                </div>
              </div>

              {/* Stale Warning Banner */}
              {comparisonResult?.isStale && (
                <div className="flex items-start gap-2 bg-amber-900/15 border border-amber-700/30 rounded-lg px-3.5 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-300 space-y-0.5">
                    <p className="font-semibold">Current editor code has changed</p>
                    <p className="text-[11px] text-amber-300/80">
                      The current code in the editor was modified after this comparison view was generated. Press "Snapshot Current Code" to update Version A or re-open Compare to refresh Version B.
                    </p>
                  </div>
                </div>
              )}

              {/* Language Mismatch Warning */}
              {!comparisonResult?.languageMatch && (
                <div className="flex items-start gap-2 bg-red-900/20 border border-red-700/30 rounded-lg px-3.5 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-200">
                    Comparison requires both versions to use the same language. Version A uses <span className="font-semibold uppercase">{snapshotA.language}</span> and Version B uses <span className="font-semibold uppercase">{snapshotB.language}</span>. Code diff is shown below, but performance comparisons are disabled.
                  </p>
                </div>
              )}

              {/* ── Section 1: Monaco Diff Editor ── */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden flex flex-col h-[280px]">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#30363d] bg-[#0d1117] text-[11px] font-mono text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-gray-400" />
                    Source Code Diff (Version A ↔ Version B)
                  </span>
                  <span className="text-gray-500 uppercase">{snapshotB.language}</span>
                </div>
                <div className="flex-1 min-h-0 relative">
                  <DiffEditor
                    height="100%"
                    language={monacoLanguage}
                    original={snapshotA.code}
                    modified={snapshotB.code}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      renderSideBySide: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      originalEditable: false,
                    }}
                  />
                </div>
              </div>

              {/* ── Section 2: Side-by-Side Comparison Cards Grid ── */}
              {comparisonResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* ── Card 1: Static Complexity ── */}
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                      <span className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-sky-400" />
                        Static Complexity Analysis
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">Deterministic Engine</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Time Complexity Row */}
                      <div className="bg-[#0d1117] border border-[#21262d] rounded p-2.5 space-y-1">
                        <div className="text-[11px] text-gray-400 font-medium">Time Complexity</div>
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-gray-300">
                            Version A: <strong className="text-gray-100">{comparisonResult.complexity.versionATime}</strong>
                            {comparisonResult.complexity.versionAConfidence && (
                              <span className="text-[10px] text-gray-500 ml-1">({comparisonResult.complexity.versionAConfidence})</span>
                            )}
                          </span>
                          <span className="text-gray-500">→</span>
                          <span className="text-gray-300">
                            Version B: <strong className="text-gray-100">{comparisonResult.complexity.versionBTime}</strong>
                            {comparisonResult.complexity.versionBConfidence && (
                              <span className="text-[10px] text-gray-500 ml-1">({comparisonResult.complexity.versionBConfidence})</span>
                            )}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-300 pt-0.5 font-medium">
                          {comparisonResult.complexity.timeSummary}
                        </p>
                      </div>

                      {/* Space Complexity Row */}
                      <div className="bg-[#0d1117] border border-[#21262d] rounded p-2.5 space-y-1">
                        <div className="text-[11px] text-gray-400 font-medium">Auxiliary Space Complexity</div>
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-gray-300">
                            Version A: <strong className="text-gray-100">{comparisonResult.complexity.versionASpace}</strong>
                          </span>
                          <span className="text-gray-500">→</span>
                          <span className="text-gray-300">
                            Version B: <strong className="text-gray-100">{comparisonResult.complexity.versionBSpace}</strong>
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-300 pt-0.5">
                          {comparisonResult.complexity.spaceSummary}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── Card 2: Benchmark Evidence ── */}
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                      <span className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-amber-400" />
                        Observed Benchmark Evidence
                      </span>
                      {!comparisonResult.benchmark.isComparable && (
                        <button
                          onClick={onOpenBenchmarkModal}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-mono underline cursor-pointer"
                          title="Run benchmark tool for current editor code (Version B)"
                        >
                          Benchmark Current Code
                        </button>
                      )}
                    </div>

                    {comparisonResult.benchmark.isComparable ? (
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2 bg-[#0d1117] border border-[#21262d] rounded p-2.5 font-mono">
                          <div>
                            <div className="text-[10px] text-gray-500 uppercase">Version A Average</div>
                            <div className="text-sm font-semibold text-gray-200">
                              {fmtMs(comparisonResult.benchmark.versionAAvgMs!)} ms
                            </div>
                            <div className="text-[10px] text-gray-500">
                              Median: {fmtMs(comparisonResult.benchmark.versionAMedianMs!)} ms
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] text-gray-500 uppercase">Version B Average</div>
                            <div className="text-sm font-semibold text-emerald-300">
                              {fmtMs(comparisonResult.benchmark.versionBAvgMs!)} ms
                            </div>
                            <div className="text-[10px] text-gray-500">
                              Median: {fmtMs(comparisonResult.benchmark.versionBMedianMs!)} ms
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#0d1117] border border-[#21262d] rounded p-2.5">
                          <p className="text-[11px] text-emerald-300 font-medium">
                            {comparisonResult.benchmark.summary}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#0d1117] border border-[#21262d] rounded p-3 text-xs space-y-1.5">
                        <p className="text-gray-400 font-mono text-[11px]">
                          {comparisonResult.benchmark.uncomparableReason || 'Benchmark comparison unavailable.'}
                        </p>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          Benchmark comparison requires both versions to have recorded benchmark evidence using the same language and input. "Benchmark Current Code" benchmarks active editor code (Version B).
                        </p>
                      </div>
                    )}

                    <p className="text-[10px] text-gray-600 leading-tight italic">
                      Observed runtime is environment-dependent and varies by hardware, compiler, and system load.
                    </p>
                  </div>

                  {/* ── Card 3: DSA Pattern Comparison ── */}
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                      <span className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-violet-400" />
                        Detected Structural & DSA Patterns
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="bg-[#0d1117] border border-[#21262d] rounded p-2.5 space-y-1">
                        <div className="text-[10px] text-gray-500 uppercase">Version A Patterns</div>
                        {comparisonResult.dsaPatternsA.length > 0 ? (
                          <ul className="space-y-1 text-gray-300 text-[11px]">
                            {comparisonResult.dsaPatternsA.map((p, idx) => (
                              <li key={idx} className="flex items-center gap-1">
                                <span className="text-gray-600">•</span> {p}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 text-[11px]">Standard structural logic</p>
                        )}
                      </div>

                      <div className="bg-[#0d1117] border border-[#21262d] rounded p-2.5 space-y-1">
                        <div className="text-[10px] text-gray-500 uppercase">Version B Patterns</div>
                        {comparisonResult.dsaPatternsB.length > 0 ? (
                          <ul className="space-y-1 text-emerald-300 text-[11px]">
                            {comparisonResult.dsaPatternsB.map((p, idx) => (
                              <li key={idx} className="flex items-center gap-1">
                                <span className="text-emerald-500">•</span> {p}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 text-[11px]">Standard structural logic</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Card 4: Test & Execution Evidence ── */}
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                      <span className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                        <FlaskConical className="w-4 h-4 text-emerald-400" />
                        Test & Execution Evidence
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      {/* Test cases evidence */}
                      <div className="bg-[#0d1117] border border-[#21262d] rounded p-2.5 flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">Test Cases Passed:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300">
                            Version A: {snapshotA.tests ? `${snapshotA.tests.passed}/${snapshotA.tests.total}` : 'N/A'}
                          </span>
                          <span className="text-gray-600">→</span>
                          <span className="text-emerald-300">
                            Version B: {snapshotB.tests ? `${snapshotB.tests.passed}/${snapshotB.tests.total}` : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Execution status evidence */}
                      <div className="bg-[#0d1117] border border-[#21262d] rounded p-2.5 flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">Execution Status:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300">
                            Version A: {snapshotA.execution ? snapshotA.execution.status : 'N/A'}
                          </span>
                          <span className="text-gray-600">→</span>
                          <span className="text-gray-200">
                            Version B: {snapshotB.execution ? snapshotB.execution.status : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ── Section 3: Deterministic Comparison Summary ── */}
              {comparisonResult && comparisonResult.summaryItems.length > 0 && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2.5">
                  <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wide flex items-center gap-1.5 border-b border-[#21262d] pb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Comparison Summary
                  </h3>
                  <div className="space-y-1.5">
                    {comparisonResult.summaryItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 py-1.5 px-3 rounded bg-[#0d1117] border border-[#21262d] text-xs font-mono"
                      >
                        {item.variant === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        {item.variant === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                        {item.variant === 'neutral' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
                        <span className="text-gray-400 font-semibold shrink-0">{item.label}:</span>
                        <span className="text-gray-200 font-medium">{item.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* ── Modal Footer ── */}
        <div className="shrink-0 border-t border-[#30363d] bg-[#161b22] p-3 flex items-center justify-between">
          <div className="text-[11px] text-gray-500 font-mono">
            Deterministic static analysis & benchmark evidence • Phase 3C Compare
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
