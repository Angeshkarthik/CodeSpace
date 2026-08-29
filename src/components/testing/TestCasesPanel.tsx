'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Play, CheckCircle2, XCircle, AlertTriangle, Clock, FileInput, ChevronRight, FlaskConical } from 'lucide-react';
import { TestCase } from '@/types';
import { TestResultItem, BatchTestSummary } from '@/lib/execution/TestRunner';

interface TestCasesPanelProps {
  testCases: TestCase[];
  onAddTestCase: () => void;
  onUpdateTestCase: (uuid: string, updates: Partial<TestCase>) => void;
  onDeleteTestCase: (uuid: string) => void;
  onRunTests: () => void;
  isTesting: boolean;
  testProgress: { completed: number; total: number } | null;
  testSummary: BatchTestSummary | null;
}

export const TestCasesPanel: React.FC<TestCasesPanelProps> = ({
  testCases,
  onAddTestCase,
  onUpdateTestCase,
  onDeleteTestCase,
  onRunTests,
  isTesting,
  testProgress,
  testSummary
}) => {
  const [selectedTestCaseUuid, setSelectedTestCaseUuid] = useState<string | null>(
    testCases.length > 0 ? testCases[0].uuid : null
  );

  const activeTestCase = testCases.find((tc) => tc.uuid === selectedTestCaseUuid) || testCases[0] || null;
  const activeResult = testSummary?.results.find((r) => r.testCaseUuid === activeTestCase?.uuid) || null;

  return (
    <div className="h-full flex flex-col bg-canvas text-xs font-mono text-primary">
      {/* Top Action Bar */}
      <div className="p-2 border-b border-default flex flex-wrap items-center justify-between gap-2 bg-surface/80">
        <div className="flex items-center gap-2">
          <button
            onClick={onRunTests}
            disabled={isTesting || testCases.length === 0}
            aria-label="Run all test cases"
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-semibold cursor-pointer transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50"
          >
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            <span>{isTesting ? `Running tests... ${testProgress?.completed || 0} / ${testProgress?.total || testCases.length}` : 'Run Tests'}</span>
          </button>

          <button
            onClick={onAddTestCase}
            disabled={isTesting}
            aria-label="Add new test case"
            className="flex items-center gap-1 px-2.5 py-1 bg-surface-elevated hover:bg-surface-hover text-secondary rounded text-xs font-medium border border-default transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Test</span>
          </button>
        </div>

        {/* Test Summary Status Badge */}
        {testSummary && (
          <div className="flex items-center gap-3 font-sans">
            <span className="text-xs text-secondary font-medium">
              Tests: <strong className="text-white">{testSummary.passed} / {testSummary.total} passed</strong>
            </span>
            <div className="flex items-center gap-1 text-[11px]">
              {testSummary.passed === testSummary.total ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/10 rounded border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> All Passed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-400 font-semibold px-2 py-0.5 bg-red-500/10 rounded border border-red-500/30">
                  <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> {testSummary.failed} Failed
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Panel Content: Left list + Right details */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Side: Test Cases Tabs / List */}
        <div className="w-32 border-r border-default bg-surface/40 flex flex-col overflow-y-auto divide-y divide-subtle shrink-0" role="tablist" aria-label="Test cases list">
          {testCases.length === 0 ? (
            <div className="p-4 text-center text-muted font-sans text-xs">
              No test cases.
              <br />
              Click "+ Add Test" to create one.
            </div>
          ) : (
            testCases.map((tc, idx) => {
              const res = testSummary?.results.find((r) => r.testCaseUuid === tc.uuid);
              const isSelected = activeTestCase?.uuid === tc.uuid;

              return (
                <button
                  key={tc.uuid}
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`Test ${idx + 1}`}
                  onClick={() => setSelectedTestCaseUuid(tc.uuid)}
                  className={`w-full p-2.5 text-left flex items-center justify-between transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50 ${
                    isSelected ? 'bg-surface-elevated text-primary border-l-2 border-blue-500' : 'text-secondary hover:bg-surface hover:text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`font-semibold text-xs ${isSelected ? 'text-primary' : 'text-secondary'}`}>Test {idx + 1}</span>
                    {res && (
                      <span>
                        {res.status === 'passed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        ) : res.status === 'timeout' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {res?.executionTimeMs !== undefined && (
                      <span className="text-[10px] text-muted font-mono">{res.executionTimeMs}ms</span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Side: Active Test Case Input, Expected Output & Results */}
        <div className="flex-1 p-3 overflow-y-auto flex flex-col justify-between space-y-3">
          {activeTestCase ? (
            <div className="space-y-3 flex-1 flex flex-col">
              {/* Test Case Title & Delete Action */}
              <div className="flex items-center justify-between pb-2 border-b border-subtle">
                <div className="flex items-center gap-2 font-sans">
                  <span className="font-bold text-sm text-primary">
                    Test Case #{testCases.findIndex((t) => t.uuid === activeTestCase.uuid) + 1}
                  </span>
                  {activeResult && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded font-mono font-semibold ${
                        activeResult.status === 'passed'
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : activeResult.status === 'timeout'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {activeResult.status === 'passed'
                        ? activeResult.expectedOutput?.trim()
                          ? '✓ Output Passed'
                          : '✓ Execution Passed'
                        : activeResult.status === 'failed'
                        ? '✗ Output Mismatch'
                        : activeResult.status === 'compile_error'
                        ? '⚠ Compilation Error'
                        : activeResult.status === 'runtime_error'
                        ? '⚠ Runtime Error'
                        : activeResult.status === 'timeout'
                        ? '⚠ Timeout'
                        : '⚠ Execution Error'}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onDeleteTestCase(activeTestCase.uuid)}
                  aria-label={`Delete test case ${testCases.findIndex((t) => t.uuid === activeTestCase.uuid) + 1}`}
                  className="p-1 text-muted hover:text-red-400 hover:bg-surface-elevated rounded transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50"
                  title="Delete Test Case"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* Input & Expected Output Fields Stack */}
              <div className="flex flex-col gap-3 flex-1 shrink-0">
                {/* Input Textarea */}
                <div className="flex flex-col">
                  <label htmlFor="testcase-input" className="text-[11px] font-sans text-secondary mb-1 flex items-center gap-1">
                    <FileInput className="w-3 h-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <span>Input (stdin)</span>
                  </label>
                  <textarea
                    id="testcase-input"
                    value={activeTestCase.input}
                    onChange={(e) => onUpdateTestCase(activeTestCase.uuid, { input: e.target.value })}
                    placeholder="Enter test input lines here..."
                    className="w-full flex-1 min-h-[80px] bg-surface border border-default rounded p-2 text-xs font-mono text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Optional Expected Output Textarea */}
                <div className="flex flex-col">
                  <label htmlFor="testcase-expected-output" className="text-[11px] font-sans text-secondary mb-1 flex items-center justify-between">
                    <span>Expected Output (Optional)</span>
                    <span className="text-[10px] text-muted">Leave blank for execution-only test</span>
                  </label>
                  <textarea
                    id="testcase-expected-output"
                    value={activeTestCase.expectedOutput || ''}
                    onChange={(e) => onUpdateTestCase(activeTestCase.uuid, { expectedOutput: e.target.value })}
                    placeholder="Optional expected stdout for comparison..."
                    className="w-full flex-1 min-h-[80px] bg-surface border border-default rounded p-2 text-xs font-mono text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Actual Output / Error Result Box */}
              {activeResult && (
                <div className="mt-2 pt-2 border-t border-subtle space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-sans text-secondary">
                    <span className="font-semibold text-secondary">Actual Result</span>
                    {activeResult.executionTimeMs !== undefined && (
                      <span className="flex items-center gap-1 text-muted font-mono">
                        <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        {activeResult.executionTimeMs} ms
                      </span>
                    )}
                  </div>

                  {/* Execution Output */}
                  {activeResult.actualOutput && (
                    <div className="bg-surface border border-default rounded p-2 text-xs font-mono text-emerald-600 dark:text-emerald-300 whitespace-pre-wrap break-words break-all max-h-32 overflow-auto">
                      {activeResult.actualOutput}
                    </div>
                  )}

                  {/* Error Output */}
                  {activeResult.stderr && (
                    <div className="bg-surface border border-red-900/50 rounded p-2 text-xs font-mono text-red-400 whitespace-pre-wrap break-words break-all max-h-32 overflow-auto">
                      {activeResult.stderr}
                    </div>
                  )}

                  {/* Output Mismatch Comparison */}
                  {activeResult.status === 'failed' && activeResult.expectedOutput && (
                    <div className="p-2 bg-red-950/30 border border-red-900/50 rounded text-xs space-y-1 font-mono">
                      <div className="text-red-400 font-sans font-semibold text-[11px]">Output Mismatch:</div>
                      <div className="text-secondary">
                        Expected: <span className="text-emerald-600 dark:text-emerald-300 font-mono">{activeResult.expectedOutput}</span>
                      </div>
                      <div className="text-secondary">
                        Actual: <span className="text-red-300 font-mono">{activeResult.actualOutput}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted py-6 space-y-3">
              <FlaskConical className="w-8 h-8 text-muted" aria-hidden="true" />
              <div className="text-center space-y-1">
                <p className="text-xs font-medium text-secondary">No test cases</p>
                <p className="text-[11px] text-muted max-w-[200px]">Create a test case to provide standard input and verify output.</p>
              </div>
              <button
                onClick={onAddTestCase}
                className="px-3 py-1.5 bg-surface-elevated hover:bg-surface-hover text-secondary rounded text-[11px] font-medium transition-colors border border-default focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50"
              >
                + Add Test
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
