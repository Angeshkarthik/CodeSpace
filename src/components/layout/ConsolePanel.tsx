'use client';

import React, { useState } from 'react';
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
  FlaskConical
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

  if (!isOpen) {
    return (
      <div className="h-7 bg-[#161b22] border-t border-[#30363d] px-3 flex items-center justify-between select-none z-10">
        <button
          onClick={onToggleOpen}
          className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Console & Tests Panel</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>

        <span className="text-[10px] font-mono text-gray-500">
          {isRunning ? (
            <span className="text-amber-400 font-semibold animate-pulse">Running program...</span>
          ) : isTesting ? (
            <span className="text-emerald-400 font-semibold animate-pulse">
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
      <div className="h-8 px-3 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]/60 select-none">
        <div className="flex items-center gap-1">
          {/* Console Icon */}
          <div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-[#30363d] text-xs font-semibold text-gray-300">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Console</span>
          </div>

          {/* Input Tab */}
          <button
            onClick={() => onTabChange('input')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-t font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'input'
                ? 'border-emerald-500 text-emerald-300 bg-[#161b22]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Input</span>
          </button>

          {/* Output Tab */}
          <button
            onClick={() => onTabChange('output')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-t font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'output'
                ? 'border-emerald-500 text-emerald-300 bg-[#161b22]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <CornerDownRight className="w-3 h-3" />
            <span>Output</span>
            {outputLog && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>

          {/* Errors Tab */}
          <button
            onClick={() => onTabChange('errors')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-t font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'errors'
                ? 'border-red-500 text-red-300 bg-[#161b22]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Errors</span>
            {errorLog && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
          </button>

          {/* Test Cases Tab */}
          <button
            onClick={() => onTabChange('tests')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-t font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'tests'
                ? 'border-emerald-500 text-emerald-300 bg-[#161b22]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FlaskConical className="w-3 h-3 text-emerald-400" />
            <span>Test Cases</span>
            {testCases.length > 0 && (
              <span className="text-[10px] bg-[#21262d] text-gray-300 px-1.5 py-0.2 rounded-full font-mono">
                {testCases.length}
              </span>
            )}
          </button>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2">
          {executionTimeMs !== undefined && executionTimeMs !== null && activeTab === 'output' && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-gray-400 bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Completed · {executionTimeMs} ms</span>
            </div>
          )}

          <button
            onClick={onClearConsole}
            className="p-1 text-gray-400 hover:text-gray-200 hover:bg-[#21262d] rounded transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-200 hover:bg-[#21262d] rounded transition-colors"
            title={isExpanded ? 'Restore Console' : 'Expand Console'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onToggleOpen}
            className="p-1 text-gray-400 hover:text-gray-200 hover:bg-[#21262d] rounded transition-colors"
            title="Collapse Console"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 bg-[#0d1117] overflow-hidden">
        {activeTab === 'input' && (
          <div className="h-full p-3 flex flex-col font-mono text-xs text-gray-300">
            <label className="text-[11px] font-sans text-gray-400 mb-1 flex items-center justify-between">
              <span>Standard Input (stdin)</span>
              <span className="text-gray-500">Provide input lines for your program</span>
            </label>
            <textarea
              value={inputText}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Enter stdin input data here..."
              className="w-full flex-1 bg-[#161b22] border border-[#30363d] rounded p-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>
        )}

        {activeTab === 'output' && (
          <div className="h-full p-3 flex flex-col justify-between font-mono text-xs text-gray-300">
            {outputLog ? (
              <pre className="text-emerald-300 whitespace-pre-wrap font-mono text-xs flex-1 overflow-auto">{outputLog}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-1 py-4 select-none">
                <Info className="w-5 h-5 text-gray-600 mb-1" />
                <span className="font-sans font-medium text-xs text-gray-400">Standard Output Ready</span>
                <p className="font-sans text-[11px] text-gray-500 max-w-sm text-center">
                  Press <span className="text-emerald-400 font-mono font-semibold">▶ Run</span> to execute your code.
                </p>
              </div>
            )}

            {executionTimeMs !== undefined && executionTimeMs !== null && (
              <div className="pt-2 mt-2 border-t border-[#21262d] flex items-center justify-between text-[11px] text-gray-500 font-mono">
                <span>Finished execution</span>
                <span>Completed · {executionTimeMs} ms {exitCode !== undefined && exitCode !== null ? `(exit code ${exitCode})` : ''}</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="h-full p-3 flex flex-col justify-between font-mono text-xs text-gray-300">
            {errorLog ? (
              <pre className="text-red-400 whitespace-pre-wrap font-mono text-xs flex-1 overflow-auto">{errorLog}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-1 py-4 select-none">
                <AlertCircle className="w-5 h-5 text-gray-600 mb-1" />
                <span className="font-sans font-medium text-xs text-gray-400">No Execution Errors</span>
                <p className="font-sans text-[11px] text-gray-500 max-w-sm text-center">
                  Compilation errors, runtime exceptions, and timeouts will display here.
                </p>
              </div>
            )}
          </div>
        )}

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
