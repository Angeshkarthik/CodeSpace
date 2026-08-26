'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  List,
  Code2,
  Layers,
} from 'lucide-react';
import { TraceResult, TraceEvent } from '@/lib/trace/types';
import { LanguageType } from '@/types';

interface TraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TraceResult | null;
  isLoading: boolean;
  error: string | null;
  language: LanguageType;
  /** Called when user requests a new trace run */
  onRequestTrace: () => void;
  onHighlightLine: (line: number | null) => void;
}

const PLAY_INTERVAL_MS = 800;

// ─── Helper: badge for status ────────────────────────────────────────────────
function StatusBadge({ status }: { status: TraceResult['status'] }) {
  const map: Record<TraceResult['status'], { label: string; cls: string }> = {
    completed: { label: 'Completed', cls: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40' },
    error: { label: 'Error', cls: 'bg-red-900/40 text-red-300 border-red-700/40' },
    timeout: { label: 'Timed out', cls: 'bg-amber-900/40 text-amber-300 border-amber-700/40' },
    'step-limit': { label: 'Step limit reached', cls: 'bg-amber-900/40 text-amber-300 border-amber-700/40' },
    unsupported: { label: 'Unsupported', cls: 'bg-gray-700/40 text-gray-300 border-gray-600/40' },
  };
  const { label, cls } = map[status] ?? map.error;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Helper: format variable value ────────────────────────────────────────────
function VarValue({ name, value, changed }: { name: string; value: string; changed: boolean }) {
  return (
    <div className={`flex items-baseline gap-2 py-1 px-2 rounded transition-colors ${changed ? 'bg-amber-900/20 border border-amber-700/30' : 'hover:bg-[#21262d]'}`}>
      <span className="font-mono text-[11px] text-sky-300 shrink-0 min-w-[80px]">{name}</span>
      <span className={`font-mono text-[11px] break-all ${changed ? 'text-amber-200' : 'text-gray-200'}`}>{value}</span>
      {changed && <span className="text-[9px] text-amber-400 font-semibold shrink-0">changed</span>}
    </div>
  );
}

// ─── Event type label ─────────────────────────────────────────────────────────
function eventLabel(ev: TraceEvent): string {
  if (ev.message) return ev.message;
  switch (ev.eventType) {
    case 'statement': return `Line ${ev.line ?? '?'}`;
    case 'variable-change': return 'Variable changed';
    case 'loop': return 'Loop iteration';
    case 'function-enter': return `Enter ${ev.functionName ?? 'function'}()`;
    case 'function-exit': return `Exit ${ev.functionName ?? 'function'}()`;
    case 'return': return `Return${ev.returnValue ? `: ${ev.returnValue}` : ''}`;
    case 'condition': return 'Condition evaluated';
    case 'program-end': return 'Program end';
    case 'error': return 'Error';
    default: return ev.eventType;
  }
}

function eventColor(type: TraceEvent['eventType']): string {
  switch (type) {
    case 'function-enter': return 'text-violet-300';
    case 'function-exit':
    case 'return': return 'text-indigo-300';
    case 'condition': return 'text-amber-300';
    case 'loop': return 'text-cyan-300';
    case 'program-end': return 'text-emerald-300';
    case 'error': return 'text-red-300';
    default: return 'text-gray-300';
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export const TraceModal: React.FC<TraceModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  error,
  language,
  onRequestTrace,
  onHighlightLine,
}) => {
  const [currentStep, setCurrentStep] = useState(0); // 0-based index into events array
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'state' | 'timeline'>('state');
  const playTimer = useRef<NodeJS.Timeout | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const events: TraceEvent[] = result?.events ?? [];
  const totalSteps = events.length;
  const currentEvent = totalSteps > 0 ? events[currentStep] : null;

  // Reset step when result changes
  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [result]);

  // Highlight line in editor whenever step changes
  useEffect(() => {
    if (currentEvent?.line) {
      onHighlightLine(currentEvent.line);
    } else {
      onHighlightLine(null);
    }
  }, [currentEvent, onHighlightLine]);

  // Clean up highlight when modal closes
  useEffect(() => {
    if (!isOpen) {
      onHighlightLine(null);
      setIsPlaying(false);
    }
  }, [isOpen, onHighlightLine]);

  // Auto-play
  useEffect(() => {
    if (isPlaying) {
      playTimer.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, PLAY_INTERVAL_MS);
    } else {
      if (playTimer.current) clearInterval(playTimer.current);
    }
    return () => { if (playTimer.current) clearInterval(playTimer.current); };
  }, [isPlaying, totalSteps]);

  // Scroll timeline to active item
  useEffect(() => {
    if (timelineRef.current && activeTab === 'timeline') {
      const item = timelineRef.current.querySelector(`[data-step="${currentStep}"]`);
      item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentStep, activeTab]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((p) => Math.max(0, p - 1));
  }, []);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((p) => Math.min(totalSteps - 1, p + 1));
  }, [totalSteps]);

  const handleRestart = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  const handleJumpTo = (idx: number) => {
    setIsPlaying(false);
    setCurrentStep(idx);
    setActiveTab('state');
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); handleNext(); }
      if (e.key === 'Escape') { onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen) return null;

  // Compute changed variables relative to previous step
  const changedSet = new Set(currentEvent?.changedVariables ?? []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end pointer-events-none">
      {/* Backdrop — only right panel is pointer-enabled */}
      <div
        className="absolute inset-0 bg-black/40 pointer-events-auto"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 flex flex-col h-full w-[380px] bg-[#0d1117] border-l border-[#30363d] pointer-events-auto shadow-2xl">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#161b22] shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-gray-100">Execution Trace</span>
            <span className="text-[10px] text-gray-500 font-mono px-1.5 py-0.5 bg-[#21262d] border border-[#30363d] rounded uppercase">{language}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#30363d] text-gray-400 hover:text-gray-100 transition-colors"
            title="Close trace panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Status bar ── */}
        {result && !isLoading && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#0d1117] border-b border-[#30363d] shrink-0 text-[11px] text-gray-400">
            <StatusBadge status={result.status} />
            <span className="ml-auto font-mono">{result.executionTimeMs != null ? `${result.executionTimeMs}ms` : ''}</span>
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-400">
              <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Tracing execution…</span>
            </div>
          )}

          {/* Error / unsupported */}
          {!isLoading && (error || (result && totalSteps === 0)) && (
            <div className="flex flex-col flex-1 p-4 gap-3">
              {/* Show status error or API error */}
              {(error || result?.error) && (
                <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-red-300 mb-1">
                      {result?.status === 'unsupported' ? 'Trace unavailable' :
                       result?.status === 'timeout' ? 'Trace timed out' :
                       result?.status === 'step-limit' ? 'Step limit reached' :
                       'Trace error'}
                    </p>
                    <pre className="text-[10px] text-red-200 whitespace-pre-wrap font-mono break-all">
                      {error ?? result?.error}
                    </pre>
                  </div>
                </div>
              )}
              {result?.stderr && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 mb-1 font-mono uppercase tracking-wide">Compiler / Runtime output</p>
                  <pre className="text-[10px] text-gray-300 whitespace-pre-wrap font-mono break-all">{result.stderr}</pre>
                </div>
              )}
              <button
                onClick={onRequestTrace}
                className="mt-auto px-4 py-1.5 bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold rounded shadow-sm transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-violet-500/50"
              >
                Retry Trace
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !result && !error && (
            <div className="flex flex-col items-center justify-center flex-1 py-10 text-gray-500 gap-3 px-4 text-center">
              <Activity className="w-8 h-8 opacity-30" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-300">No trace data</p>
                <p className="text-[11px]">
                  Run the trace to see step-by-step execution and variable state changes.
                </p>
              </div>
              <button
                onClick={onRequestTrace}
                className="mt-2 px-4 py-1.5 bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold rounded shadow-sm transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-violet-500/50"
              >
                Start Trace
              </button>
            </div>
          )}

          {/* Trace viewer */}
          {!isLoading && result && totalSteps > 0 && (
            <>
              {/* Step counter */}
              <div className="px-4 py-2 border-b border-[#30363d] bg-[#0d1117] shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-300">
                    Step <span className="text-violet-300 font-bold">{currentStep + 1}</span>
                    <span className="text-gray-500"> / {totalSteps}</span>
                  </span>
                  {currentEvent?.line && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                      <Code2 className="w-3 h-3" /> Line {currentEvent.line}
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <div className="mt-1.5 h-1 bg-[#21262d] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all duration-200"
                    style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#30363d] shrink-0 bg-[#0d1117]">
                <button
                  onClick={() => setActiveTab('state')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium border-b-2 transition-colors ${activeTab === 'state' ? 'border-violet-500 text-violet-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                >
                  <Layers className="w-3 h-3" /> State
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium border-b-2 transition-colors ${activeTab === 'timeline' ? 'border-violet-500 text-violet-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                >
                  <List className="w-3 h-3" /> Timeline
                </button>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto min-h-0">

                {/* ── State tab ── */}
                {activeTab === 'state' && currentEvent && (
                  <div className="p-3 space-y-3">
                    {/* Event card */}
                    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wide mb-1">Event</p>
                      <p className={`text-xs font-semibold ${eventColor(currentEvent.eventType)}`}>
                        {eventLabel(currentEvent)}
                      </p>
                    </div>

                    {/* Variables */}
                    {Object.keys(currentEvent.variables).length > 0 && (
                      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wide px-2 pt-2 pb-1">Variables</p>
                        <div className="divide-y divide-[#21262d]">
                          {Object.entries(currentEvent.variables).map(([k, v]) => (
                            <VarValue key={k} name={k} value={v} changed={changedSet.has(k)} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Changed variables callout */}
                    {changedSet.size > 0 && (
                      <div className="bg-amber-900/10 border border-amber-700/30 rounded-lg p-3">
                        <p className="text-[10px] text-amber-500 font-mono uppercase tracking-wide mb-1.5">Changed</p>
                        <div className="space-y-1">
                          {Array.from(changedSet).map((varName) => {
                            const prevEvent = currentStep > 0 ? events[currentStep - 1] : null;
                            const prevVal = prevEvent?.variables[varName] ?? '—';
                            const currVal = currentEvent.variables[varName] ?? '—';
                            return (
                              <div key={varName} className="text-[11px] font-mono">
                                <span className="text-amber-300">{varName}</span>
                                <span className="text-gray-500 mx-1">:</span>
                                <span className="text-gray-400 line-through">{prevVal}</span>
                                <span className="text-amber-200 mx-1">→</span>
                                <span className="text-emerald-300">{currVal}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Return value */}
                    {currentEvent.returnValue && (
                      <div className="bg-indigo-900/10 border border-indigo-700/30 rounded-lg p-3">
                        <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-wide mb-1">Return value</p>
                        <span className="font-mono text-sm text-indigo-200">{currentEvent.returnValue}</span>
                      </div>
                    )}

                    {/* Program output (shown at last step) */}
                    {currentStep === totalSteps - 1 && result.stdout && (
                      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wide mb-1">Program Output</p>
                        <pre className="text-xs text-gray-200 font-mono whitespace-pre-wrap">{result.stdout}</pre>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Timeline tab ── */}
                {activeTab === 'timeline' && (
                  <div ref={timelineRef} className="p-2 space-y-0.5">
                    {events.map((ev, idx) => (
                      <button
                        key={idx}
                        data-step={idx}
                        onClick={() => handleJumpTo(idx)}
                        className={`w-full text-left flex items-start gap-2 px-2 py-1.5 rounded transition-colors ${idx === currentStep ? 'bg-violet-900/30 border border-violet-700/40' : 'hover:bg-[#161b22]'}`}
                      >
                        <span className={`text-[10px] font-mono shrink-0 w-6 text-right mt-0.5 ${idx === currentStep ? 'text-violet-300' : 'text-gray-600'}`}>
                          {idx + 1}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className={`text-[11px] font-medium block truncate ${eventColor(ev.eventType)}`}>
                            {eventLabel(ev)}
                          </span>
                          {ev.line && (
                            <span className="text-[10px] text-gray-600 font-mono">line {ev.line}</span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Navigation controls ── */}
              <div className="border-t border-[#30363d] bg-[#0d1117] p-3 shrink-0 space-y-2">
                {/* Prev / Next */}
                <div className="flex gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-40 text-gray-200 rounded text-xs font-medium transition-colors border border-[#30363d] focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-violet-500/50"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentStep >= totalSteps - 1}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-40 text-gray-200 rounded text-xs font-medium transition-colors border border-[#30363d] focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-violet-500/50"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Play / Pause / Restart */}
                <div className="flex gap-2">
                  <button
                    onClick={handleRestart}
                    className="p-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded border border-[#30363d] transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-violet-500/50"
                    title="Restart from step 1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsPlaying((p) => !p)}
                    disabled={currentStep >= totalSteps - 1 && !isPlaying}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-violet-700/80 hover:bg-violet-600 disabled:opacity-40 text-white rounded text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-violet-500/50"
                  >
                    {isPlaying ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5 fill-current" /> Play</>}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer: program output (always) ── */}
        {!isLoading && result && result.stdout && totalSteps === 0 && (
          <div className="border-t border-[#30363d] p-3 shrink-0">
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wide mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Program Output
            </p>
            <pre className="text-xs text-gray-200 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">{result.stdout}</pre>
          </div>
        )}

        {/* ── Status bar bottom: step limit / timeout messages ── */}
        {!isLoading && result && (result.status === 'step-limit' || result.status === 'timeout') && totalSteps > 0 && (
          <div className="border-t border-amber-700/30 bg-amber-900/10 px-4 py-2 shrink-0 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] text-amber-300">
              {result.status === 'step-limit'
                ? `Trace stopped after ${totalSteps} steps (step limit reached).`
                : 'Trace stopped: execution timed out.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
