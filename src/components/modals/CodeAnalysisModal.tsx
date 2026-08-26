'use client';

import React from 'react';
import {
  X,
  Search,
  ShieldAlert,
  Lightbulb,
  Code2,
  Cpu,
  CheckCircle2,
  Info,
  Sparkles,
  Layers,
  Brain,
  AlertCircle,
  Loader2,
  Check,
  BookOpen
} from 'lucide-react';
import { CodeAnalysisResult } from '@/lib/analysis/types';
import { AIReviewResult } from '@/lib/ai/types';
import { BatchTestSummary } from '@/lib/execution/TestRunner';
import { ExecutionResult } from '@/lib/execution/types';

interface CodeAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CodeAnalysisResult | null;
  aiReview: AIReviewResult | null;
  isAiLoading: boolean;
  aiError: string | null;
  testSummary: BatchTestSummary | null;
  executionResult: ExecutionResult | null;
}

export const CodeAnalysisModal: React.FC<CodeAnalysisModalProps> = ({
  isOpen,
  onClose,
  result,
  aiReview,
  isAiLoading,
  aiError,
  testSummary,
  executionResult
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

  if (!isOpen || !result) return null;

  const { structure, complexity, issues, suggestions, dsaPatterns, language } = result;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]/90">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-gray-200">Intelligent Code Review & Signals</h2>
            <span className="text-[10px] font-mono bg-[#21262d] text-emerald-300 px-2 py-0.5 rounded uppercase border border-[#30363d]">
              {language}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-200 hover:bg-[#21262d] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs font-sans text-gray-300">
          {/* Top Summary Banner: Execution & Test Evidence Status */}
          <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div className="text-xs">
                <span className="font-semibold text-gray-200">Test & Execution Evidence: </span>
                {testSummary ? (
                  <span className={testSummary.passed === testSummary.total ? 'text-emerald-400 font-mono font-semibold' : 'text-red-400 font-mono font-semibold'}>
                    {testSummary.passed} / {testSummary.total} tests passed
                  </span>
                ) : executionResult ? (
                  <span className="text-emerald-400 font-mono">Single Execution ({executionResult.status})</span>
                ) : (
                  <span className="text-gray-400 italic">No tests run yet (Correctness unverified)</span>
                )}
              </div>
            </div>

            {/* AI Status Badge */}
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              {isAiLoading ? (
                <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Analyzing code...
                </span>
              ) : aiReview ? (
                <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                  <Brain className="w-3 h-3 text-emerald-400" />
                  AI Enhanced
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-400 bg-gray-500/10 px-2 py-0.5 rounded border border-gray-500/30">
                  <Info className="w-3 h-3 text-gray-400" />
                  Deterministic Static Review
                </span>
              )}
            </div>
          </div>

          {/* AI Review Section (if available) */}
          {aiReview && (
            <div className="p-3.5 bg-[#0d1117] border border-emerald-500/30 rounded-md space-y-3">
              <div className="flex items-center gap-2 border-b border-[#21262d] pb-2">
                <Brain className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm text-gray-200">AI Code Review & Mentor Insights</h3>
              </div>

              {/* Summary */}
              <p className="text-xs text-gray-300 leading-relaxed font-sans bg-[#161b22] p-2.5 rounded border border-[#30363d]">
                {aiReview.summary}
              </p>

              {/* Correctness & Complexity Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Correctness */}
                <div className="p-2.5 bg-[#161b22] border border-[#30363d] rounded space-y-1">
                  <div className="text-[11px] font-semibold text-gray-400 flex items-center justify-between">
                    <span>Correctness Status</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                        aiReview.correctness.status === 'working'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : aiReview.correctness.status === 'issues_found'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {aiReview.correctness.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-normal">{aiReview.correctness.explanation}</p>
                </div>

                {/* Complexity Explanation */}
                <div className="p-2.5 bg-[#161b22] border border-[#30363d] rounded space-y-1">
                  <div className="text-[11px] font-semibold text-gray-400 flex items-center justify-between">
                    <span>Complexity Interpretation</span>
                    <span className="font-mono text-emerald-400 text-xs font-bold">{aiReview.complexity.time}</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-normal">{aiReview.complexity.explanation}</p>
                </div>
              </div>

              {/* Strengths & Learning Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {aiReview.strengths.length > 0 && (
                  <div className="p-2.5 bg-[#161b22] border border-[#30363d] rounded space-y-1.5">
                    <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Key Strengths
                    </div>
                    <ul className="space-y-1 text-[11px] text-gray-300 list-disc list-inside">
                      {aiReview.strengths.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiReview.learningPoints.length > 0 && (
                  <div className="p-2.5 bg-[#161b22] border border-[#30363d] rounded space-y-1.5">
                    <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Learning Points
                    </div>
                    <ul className="space-y-1 text-[11px] text-gray-300 list-disc list-inside">
                      {aiReview.learningPoints.map((lp, idx) => (
                        <li key={idx}>{lp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Unavailable Banner */}
          {aiError && !isAiLoading && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300 text-xs flex items-center gap-2 font-sans">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Complexity Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Time Complexity */}
            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-md space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  Deterministic Time Complexity
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                    complexity.time.confidence === 'high'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : complexity.time.confidence === 'medium'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                  }`}
                >
                  {complexity.time.confidence} confidence
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-emerald-300">
                {complexity.time.estimate}
              </div>
              <p className="text-[11px] text-gray-400 leading-normal">
                {complexity.time.explanation}
              </p>
            </div>

            {/* Space Complexity */}
            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-md space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  Auxiliary Space
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                    complexity.space.confidence === 'high'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {complexity.space.confidence} confidence
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-sky-300">
                {complexity.space.estimate}
              </div>
              <p className="text-[11px] text-gray-400 leading-normal">
                {complexity.space.explanation}
              </p>
            </div>
          </div>

          {/* Structure Metrics Grid */}
          <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-md space-y-2">
            <h3 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              Program Structure
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono">
              <div className="p-2 bg-[#161b22] border border-[#30363d] rounded">
                <div className="text-gray-400 text-[10px]">Functions</div>
                <div className="text-sm font-bold text-gray-200">{structure.functions}</div>
              </div>
              <div className="p-2 bg-[#161b22] border border-[#30363d] rounded">
                <div className="text-gray-400 text-[10px]">Loops</div>
                <div className="text-sm font-bold text-gray-200">{structure.loops}</div>
              </div>
              <div className="p-2 bg-[#161b22] border border-[#30363d] rounded">
                <div className="text-gray-400 text-[10px]">Nested Depth</div>
                <div className="text-sm font-bold text-emerald-400">{structure.nestedLoopDepth}</div>
              </div>
              <div className="p-2 bg-[#161b22] border border-[#30363d] rounded">
                <div className="text-gray-400 text-[10px]">Conditionals</div>
                <div className="text-sm font-bold text-gray-200">{structure.conditionals}</div>
              </div>
              <div className="p-2 bg-[#161b22] border border-[#30363d] rounded">
                <div className="text-gray-400 text-[10px]">Recursion</div>
                <div className={`text-sm font-bold ${structure.recursionDetected ? 'text-amber-400' : 'text-gray-400'}`}>
                  {structure.recursionDetected ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </div>

          {/* DSA Algorithmic Pattern Hints */}
          <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-md space-y-2">
            <h3 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Detected DSA Algorithmic Patterns
            </h3>
            {dsaPatterns.length > 0 ? (
              <div className="space-y-1.5">
                {dsaPatterns.map((pat) => (
                  <div key={pat.id} className="p-2 bg-[#161b22] border border-[#30363d] rounded flex items-start gap-2">
                    <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                      {pat.name}
                    </span>
                    <span className="text-[11px] text-gray-300 leading-normal">{pat.description}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 bg-[#161b22] border border-[#30363d] rounded p-2">
                No specific DSA algorithmic patterns detected in the current code structure.
              </p>
            )}
          </div>

          {/* Potential Issues */}
          <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-md space-y-2">
            <h3 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Potential Safety & Static Issues ({issues.length})
            </h3>
            {issues.length > 0 ? (
              <div className="space-y-2">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-2.5 rounded border text-xs space-y-1 ${
                      issue.severity === 'warning'
                        ? 'bg-amber-500/5 border-amber-500/30 text-amber-200'
                        : 'bg-sky-500/5 border-sky-500/30 text-sky-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1.5">
                        {issue.severity === 'warning' ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-sky-400" />
                        )}
                        {issue.title}
                      </span>
                      {issue.line && (
                        <span className="text-[10px] font-mono bg-[#161b22] text-gray-400 px-1.5 py-0.2 rounded border border-[#30363d]">
                          Line {issue.line}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">{issue.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 p-2 bg-emerald-500/5 border border-emerald-500/30 rounded text-emerald-300 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                No static issues or vulnerabilities detected.
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-md space-y-2">
            <h3 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
              Optimization & Structural Suggestions
            </h3>
            {suggestions.length > 0 ? (
              <div className="space-y-2">
                {suggestions.map((sug) => (
                  <div key={sug.id} className="p-2.5 bg-[#161b22] border border-[#30363d] rounded text-xs space-y-1">
                    <div className="font-semibold text-emerald-300">{sug.title}</div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">{sug.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 bg-[#161b22] border border-[#30363d] rounded p-2">
                No structural or performance optimization suggestions available at this time.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-[#30363d] bg-[#0d1117]/90 flex items-center justify-between text-gray-400 text-[11px]">
          <span>Deterministic analysis & execution evidence are the source of truth</span>
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
