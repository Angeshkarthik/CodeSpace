'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Circle,
  Trash2,
  Code,
  Calendar,
  Layers,
  ArrowRightLeft,
  Clock,
  Cpu,
  BarChart2
} from 'lucide-react';
import { PracticeProblem, PracticeAttempt } from '@/lib/practice/types';
import { MonacoEditorWrapper } from '../editor/MonacoEditorWrapper';

interface AttemptHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: PracticeProblem | null;
  attempts: PracticeAttempt[];
  onDeleteAttempt: (uuid: string) => Promise<void>;
  onClearAllAttempts: (practiceProblemUuid: string) => Promise<void>;
  onCompareWithCurrent: (attempt: PracticeAttempt) => void;
}

export const AttemptHistoryModal: React.FC<AttemptHistoryModalProps> = ({
  isOpen,
  onClose,
  problem,
  attempts,
  onDeleteAttempt,
  onClearAllAttempts,
  onCompareWithCurrent,
}) => {
  const [selectedAttempt, setSelectedAttempt] = useState<PracticeAttempt | null>(null);
  const [attemptToDelete, setAttemptToDelete] = useState<PracticeAttempt | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  if (!isOpen || !problem) return null;

  const renderOutcomeBadge = (outcome: PracticeAttempt['outcome']) => {
    switch (outcome) {
      case 'Solved':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Solved
          </span>
        );
      case 'Failed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      case 'Incomplete':
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/30">
            <Circle className="w-3.5 h-3.5" /> Incomplete
          </span>
        );
    }
  };

  const handleConfirmDelete = async () => {
    if (attemptToDelete) {
      await onDeleteAttempt(attemptToDelete.uuid);
      if (selectedAttempt?.uuid === attemptToDelete.uuid) {
        setSelectedAttempt(null);
      }
      setAttemptToDelete(null);
    }
  };

  const handleConfirmClearAll = async () => {
    if (problem) {
      await onClearAllAttempts(problem.uuid);
      setSelectedAttempt(null);
      setIsConfirmingClear(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#30363d] bg-[#0d1117]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-100">{problem.title}</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262d] text-gray-400 border border-[#30363d] font-mono">
                  {problem.topic}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Attempt History ({attempts.length} {attempts.length === 1 ? 'attempt' : 'attempts'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {attempts.length > 0 && !selectedAttempt && (
              <button
                onClick={() => setIsConfirmingClear(true)}
                className="px-2.5 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded border border-red-800/30 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Attempts</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#21262d] rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {selectedAttempt ? (
            /* Selected Attempt Read-Only Detail View */
            <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
              {/* Attempt Detail Sub-Header */}
              <div className="p-3 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedAttempt(null)}
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    ← Back to List
                  </button>
                  <span className="text-xs font-bold text-gray-200">
                    Attempt #{selectedAttempt.attemptNumber}
                  </span>
                  {renderOutcomeBadge(selectedAttempt.outcome)}
                  <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(selectedAttempt.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onCompareWithCurrent(selectedAttempt);
                      onClose();
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Compare with Current Code</span>
                  </button>
                </div>
              </div>

              {/* Evidence Metrics Banner */}
              <div className="p-3 bg-[#161b22]/70 border-b border-[#30363d] grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {/* Test Cases */}
                <div className="bg-[#0d1117] p-2.5 rounded border border-[#30363d]">
                  <span className="text-[10px] text-gray-400 block font-mono">Test Evidence</span>
                  <span className="font-semibold text-gray-200">
                    {selectedAttempt.tests
                      ? `${selectedAttempt.tests.passed} / ${selectedAttempt.tests.total} passed`
                      : 'No tests run'}
                  </span>
                </div>

                {/* Observed Complexity */}
                <div className="bg-[#0d1117] p-2.5 rounded border border-[#30363d]">
                  <span className="text-[10px] text-gray-400 block font-mono">Time / Space</span>
                  <span className="font-semibold text-gray-200">
                    {selectedAttempt.analysis
                      ? `${selectedAttempt.analysis.complexity.time.estimate} | ${selectedAttempt.analysis.complexity.space.estimate}`
                      : 'No static analysis'}
                  </span>
                </div>

                {/* Benchmark Timing */}
                <div className="bg-[#0d1117] p-2.5 rounded border border-[#30363d]">
                  <span className="text-[10px] text-gray-400 block font-mono">Benchmark Avg</span>
                  <span className="font-semibold text-emerald-400">
                    {selectedAttempt.benchmark && selectedAttempt.benchmark.averageMs !== undefined
                      ? `${selectedAttempt.benchmark.averageMs.toFixed(1)} ms`
                      : 'N/A'}
                  </span>
                </div>

                {/* Detected Patterns */}
                <div className="bg-[#0d1117] p-2.5 rounded border border-[#30363d]">
                  <span className="text-[10px] text-gray-400 block font-mono">DSA Patterns</span>
                  <span className="font-medium text-sky-400 truncate block">
                    {selectedAttempt.patterns && selectedAttempt.patterns.length > 0
                      ? selectedAttempt.patterns.join(', ')
                      : 'None detected'}
                  </span>
                </div>
              </div>

              {/* Read-Only Monaco Editor for Attempt Code */}
              <div className="flex-1 min-h-0 relative">
                <MonacoEditorWrapper
                  code={selectedAttempt.code}
                  language={selectedAttempt.language}
                  onChange={() => {}} // Read-only
                  readOnly={true}
                />
              </div>
            </div>
          ) : (
            /* Attempt List View */
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {attempts.length > 0 ? (
                attempts
                  .slice()
                  .reverse()
                  .map((attempt) => (
                    <div
                      key={attempt.uuid}
                      className="bg-[#0d1117] border border-[#30363d] hover:border-gray-600 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all group"
                    >
                      {/* Left info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-gray-200">
                            Attempt #{attempt.attemptNumber}
                          </span>
                          {renderOutcomeBadge(attempt.outcome)}
                          <span className="text-[11px] text-gray-400 font-mono">
                            {new Date(attempt.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Summary Badges */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 pt-0.5">
                          {/* Language */}
                          <span className="font-mono text-emerald-400 text-[11px]">
                            {attempt.language.toUpperCase()}
                          </span>

                          {/* Tests */}
                          <span className="flex items-center gap-1 text-[11px]">
                            <BarChart2 className="w-3 h-3 text-amber-400" />
                            {attempt.tests
                              ? `${attempt.tests.passed}/${attempt.tests.total} tests`
                              : 'No tests'}
                          </span>

                          {/* Complexity */}
                          {attempt.analysis && (
                            <span className="flex items-center gap-1 text-[11px] text-sky-300 font-mono">
                              <Cpu className="w-3 h-3 text-sky-400" />
                              {attempt.analysis.complexity.time.estimate}
                            </span>
                          )}

                          {/* Benchmark */}
                          {attempt.benchmark && attempt.benchmark.averageMs !== undefined && (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-mono">
                              <Clock className="w-3 h-3 text-emerald-400" />
                              {attempt.benchmark.averageMs.toFixed(1)} ms
                            </span>
                          )}

                          {/* Patterns */}
                          {attempt.patterns && attempt.patterns.length > 0 && (
                            <span className="text-[11px] text-purple-300">
                              [{attempt.patterns.join(', ')}]
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                        <button
                          onClick={() => setSelectedAttempt(attempt)}
                          className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] rounded text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <Code className="w-3.5 h-3.5 text-emerald-400" />
                          <span>View Code</span>
                        </button>

                        <button
                          onClick={() => {
                            onCompareWithCurrent(attempt);
                            onClose();
                          }}
                          className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-[#21262d] rounded transition-colors"
                          title="Compare attempt code with current code"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setAttemptToDelete(attempt)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                          title="Delete this attempt"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-12 text-center text-gray-500 space-y-2">
                  <p className="text-sm font-medium">No recorded attempts for this problem yet.</p>
                  <p className="text-xs">
                    Work on this problem in the Editor and click "Record Attempt" to capture your solution evidence.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Single Attempt Confirmation */}
      {attemptToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-gray-100">Delete Attempt #{attemptToDelete.attemptNumber}?</h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to delete this historical attempt? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAttemptToDelete(null)}
                className="px-3.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Attempts Confirmation */}
      {isConfirmingClear && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-red-400">Clear All Attempt History?</h3>
            <p className="text-xs text-gray-400">
              Delete all {attempts.length} attempts for "{problem.title}"? The linked code program will remain intact.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsConfirmingClear(false)}
                className="px-3.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearAll}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold"
              >
                Clear All Attempts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
