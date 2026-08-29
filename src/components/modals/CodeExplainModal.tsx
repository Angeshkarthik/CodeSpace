'use client';

import React from 'react';
import {
  X,
  Brain,
  Loader2,
  Info,
  BookOpen,
  Cpu,
  ListOrdered,
  Code2,
  Variable,
  FunctionSquare,
  Footprints,
  Layers,
  Lightbulb,
  Waypoints
} from 'lucide-react';
import { CodeExplanation } from '@/lib/ai/types';

interface CodeExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: CodeExplanation | null;
  isLoading: boolean;
  error: string | null;
  language: string;
}

export const CodeExplainModal: React.FC<CodeExplainModalProps> = ({
  isOpen,
  onClose,
  explanation,
  isLoading,
  error,
  language
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-surface border border-default rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-default flex items-center justify-between bg-canvas/90 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-primary">Explain My Code</h2>
            <span className="text-[10px] font-mono bg-surface-elevated text-violet-300 px-2 py-0.5 rounded uppercase border border-default">
              {language}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-secondary hover:text-primary hover:bg-surface-elevated rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs text-secondary font-sans">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-secondary">
              <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
              <p className="text-sm font-medium text-secondary">Explaining your code...</p>
              <p className="text-xs text-muted">Analyzing structure, logic, and concepts</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Info className="w-8 h-8 text-amber-400" />
              <p className="text-sm font-medium text-primary">AI Explanation Unavailable</p>
              <p className="text-xs text-secondary max-w-sm leading-relaxed">{error}</p>
            </div>
          )}

          {/* Explanation Content */}
          {!isLoading && !error && explanation && (
            <>
              {/* Overview */}
              <div className="p-3.5 bg-canvas border border-violet-500/30 rounded-md space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-violet-400" />
                  <h3 className="text-xs font-semibold text-primary">What does this do?</h3>
                </div>
                <p className="text-[13px] text-primary leading-relaxed font-sans">{explanation.overview}</p>
                {explanation.purpose && (
                  <p className="text-[12px] text-secondary leading-relaxed font-sans border-t border-default pt-2">
                    {explanation.purpose}
                  </p>
                )}
              </div>

              {/* Key Concepts */}
              {explanation.keyConcepts && explanation.keyConcepts.length > 0 && (
                <div className="p-3 bg-canvas border border-default rounded-md space-y-2">
                  <h3 className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    Key Concepts
                  </h3>
                  <div className="space-y-1.5">
                    {explanation.keyConcepts.map((c, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded whitespace-nowrap mt-0.5">
                          {c.title}
                        </span>
                        <span className="text-[11px] text-secondary leading-relaxed">{c.explanation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variables */}
              {explanation.variables && explanation.variables.length > 0 && (
                <div className="p-3 bg-canvas border border-default rounded-md space-y-2">
                  <h3 className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                    <Variable className="w-3.5 h-3.5 text-sky-400" />
                    Important Variables
                  </h3>
                  <div className="space-y-1.5">
                    {explanation.variables.map((v, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <code className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded min-w-fit whitespace-nowrap">
                          {v.name}
                        </code>
                        <span className="text-[11px] text-secondary leading-relaxed mt-0.5">→ {v.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Functions */}
              {explanation.functions && explanation.functions.length > 0 && (
                <div className="p-3 bg-canvas border border-default rounded-md space-y-2">
                  <h3 className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                    <FunctionSquare className="w-3.5 h-3.5 text-sky-400" />
                    Functions & Methods
                  </h3>
                  <div className="space-y-2.5">
                    {explanation.functions.map((f, i) => (
                      <div key={i} className="p-2.5 bg-surface border border-default rounded space-y-1">
                        <code className="text-[12px] font-mono font-bold text-sky-300">{f.name}()</code>
                        <p className="text-[11px] text-secondary leading-relaxed">{f.purpose}</p>
                        {f.parameters && (
                          <p className="text-[10px] text-muted">
                            <span className="text-secondary font-semibold">Params: </span>{f.parameters}
                          </p>
                        )}
                        {f.returnValue && (
                          <p className="text-[10px] text-muted">
                            <span className="text-secondary font-semibold">Returns: </span>{f.returnValue}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Control Flow */}
              {explanation.controlFlow && explanation.controlFlow.length > 0 && (
                <div className="p-3 bg-canvas border border-default rounded-md space-y-2">
                  <h3 className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                    <ListOrdered className="w-3.5 h-3.5 text-emerald-400" />
                    How It Works (Control Flow)
                  </h3>
                  <ol className="space-y-1.5 list-none">
                    {explanation.controlFlow.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="flex-shrink-0 w-5 h-5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-[11px] text-secondary leading-relaxed mt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Algorithm */}
              {explanation.algorithm?.name && (
                <div className="p-3 bg-canvas border border-default rounded-md space-y-1.5">
                  <h3 className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                    <Waypoints className="w-3.5 h-3.5 text-amber-400" />
                    Algorithm / Pattern
                  </h3>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-mono font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded whitespace-nowrap">
                      {explanation.algorithm.name}
                    </span>
                    {explanation.algorithm.explanation && (
                      <span className="text-[11px] text-secondary leading-relaxed">
                        {explanation.algorithm.explanation}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Complexity */}
              {explanation.complexity && (
                <div className="p-3 bg-canvas border border-default rounded-md space-y-2">
                  <h3 className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    Complexity
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-surface border border-default rounded text-center">
                      <div className="text-[10px] text-secondary">Time</div>
                      <div className="text-sm font-bold font-mono text-emerald-300">{explanation.complexity.time}</div>
                    </div>
                    <div className="p-2 bg-surface border border-default rounded text-center">
                      <div className="text-[10px] text-secondary">Space</div>
                      <div className="text-sm font-bold font-mono text-sky-300">{explanation.complexity.space}</div>
                    </div>
                  </div>
                  {explanation.complexity.explanation && (
                    <p className="text-[11px] text-secondary leading-relaxed">{explanation.complexity.explanation}</p>
                  )}
                </div>
              )}

              {/* Walkthrough */}
              {explanation.walkthrough && explanation.walkthrough.steps && explanation.walkthrough.steps.length > 0 && (
                <div className="p-3 bg-canvas border border-default rounded-md space-y-2">
                  <h3 className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                    <Footprints className="w-3.5 h-3.5 text-violet-400" />
                    Example Walkthrough
                  </h3>
                  <div className="p-2 bg-surface border border-default rounded">
                    <span className="text-[10px] font-semibold text-secondary">Input: </span>
                    <code className="text-[11px] font-mono text-amber-300">{explanation.walkthrough.input}</code>
                  </div>
                  <div className="space-y-1.5">
                    {explanation.walkthrough.steps.map((s, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="flex-shrink-0 w-5 h-5 bg-violet-500/10 text-violet-400 border border-violet-500/30 rounded-full text-[10px] font-mono font-bold flex items-center justify-center">
                          {s.step}
                        </span>
                        <span className="text-[11px] text-secondary leading-relaxed mt-0.5 font-mono">
                          {s.explanation}
                        </span>
                      </div>
                    ))}
                  </div>
                  {explanation.walkthrough.finalResult && (
                    <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded">
                      <span className="text-[10px] font-semibold text-emerald-400">Final Result: </span>
                      <code className="text-[11px] font-mono text-emerald-300">{explanation.walkthrough.finalResult}</code>
                    </div>
                  )}
                </div>
              )}

              {/* Learning Points */}
              {explanation.learningPoints && explanation.learningPoints.length > 0 && (
                <div className="p-3 bg-canvas border border-default rounded-md space-y-2">
                  <h3 className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                    Learning Points
                  </h3>
                  <ul className="space-y-1.5">
                    {explanation.learningPoints.map((lp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-sky-400 mt-0.5 flex-shrink-0">→</span>
                        <span className="text-[11px] text-secondary leading-relaxed">{lp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-default bg-canvas/90 flex items-center justify-between text-[11px] text-secondary flex-shrink-0">
          <span>Explaining your code, not critiquing it</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-surface-elevated hover:bg-surface-hover text-secondary rounded text-xs font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
