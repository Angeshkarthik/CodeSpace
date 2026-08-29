'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Trash2,
  AlertCircle,
  ChevronRight,
  Maximize2,
  Minimize2,
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
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
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
  isMaximized,
  onToggleMaximize,
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
  // Auto-scroll refs and manual scroll tracking
  const outputScrollRef = useRef<HTMLPreElement | null>(null);
  const errorScrollRef = useRef<HTMLPreElement | null>(null);
  const userScrolledOutputRef = useRef<boolean>(false);
  const userScrolledErrorRef = useRef<boolean>(false);

  // Run I/O vertical resizing
  const [inputHeightRatio, setInputHeightRatio] = useState(0.35); // 35% default
  const [isVerticalResizing, setIsVerticalResizing] = useState(false);

  const startVerticalResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsVerticalResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVerticalResizing) return;
      const runIoContainer = document.getElementById('run-io-container');
      if (!runIoContainer) return;

      const rect = runIoContainer.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      let ratio = relativeY / rect.height;
      // Clamp between 15% and 85% to avoid crushing either pane
      ratio = Math.max(0.15, Math.min(ratio, 0.85));
      setInputHeightRatio(ratio);
    };

    const handleMouseUp = () => setIsVerticalResizing(false);

    if (isVerticalResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isVerticalResizing]);

  // Smart Auto-Scroll for Output tab
  useEffect(() => {
    if (activeTab === 'run_io' && outputScrollRef.current) {
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
      <div className="h-full w-full bg-canvas flex flex-col items-center py-4 select-none z-10 gap-4">
        <button
          onClick={onToggleOpen}
          aria-label="Expand console and tests panel"
          aria-expanded={false}
          className="flex flex-col items-center justify-center gap-2 text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50 rounded p-2"
          title="Expand Console"
        >
          <Terminal className="w-5 h-5 text-blue-500" aria-hidden="true" />
        </button>

        <div className="mt-auto flex flex-col items-center gap-3 pb-4">
          {isRunning ? (
            <span title="Running program..."><Loader2 className="w-5 h-5 text-amber-400 animate-spin" aria-hidden="true" /></span>
          ) : isTesting ? (
            <span title="Running tests..."><Loader2 className="w-5 h-5 text-blue-500 animate-spin" aria-hidden="true" /></span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-canvas flex flex-col z-10 h-full w-full"
    >
      {/* Console Header / Tabs */}
      <div className="h-9 px-2 border-b border-subtle flex items-center justify-between bg-canvas select-none min-w-0">
        <div className="flex-1 flex items-center gap-1 min-w-0 overflow-x-auto h-full scrollbar-none" role="tablist" aria-label="Console tabs">
          {/* Console Icon */}
          <div className="hidden sm:flex items-center gap-1 pr-1.5 mr-1 border-r border-default text-[11px] font-semibold text-secondary shrink-0 h-full">
            <Terminal className="w-3 h-3 text-blue-500" aria-hidden="true" />
            <span>Console</span>
          </div>

          {/* Run I/O Tab */}
          <button
            role="tab"
            aria-selected={activeTab === 'run_io'}
            onClick={() => onTabChange('run_io')}
            className={`flex items-center gap-1 px-2 h-full text-[11px] font-medium whitespace-nowrap transition-colors border-b-[2px] cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50 shrink-0 ${
              activeTab === 'run_io'
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-500'
                : 'border-transparent text-secondary hover:text-primary hover:bg-surface/50'
            }`}
          >
            <FileText className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>Run I/O</span>
            {(inputText.trim() || outputLog) && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" aria-hidden="true" />}
          </button>

          {/* Errors Tab */}
          <button
            role="tab"
            aria-selected={activeTab === 'errors'}
            onClick={() => onTabChange('errors')}
            className={`flex items-center gap-1 px-2 h-full text-[11px] font-medium whitespace-nowrap transition-colors border-b-[2px] cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50 shrink-0 ${
              activeTab === 'errors'
                ? 'border-red-600 dark:border-red-500 text-red-600 dark:text-red-500'
                : 'border-transparent text-secondary hover:text-primary hover:bg-surface/50'
            }`}
          >
            <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>Errors</span>
            {errorLog && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" aria-hidden="true" />}
          </button>

          {/* Test Cases Tab */}
          <button
            role="tab"
            aria-selected={activeTab === 'tests'}
            onClick={() => onTabChange('tests')}
            className={`flex items-center gap-1 px-2 h-full text-[11px] font-medium whitespace-nowrap transition-colors border-b-[2px] cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50 shrink-0 ${
              activeTab === 'tests'
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-500'
                : 'border-transparent text-secondary hover:text-primary hover:bg-surface/50'
            }`}
          >
            <FlaskConical className="w-3 h-3 text-blue-500 shrink-0" aria-hidden="true" />
            <span>Test Cases</span>
            {testCases.length > 0 && (
              <span className="text-[10px] bg-surface-elevated text-secondary px-1.5 py-0.2 rounded-full font-mono">
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
          ) : null}

          <button
            onClick={handleClear}
            aria-label="Clear console"
            className="p-1 text-secondary hover:text-primary hover:bg-surface-elevated rounded transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50"
            title="Clear Console (Output & Errors)"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              aria-label={isMaximized ? 'Restore execution panel' : 'Maximize execution panel'}
              className="p-1 text-secondary hover:text-primary hover:bg-surface-elevated rounded transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50"
              title={isMaximized ? 'Restore Panel' : 'Maximize Panel'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" /> : <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />}
            </button>
          )}
          <button
            onClick={onToggleOpen}
            aria-label="Collapse console panel"
            aria-expanded={true}
            className="p-1 text-secondary hover:text-primary hover:bg-surface-elevated rounded transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50"
            title="Collapse Console"
          >
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 bg-surface border border-subtle shadow-xs overflow-hidden m-2 rounded-md">
        {/* Run I/O Tab */}
        {activeTab === 'run_io' && (
          <div className="h-full flex flex-col font-mono text-xs text-secondary min-h-0 relative" id="run-io-container">
            {/* Input Section */}
            <div 
              className="flex flex-col shrink-0 min-h-[60px] p-5 pb-2"
              style={{ height: `${inputHeightRatio * 100}%` }}
            >
              <div className="text-[11px] font-sans text-secondary font-bold tracking-wider mb-3 shrink-0">INPUT</div>
              <textarea
                id="console-stdin-input"
                value={inputText}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Enter stdin..."
                className="w-full flex-1 bg-canvas border border-default rounded-md p-3 text-[13px] leading-relaxed font-mono text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none min-h-0 shadow-xs"
              />
            </div>

            {/* Draggable Divider (Invisible by default) */}
            <div
              className="h-3 w-full cursor-row-resize flex items-center justify-center shrink-0 z-10 transition-colors group"
              onMouseDown={startVerticalResize}
              aria-label="Resize Input/Output split"
              role="separator"
            >
              <div className="w-12 h-1 rounded-full opacity-0 group-hover:opacity-100 bg-blue-500/50 transition-opacity" />
            </div>

            {/* Output Section */}
            <div className="flex flex-col flex-1 min-h-[80px] p-5 pt-2 overflow-hidden">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="text-[11px] font-sans text-secondary font-bold tracking-wider">OUTPUT</div>
                {executionTimeMs !== undefined && executionTimeMs !== null && !isRunning && (
                  <div className={`px-2 py-0.5 rounded-full text-[11px] font-medium font-sans flex items-center gap-1 ${
                    exitCode === 0 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' 
                      : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                  }`}>
                    {exitCode === 0 ? '✓' : '✕'} {executionTimeMs}ms
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col bg-canvas border border-default rounded-md min-h-0 relative p-3 shadow-xs">
                {isRunning ? (
                  <div className="h-full flex flex-col items-center justify-center text-amber-400 space-y-2 select-none overflow-y-auto">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-400" aria-hidden="true" />
                    <span className="font-sans font-medium text-xs text-primary">Executing...</span>
                  </div>
                ) : outputLog ? (
                  <pre
                    ref={outputScrollRef}
                    onScroll={handleOutputScroll}
                    className="text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap break-words break-all font-mono text-[13px] leading-relaxed flex-1 overflow-y-auto"
                  >
                    {outputLog}
                  </pre>
                ) : executionTimeMs !== undefined && executionTimeMs !== null && exitCode === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-secondary space-y-1 select-none overflow-y-auto">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500 mb-1" aria-hidden="true" />
                    <span className="font-sans font-medium text-xs text-primary">Success (No Output)</span>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted space-y-1 select-none overflow-y-auto">
                    <Info className="w-5 h-5 text-muted mb-1" aria-hidden="true" />
                    <span className="font-sans font-medium text-xs text-secondary">Ready</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Errors Tab */}
        {activeTab === 'errors' && (
          <div className="h-full p-3 flex flex-col justify-between font-mono text-xs text-secondary">
            {errorLog ? (
              <div className="h-full flex flex-col justify-between">
                <pre
                  ref={errorScrollRef}
                  onScroll={handleErrorScroll}
                  className="text-red-600 dark:text-red-400 whitespace-pre-wrap break-words break-all font-mono text-[13px] leading-relaxed flex-1 overflow-auto p-2"
                >
                  {errorLog}
                </pre>
                {executionTimeMs !== undefined && executionTimeMs !== null && (
                  <div className="pt-2 mt-2 border-t border-subtle flex items-center justify-between text-[11px] text-muted font-mono shrink-0">
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-500 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-500" aria-hidden="true" />
                      <span>Execution Error</span>
                    </span>
                    <span>
                      Failed · <strong className="text-red-600 dark:text-red-400">{executionTimeMs} ms</strong> {exitCode !== undefined && exitCode !== null ? `(exit code ${exitCode})` : ''}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted space-y-1 py-4 select-none">
                <AlertCircle className="w-5 h-5 text-muted mb-1" aria-hidden="true" />
                <span className="font-sans font-medium text-xs text-secondary">No Execution Errors</span>
                <p className="font-sans text-[11px] text-muted max-w-sm text-center">
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

