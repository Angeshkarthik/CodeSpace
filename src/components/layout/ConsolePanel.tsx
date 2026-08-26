'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Trash2,
  AlertCircle,
  FileText,
  CornerDownRight,
  Info,
  Clock,
  FlaskConical,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { ConsoleTab, TestCase } from '@/types';
import { TestCasesPanel } from '../testing/TestCasesPanel';
import { BatchTestSummary } from '@/lib/execution/TestRunner';

interface ConsolePanelProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  activeTab: ConsoleTab;
  onTabChange: (tab: ConsoleTab) => void;
  inputText: string;
  onInputChange: (text: string) => void;
  outputLog: string;
  errorLog: string;
  executionTimeMs?: number | null;
  exitCode?: number | null;
  isRunning?: boolean;
  onClearConsole: () => void;

  // Phase 2A Test Cases Props
  testCases: TestCase[];
  onAddTestCase: () => void;
  onUpdateTestCase: (uuid: string, updates: Partial<TestCase>) => void;
  onDeleteTestCase: (uuid: string) => void;
  onRunTests: () => void;
  isTesting: boolean;
  testProgress: { completed: number; total: number } | null;
  testSummary: BatchTestSummary | null;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  isOpen,
  onToggleOpen,
  activeTab,
  onTabChange,
  inputText,
  onInputChange,
  outputLog,
  errorLog,
  executionTimeMs,
  exitCode,
  isRunning,
  onClearConsole,
  testCases,
  onAddTestCase,
  onUpdateTestCase,
  onDeleteTestCase,
  onRunTests,
  isTesting,
  testProgress,
  testSummary
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-scroll refs and manual scroll tracking
  const outputScrollRef = useRef<HTMLPreElement | null>(null);
  const errorScrollRef = useRef<HTMLPreElement | null>(null);
  const userScrolledOutputRef = useRef<boolean>(false);
  const userScrolledErrorRef = useRef<boolean>(false);

  // Smart Auto-Scroll for Output tab
  useEffect(() => {
    if (activeTab === 'output' && outputScrollRef.current) {
      if (!userScrolledOutputRef.current) {
        outputScrollRef.current.scrollTop = outputScrollRef.current.scrollHeight;
      }
    }
  }, [outputLog, activeTab, isRunning]);

  // Smart Auto-Scroll for Errors tab
  useEffect(() => {
    if (activeTab === 'errors' && errorScrollRef.current) {
      if (!userScrolledErrorRef.current) {
        errorScrollRef.current.scrollTop = errorScrollRef.current.scrollHeight;
      }
    }
  }, [errorLog, activeTab, isRunning]);

  // Scroll listeners to resume auto-follow when user scrolls back to bottom
  const handleOutputScroll = () => {
    const el = outputScrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 35;
    userScrolledOutputRef.current = !isAtBottom;
  };

  const handleErrorScroll = () => {
    const el = errorScrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 35;
    userScrolledErrorRef.current = !isAtBottom;
  };

  const handleClear = () => {
    userScrolledOutputRef.current = false;
    userScrolledErrorRef.current = false;
    onClearConsole();
  };

  if (!isOpen) {
    return (
      <div className="h-7 bg-[#161b22] border-t border-[#30363d] px-3 flex items-center justify-between select-none z-10">
        <button
          onClick={onToggleOpen}
          aria-label="Expand console and tests panel"
          aria-expanded={false}
          className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50 rounded px-1"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
          <span>Console & Tests Panel</span>
          <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1.5">
          {isRunning ? (
            <span className="text-amber-400 font-semibold animate-pulse flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> Running program...
            </span>
          ) : isTesting ? (
            <span className="text-emerald-400 font-semibold animate-pulse flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
              Running tests ({testProgress?.completed || 0}/{testProgress?.total || testCases.length})...
            </span>
          ) : (
            <span>Console Ready</span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`bg-[#161b22] border-t border-[#30363d] flex flex-col transition-all duration-200 z-10 ${
        isExpanded ? 'h-96' : 'h-64'
      }`}
    >
      {/* Console Header / Tabs */}
      <div className="h-8 px-3 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]/60 select-none min-w-0">
        <div className="flex items-center gap-1 min-w-0 overflow-x-auto" role="tablist" aria-label="Console tabs">
          {/* Console Icon */}
          <div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-[#30363d] text-xs font-semibold text-gray-300 shrink-0">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>Console</span>
          </div>

          {/* Input Tab */}
          <button
            role="tab"
            aria-selected={activeTab === 'input'}
            onClick={() => onTabChange('input')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-t font-medium transition-colors border-b-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50 shrink-0 ${
              activeTab === 'input'
                ? 'border-emerald-500 text-emerald-300 bg-[#161b22]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-3 h-3" aria-hidden="true" />
            <span>Input</span>
            {inputText.trim() && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" aria-hidden="true" title="Input provided" />}
          </button>

          {/* Output Tab */}
          <button
            role="tab"
            aria-selected={activeTab === 'output'}
            onClick={() => onTabChange('output')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-t font-medium transition-colors border-b-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50 shrink-0 ${
              activeTab === 'output'
                ? 'border-emerald-500 text-emerald-300 bg-[#161b22]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <CornerDownRight className="w-3 h-3" aria-hidden="true" />
            <span>Output</span>
            {outputLog && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />}
          </button>

          {/* Errors Tab */}
          <button
            role="tab"
            aria-selected={activeTab === 'errors'}
            onClick={() => onTabChange('errors')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-t font-medium transition-colors border-b-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50 shrink-0 ${
              activeTab === 'errors'
                ? 'border-red-500 text-red-300 bg-[#161b22]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            <span>Errors</span>
            {errorLog && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" aria-hidden="true" />}
          </button>

          {/* Test Cases Tab */}
          <button
            role="tab"
            aria-selected={activeTab === 'tests'}
            onClick={() => onTabChange('tests')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-t font-medium transition-colors border-b-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50 shrink-0 ${
              activeTab === 'tests'
                ? 'border-emerald-500 text-emerald-300 bg-[#161b22]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FlaskConical className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            <span>Test Cases</span>
            {testCases.length > 0 && (
              <span className="text-[10px] bg-[#21262d] text-gray-300 px-1.5 py-0.2 rounded-full font-mono">
                {testCases.length}
              </span>
            )}
          </button>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isRunning ? (
            <span className="text-xs text-amber-400 font-mono animate-pulse flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
              Running...
            </span>
          ) : executionTimeMs !== undefined && executionTimeMs !== null && activeTab === 'output' ? (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-gray-400 bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
              <Clock className="w-3 h-3 text-emerald-400" aria-hidden="true" />
              <span>Completed · {executionTimeMs} ms</span>
            </div>
          ) : null}

          <button
            onClick={handleClear}
            aria-label="Clear console"
            className="p-1 text-gray-400 hover:text-gray-200 hover:bg-[#21262d] rounded transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
            title="Clear Console (Output & Errors)"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Restore console height' : 'Expand console height'}
            className="p-1 text-gray-400 hover:text-gray-200 hover:bg-[#21262d] rounded transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
            title={isExpanded ? 'Restore Console' : 'Expand Console'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" /> : <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />}
          </button>
          <button
            onClick={onToggleOpen}
            aria-label="Collapse console panel"
            aria-expanded={true}
            className="p-1 text-gray-400 hover:text-gray-200 hover:bg-[#21262d] rounded transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
            title="Collapse Console"
          >
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 bg-[#0d1117] overflow-hidden">
        {/* Input Tab */}
        {activeTab === 'input' && (
          <div className="h-full p-3 flex flex-col font-mono text-xs text-gray-300">
            <label htmlFor="console-stdin-input" className="text-[11px] font-sans text-gray-400 mb-1 flex items-center justify-between">
              <span className="font-medium text-gray-300">Standard Input (stdin)</span>
              <span className="text-gray-500">Input data provided to your program during execution</span>
            </label>
            <textarea
              id="console-stdin-input"
              value={inputText}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Enter stdin input lines here..."
              className="w-full flex-1 bg-[#161b22] border border-[#30363d] rounded p-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>
        )}

        {/* Output Tab */}
        {activeTab === 'output' && (
          <div className="h-full p-3 flex flex-col justify-between font-mono text-xs text-gray-300">
            {isRunning ? (
              <div className="h-full flex flex-col items-center justify-center text-amber-400 space-y-2 py-4 select-none">
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" aria-hidden="true" />
                <span className="font-sans font-medium text-xs text-gray-200">Executing Program...</span>
                <p className="font-sans text-[11px] text-gray-500 max-w-sm text-center">
                  Compiling and running offline in local environment.
                </p>
              </div>
            ) : outputLog ? (
              <pre
                ref={outputScrollRef}
                onScroll={handleOutputScroll}
                className="text-emerald-300 whitespace-pre-wrap break-words break-all font-mono text-xs flex-1 overflow-auto p-1"
              >
                {outputLog}
              </pre>
            ) : executionTimeMs !== undefined && executionTimeMs !== null && exitCode === 0 ? (
              /* Requirement 5: Non-error empty output state */
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-1 py-4 select-none">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-1" aria-hidden="true" />
                <span className="font-sans font-semibold text-xs text-gray-200">Program Executed Successfully</span>
                <p className="font-sans text-[11px] text-gray-400 max-w-sm text-center">
                  Process completed in <span className="font-mono text-emerald-400 font-semibold">{executionTimeMs} ms</span> with exit code <span className="font-mono text-emerald-400 font-semibold">0</span>. No output was written to stdout.
                </p>
              </div>
            ) : (
              /* Ready / Idle State */
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-1 py-4 select-none">
                <Info className="w-5 h-5 text-gray-600 mb-1" aria-hidden="true" />
                <span className="font-sans font-medium text-xs text-gray-400">Standard Output Ready</span>
                <p className="font-sans text-[11px] text-gray-500 max-w-sm text-center">
                  Press <span className="text-emerald-400 font-mono font-semibold">▶ Run</span> to execute your code.
                </p>
              </div>
            )}

            {executionTimeMs !== undefined && executionTimeMs !== null && !isRunning && (
              <div className="pt-2 mt-2 border-t border-[#21262d] flex items-center justify-between text-[11px] text-gray-500 font-mono shrink-0">
                <span className="flex items-center gap-1 text-gray-400">
                  {exitCode === 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
                  )}
                  <span>Finished execution</span>
                </span>
                <span>
                  Completed · <strong className="text-gray-300">{executionTimeMs} ms</strong> {exitCode !== undefined && exitCode !== null ? `(exit code ${exitCode})` : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Errors Tab */}
        {activeTab === 'errors' && (
          <div className="h-full p-3 flex flex-col justify-between font-mono text-xs text-gray-300">
            {errorLog ? (
              <div className="h-full flex flex-col justify-between">
                <pre
                  ref={errorScrollRef}
                  onScroll={handleErrorScroll}
                  className="text-red-400 whitespace-pre-wrap break-words break-all font-mono text-xs flex-1 overflow-auto p-1"
                >
                  {errorLog}
                </pre>
                {executionTimeMs !== undefined && executionTimeMs !== null && (
                  <div className="pt-2 mt-2 border-t border-[#21262d] flex items-center justify-between text-[11px] text-gray-500 font-mono shrink-0">
                    <span className="flex items-center gap-1 text-red-400 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
                      <span>Execution Error</span>
                    </span>
                    <span>
                      Failed · <strong className="text-red-300">{executionTimeMs} ms</strong> {exitCode !== undefined && exitCode !== null ? `(exit code ${exitCode})` : ''}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-1 py-4 select-none">
                <AlertCircle className="w-5 h-5 text-gray-600 mb-1" aria-hidden="true" />
                <span className="font-sans font-medium text-xs text-gray-400">No Execution Errors</span>
                <p className="font-sans text-[11px] text-gray-500 max-w-sm text-center">
                  Compilation errors, runtime exceptions, and timeouts will display here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Test Cases Tab */}
        {activeTab === 'tests' && (
          <TestCasesPanel
            testCases={testCases}
            onAddTestCase={onAddTestCase}
            onUpdateTestCase={onUpdateTestCase}
            onDeleteTestCase={onDeleteTestCase}
            onRunTests={onRunTests}
            isTesting={isTesting}
            testProgress={testProgress}
            testSummary={testSummary}
          />
        )}
      </div>
    </div>
  );
};

