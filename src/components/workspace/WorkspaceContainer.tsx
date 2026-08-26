'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  seedInitialPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  seedInitialPracticeProblems,
  createPracticeProblem,
  updatePracticeProblem,
  deletePracticeProblem,
  createPracticeAttempt,
  deletePracticeAttempt,
  clearPracticeAttempts,
} from '@/lib/db';
import { PracticeProblem, PracticeDifficulty, PracticeStatus, PracticeAttempt } from '@/lib/practice/types';
import { PracticeWorkspace } from '../practice/PracticeWorkspace';
import { Program, LanguageType, AppSettings, ConsoleTab, TestCase } from '@/types';
import { STARTER_TEMPLATES } from '@/lib/constants';
import { ExecutionResult } from '@/lib/execution/types';
import { runTestCasesBatch, BatchTestSummary } from '@/lib/execution/TestRunner';
import { analyzeCode } from '@/lib/analysis/Analyzer';
import { CodeAnalysisResult } from '@/lib/analysis/types';
import { CodeReviewContext, AIReviewResult, AIReviewResponse, CodeExplanationContext, CodeExplanation, AIExplainResponse } from '@/lib/ai/types';
import { TraceResult } from '@/lib/trace/types';
import { BenchmarkResult, computeFingerprint } from '@/lib/benchmark/types';
import { runBenchmark } from '@/lib/benchmark/BenchmarkRunner';
import { CodeSnapshot } from '@/lib/compare/types';

import { TopBar } from '../layout/TopBar';
import { Sidebar } from '../layout/Sidebar';
import { EditorToolbar } from '../editor/EditorToolbar';
import { MonacoEditorWrapper } from '../editor/MonacoEditorWrapper';
import { ConsolePanel } from '../layout/ConsolePanel';
import { NewProgramModal } from '../modals/NewProgramModal';
import { RenameModal } from '../modals/RenameModal';
import { SettingsModal } from '../modals/SettingsModal';
import { CodeAnalysisModal } from '../modals/CodeAnalysisModal';
import { CodeExplainModal } from '../modals/CodeExplainModal';
import { TraceModal } from '../modals/TraceModal';
import { BenchmarkModal } from '../modals/BenchmarkModal';
import { CompareModal } from '../modals/CompareModal';
import { ProgramVersion } from '@/lib/history/types';
import {
  getProgramVersions,
  saveProgramVersion,
  updateVersionLabel,
  deleteProgramVersion,
  clearProgramHistory,
  versionToSnapshot,
} from '@/lib/history/HistoryManager';
import { SaveVersionModal } from '../modals/SaveVersionModal';
import { ProgramHistoryModal } from '../modals/ProgramHistoryModal';

const DEFAULT_SETTINGS: AppSettings = {
  key: 'app_settings',
  theme: 'vs-dark',
  fontSize: 14,
  tabSize: 4,
  autoSave: true,
};

export const WorkspaceContainer: React.FC = () => {
  // Live Query from Dexie IndexedDB as single source of truth for programs
  const rawPrograms = useLiveQuery(() => db.programs.toArray(), []);
  const programs = rawPrograms || [];

  // Live Query for Practice Problems & Attempts
  const rawPracticeProblems = useLiveQuery(() => db.practiceProblems.toArray(), []);
  const practiceProblems = rawPracticeProblems || [];

  const rawPracticeAttempts = useLiveQuery(() => db.practiceAttempts.toArray(), []);
  const practiceAttempts = rawPracticeAttempts || [];

  // Active View ('editor' | 'practice')
  const [activeView, setActiveView] = useState<'editor' | 'practice'>('editor');
  const [activePracticeProblem, setActivePracticeProblem] = useState<PracticeProblem | null>(null);

  // Evidence refs to guarantee zero stale evidence attachment to practice attempts
  const testedCodeRef = useRef<string | null>(null);
  const executedCodeRef = useRef<string | null>(null);
  const analyzedCodeRef = useRef<string | null>(null);

  // Practice Attempt modals & prompts state
  const [isDuplicatePromptOpen, setIsDuplicatePromptOpen] = useState(false);
  const [noProblemWarningMsg, setNoProblemWarningMsg] = useState<string | null>(null);
  const [solvedPromptProblem, setSolvedPromptProblem] = useState<PracticeProblem | null>(null);
  const [attemptToast, setAttemptToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

  // Selected Program UUID
  const [activeUuid, setActiveUuid] = useState<string | null>(null);
  const [currentCode, setCurrentCode] = useState<string>('');

  // Ref to guard async callbacks against rapid program switching race conditions
  const activeUuidRef = useRef<string | null>(activeUuid);
  useEffect(() => {
    activeUuidRef.current = activeUuid;
  }, [activeUuid]);

  // Seed DB once on initial mount
  useEffect(() => {
    async function init() {
      await seedInitialPrograms();
      await seedInitialPracticeProblems();
    }
    init();
  }, []);

  // Live Query of test cases for active program
  const rawTestCases = useLiveQuery(
    () => (activeUuid ? db.testCases.where('programUuid').equals(activeUuid).sortBy('createdAt') : []),
    [activeUuid]
  );
  const testCases = rawTestCases || [];

  // Testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testProgress, setTestProgress] = useState<{ completed: number; total: number } | null>(null);
  const [testSummary, setTestSummary] = useState<BatchTestSummary | null>(null);

  // Single Execution Result state
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  // Static Analysis & AI Review state
  const [analysisResult, setAnalysisResult] = useState<CodeAnalysisResult | null>(null);
  const [aiReview, setAiReview] = useState<AIReviewResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  // Phase 2D: Explain My Code state
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [explanation, setExplanation] = useState<CodeExplanation | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  // Phase 3A: Execution Trace state
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [traceLine, setTraceLine] = useState<number | null>(null);
  /** UUID of the program version that produced the current trace (for stale detection) */
  const [traceCodeSnapshot, setTraceCodeSnapshot] = useState<string | null>(null);

  // Phase 3B: Benchmark state
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState<{ completed: number; total: number } | null>(null);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
  /** Fingerprint of the benchmark parameters that produced the current result (for stale detection) */
  const [benchmarkFingerprint, setBenchmarkFingerprint] = useState<string | null>(null);
  /** AbortController for benchmark cancellation */
  const benchmarkAbortRef = useRef<AbortController | null>(null);

  // Phase 3C: Compare Code state
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [snapshotA, setSnapshotA] = useState<CodeSnapshot | null>(null);

  // Phase 3D: Program History state
  const [isSaveVersionModalOpen, setIsSaveVersionModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [programVersions, setProgramVersions] = useState<ProgramVersion[]>([]);

  // Execution & Console State
  const [isRunning, setIsRunning] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>('output');
  const [inputText, setInputText] = useState('');
  const [outputLog, setOutputLog] = useState('');
  const [errorLog, setErrorLog] = useState('');
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [programToRename, setProgramToRename] = useState<Program | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Saving status flags
  const [isSaving, setIsSaving] = useState(false);
  const [isUnsaved, setIsUnsaved] = useState(false);

  const saveDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Ensure activeUuid points to a valid program when rawPrograms loads or changes
  useEffect(() => {
    if (programs.length > 0) {
      const exists = programs.some((p) => p.uuid === activeUuid);
      if (!activeUuid || !exists) {
        setActiveUuid(programs[0].uuid);
        setCurrentCode(programs[0].code);
        setIsUnsaved(false);
      }
    } else {
      setActiveUuid(null);
      setCurrentCode('');
      setIsUnsaved(false);
    }
  }, [programs, activeUuid]);

  // Seed initial test case if active program has 0 test cases
  useEffect(() => {
    async function seedTestCasesIfNeeded() {
      if (activeUuid && rawTestCases !== undefined && rawTestCases.length === 0) {
        await createTestCase(activeUuid, '5', '');
      }
    }
    seedTestCasesIfNeeded();
  }, [activeUuid, rawTestCases]);

  // Keep local currentCode in sync when active program changes
  const activeProgram = programs.find((p) => p.uuid === activeUuid) || null;

  useEffect(() => {
    if (activeProgram) {
      setCurrentCode(activeProgram.code);
      setIsUnsaved(false);
    } else {
      setCurrentCode('');
      setIsUnsaved(false);
    }
    // Clear previous test summary and execution context when switching active program
    setTestSummary(null);
    setExecutionResult(null);
    setTestProgress(null);
    setAnalysisResult(null);
    setAiReview(null);
    setAiError(null);
    // Also clear stale trace when switching programs
    setTraceResult(null);
    setTraceError(null);
    setTraceLine(null);
    setTraceCodeSnapshot(null);
    // Also clear benchmark and snapshot when switching programs
    setBenchmarkResult(null);
    setBenchmarkError(null);
    setBenchmarkFingerprint(null);
    setBenchmarkProgress(null);
    setSnapshotA(null);
  }, [activeProgram?.uuid]);

  // Phase 3D: Load versions for active program
  const loadProgramVersions = useCallback(async () => {
    if (activeProgram?.uuid) {
      const versions = await getProgramVersions(activeProgram.uuid);
      setProgramVersions(versions);
    } else {
      setProgramVersions([]);
    }
  }, [activeProgram?.uuid]);

  useEffect(() => {
    loadProgramVersions();
  }, [loadProgramVersions]);

  // Handle program selection
  const handleSelectProgram = (uuid: string) => {
    if (uuid === activeUuid) return;
    if (activeUuid && isUnsaved) {
      saveActiveCodeNow(currentCode, activeUuid);
    }
    setActiveUuid(uuid);
    const target = programs.find((p) => p.uuid === uuid);
    if (target) {
      setCurrentCode(target.code);
      setIsUnsaved(false);
    }
  };

  // Helper to persist code to IndexedDB
  const saveActiveCodeNow = async (codeToSave: string, uuidToSave: string) => {
    if (!uuidToSave) return;
    const exists = await db.programs.where('uuid').equals(uuidToSave).first();
    if (!exists) return;

    setIsSaving(true);
    await updateProgram(uuidToSave, { code: codeToSave });
    setIsSaving(false);
    setIsUnsaved(false);
  };

  // Code change handler with auto-save debounce (500ms)
  const handleCodeChange = (newCode: string) => {
    setCurrentCode(newCode);
    setIsUnsaved(true);

    // Clear stale test, execution, static analysis, and AI review when code is modified
    setTestSummary(null);
    setExecutionResult(null);
    setAnalysisResult(null);
    setAiReview(null);
    setAiError(null);

    // Phase 3A: Invalidate trace when code changes (stale trace protection)
    if (traceCodeSnapshot !== null && newCode !== traceCodeSnapshot) {
      setTraceResult(null);
      setTraceError(null);
      setTraceLine(null);
      setTraceCodeSnapshot(null);
    }

    // Phase 3B: Invalidate benchmark when code changes
    if (benchmarkFingerprint !== null) {
      setBenchmarkFingerprint(null);
    }

    if (saveDebounceTimer.current) {
      clearTimeout(saveDebounceTimer.current);
    }

    if (activeUuid) {
      saveDebounceTimer.current = setTimeout(() => {
        saveActiveCodeNow(newCode, activeUuid);
      }, 500);
    }
  };

  // Manual save trigger (Ctrl+S)
  const handleManualSave = () => {
    if (activeUuid) {
      if (saveDebounceTimer.current) clearTimeout(saveDebounceTimer.current);
      saveActiveCodeNow(currentCode, activeUuid);
    }
  };

  // Create Program
  const handleCreateProgram = async (name: string, language: LanguageType) => {
    const defaultTemplateCode = STARTER_TEMPLATES[language].defaultCode;
    const newProg = await createProgram(name, language, defaultTemplateCode);
    setActiveUuid(newProg.uuid);
    setCurrentCode(newProg.code);
    setIsUnsaved(false);
    await createTestCase(newProg.uuid, '5', '');
  };

  // Rename Program
  const handleRenameProgram = async (newName: string) => {
    if (programToRename) {
      await updateProgram(programToRename.uuid, { name: newName });
      setProgramToRename(null);
    } else if (activeProgram) {
      await updateProgram(activeProgram.uuid, { name: newName });
    }
  };

  // Delete Program
  const handleDeleteProgram = async (uuid: string) => {
    // 1. Cancel pending auto-save timer to prevent race conditions or resurrecting program
    if (saveDebounceTimer.current) {
      clearTimeout(saveDebounceTimer.current);
      saveDebounceTimer.current = null;
    }
    setIsUnsaved(false);

    // 2. Perform DB deletion (cascades to test cases, versions, and unlinks practice problems)
    await deleteProgram(uuid);

    // 3. Query Dexie directly for fresh list of remaining programs
    const remaining = await db.programs.toArray();
    if (remaining.length > 0) {
      if (activeUuid === uuid) {
        setActiveUuid(remaining[0].uuid);
        setCurrentCode(remaining[0].code);
        setIsUnsaved(false);
      }
    } else {
      setActiveUuid(null);
      setCurrentCode('');
      setIsUnsaved(false);
    }

    // 4. Clear all stale state & evidence associated with the deleted program
    setExecutionResult(null);
    setTestSummary(null);
    setAnalysisResult(null);
    setAiReview(null);
    setAiError(null);
    setTraceResult(null);
    setTraceError(null);
    setTraceLine(null);
    setTraceCodeSnapshot(null);
    setBenchmarkResult(null);
    setBenchmarkError(null);
    setBenchmarkFingerprint(null);
    setSnapshotA(null);

    // 5. Unlink active practice problem if it referenced the deleted program
    if (activePracticeProblem && activePracticeProblem.programUuid === uuid) {
      setActivePracticeProblem((prev) => (prev ? { ...prev, programUuid: null } : null));
    }
  };

  // ─── Practice Workspace Handlers ─────────────────────────────────────
  const handleCreatePracticeProblem = async (data: {
    title: string;
    topic: string;
    difficulty: PracticeDifficulty;
    description: string;
    status: PracticeStatus;
    programUuid: string | null;
  }) => {
    await createPracticeProblem(data);
  };

  const handleUpdatePracticeProblem = async (uuid: string, updates: Partial<PracticeProblem>) => {
    await updatePracticeProblem(uuid, updates);
  };

  const handleDeletePracticeProblem = async (uuid: string) => {
    await deletePracticeProblem(uuid);
  };

  const handleOpenPracticeProgram = (problem: PracticeProblem, programUuid: string) => {
    setActivePracticeProblem(problem);
    setActiveUuid(programUuid);
    const prog = programs.find((p) => p.uuid === programUuid);
    if (prog) {
      setCurrentCode(prog.code);
    }
    setActiveView('editor');
  };

  const handleCreateAndLinkProgram = async (problem: PracticeProblem) => {
    const slug = problem.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'practice';
    const filename = `${slug}.py`;
    const newProg = await createProgram(filename, 'python');
    await updatePracticeProblem(problem.uuid, { programUuid: newProg.uuid });
    setActivePracticeProblem(problem);
    setActiveUuid(newProg.uuid);
    setCurrentCode(newProg.code);
    setActiveView('editor');
  };

  const handleDeleteAttempt = async (uuid: string) => {
    await deletePracticeAttempt(uuid);
  };

  const handleClearAllAttempts = async (practiceProblemUuid: string) => {
    await clearPracticeAttempts(practiceProblemUuid);
  };

  const handleCompareAttemptWithCurrent = (attempt: PracticeAttempt) => {
    if (!activeProgram) return;
    const attemptSnapshot: CodeSnapshot = {
      id: attempt.uuid,
      label: `Attempt #${attempt.attemptNumber} (${new Date(attempt.createdAt).toLocaleDateString()})`,
      code: attempt.code,
      language: attempt.language,
      input: attempt.input || '',
      mode: attempt.executionMode || 'offline',
      createdAt: attempt.createdAt,
      analysis: attempt.analysis,
      benchmark: attempt.benchmark,
      execution: attempt.execution,
      tests: attempt.tests,
    };
    setSnapshotA(attemptSnapshot);
    setIsCompareModalOpen(true);
  };

  const handleRecordAttempt = async () => {
    if (!activePracticeProblem) {
      setNoProblemWarningMsg('Open a practice problem before recording an attempt.');
      return;
    }
    if (!activeProgram) return;

    // Check duplicate attempt code against previous attempt for this problem
    const problemAttempts = practiceAttempts.filter(
      (a) => a.practiceProblemUuid === activePracticeProblem.uuid
    );
    const latestAttempt =
      problemAttempts.length > 0
        ? problemAttempts.reduce((max, a) => (a.createdAt > max.createdAt ? a : max))
        : null;

    if (latestAttempt && latestAttempt.code.trim() === currentCode.trim()) {
      setIsDuplicatePromptOpen(true);
      return;
    }

    await executeRecordAttempt();
  };

  const executeRecordAttempt = async () => {
    if (!activePracticeProblem || !activeProgram) return;

    // Evaluate stale state against evidence refs (Sections 4, 21)
    const isTestValid = testSummary && testedCodeRef.current === currentCode;
    const validTests = isTestValid ? testSummary : null;

    const isExecValid = executionResult && executedCodeRef.current === currentCode;
    const validExecution = isExecValid ? executionResult : null;

    const isAnalysisValid = analysisResult && analyzedCodeRef.current === currentCode;
    const validAnalysis = isAnalysisValid ? analysisResult : null;

    const currentFingerprint = computeFingerprint(
      activeProgram.language,
      currentCode,
      inputText
    );
    const isBenchmarkValid = benchmarkResult && benchmarkFingerprint === currentFingerprint;
    const validBenchmark = isBenchmarkValid ? benchmarkResult : null;

    const patterns = validAnalysis?.dsaPatterns?.map((p) => p.name) || [];

    // Outcome evaluation based strictly on test evidence (Section 2)
    let outcome: PracticeAttempt['outcome'] = 'Incomplete';
    if (validTests) {
      if (validTests.passed === validTests.total && validTests.total > 0) {
        outcome = 'Solved';
      } else {
        outcome = 'Failed';
      }
    }

    const newAttempt = await createPracticeAttempt({
      practiceProblemUuid: activePracticeProblem.uuid,
      programUuid: activeProgram.uuid,
      code: currentCode,
      language: activeProgram.language,
      input: inputText,
      execution: validExecution,
      tests: validTests,
      analysis: validAnalysis,
      benchmark: validBenchmark,
      patterns,
      outcome,
    });

    setAttemptToast({
      msg: `Attempt #${newAttempt.attemptNumber} recorded (${outcome})`,
      type: outcome === 'Solved' ? 'success' : 'info',
    });
    setTimeout(() => setAttemptToast(null), 4000);

    // If Solved and practice problem status is not Solved, prompt user to optionally mark problem Solved (Section 19)
    if (outcome === 'Solved' && activePracticeProblem.status !== 'Solved') {
      setSolvedPromptProblem(activePracticeProblem);
    }
  };

  // Language change from TopBar
  const handleLanguageChange = async (newLang: LanguageType) => {
    if (!activeProgram) return;
    if (activeProgram.language === newLang) return;

    // 1. Cancel pending auto-save timer immediately to prevent timer firing during confirmation dialog
    if (saveDebounceTimer.current) {
      clearTimeout(saveDebounceTimer.current);
      saveDebounceTimer.current = null;
    }

    const currentLang = activeProgram.language;
    const defaultOldCode = STARTER_TEMPLATES[currentLang].defaultCode;
    const isUntouchedDefault = currentCode.trim() === defaultOldCode.trim();

    // 2. CASE B: User has modified code -> Confirm before replacing with new starter template
    if (!isUntouchedDefault) {
      const confirmed = confirm(
        `Changing language will replace the current code with a ${STARTER_TEMPLATES[newLang].name} starter template. Continue?`
      );
      if (!confirmed) {
        // User cancelled -> Keep current code & current language untouched
        return;
      }
    }

    // 3. CASE A (or CASE B after confirmation): Proceed with language change & template update
    let updatedName = activeProgram.name;
    const oldExt = STARTER_TEMPLATES[currentLang].extension;
    const newExt = STARTER_TEMPLATES[newLang].extension;

    if (updatedName.endsWith(oldExt)) {
      updatedName = updatedName.substring(0, updatedName.length - oldExt.length) + newExt;
    } else {
      const dotIndex = updatedName.lastIndexOf('.');
      if (dotIndex > 0) {
        updatedName = updatedName.substring(0, dotIndex) + newExt;
      } else {
        updatedName = updatedName + newExt;
      }
    }

    const newCode = STARTER_TEMPLATES[newLang].defaultCode;

    // 4. Update program in Dexie IndexedDB
    await updateProgram(activeProgram.uuid, {
      language: newLang,
      name: updatedName,
      code: newCode,
    });

    // 5. Update React state
    setCurrentCode(newCode);
    setIsUnsaved(false);

    // 6. Invalidate all stale runtime evidence when language changes
    setExecutionResult(null);
    setTestSummary(null);
    setAnalysisResult(null);
    setAiReview(null);
    setAiError(null);
    setTraceResult(null);
    setTraceError(null);
    setTraceLine(null);
    setTraceCodeSnapshot(null);
    setBenchmarkResult(null);
    setBenchmarkError(null);
    setBenchmarkFingerprint(null);
    setSnapshotA(null);
  };

  // ▶ Run Action Execution Handler
  const handleRunProgram = async () => {
    if (!activeProgram || isRunning) return;
    const reqProgUuid = activeProgram.uuid;

    setIsRunning(true);
    setIsConsoleOpen(true);
    setOutputLog('');
    setErrorLog('');
    setExecutionTimeMs(null);
    setExitCode(null);

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language: activeProgram.language,
          code: currentCode,
          stdin: inputText
        })
      });

      const data: ExecutionResult = await res.json();

      // Guard against race condition: ignore response if active program changed
      if (activeUuidRef.current !== reqProgUuid) return;

      setExecutionResult(data);
      executedCodeRef.current = currentCode;
      setOutputLog(data.stdout || '');
      setErrorLog(data.stderr || '');
      setExecutionTimeMs(data.executionTimeMs ?? null);
      setExitCode(data.exitCode ?? null);

      if (
        data.status === 'compile_error' ||
        data.status === 'runtime_error' ||
        data.status === 'timeout' ||
        data.status === 'execution_error'
      ) {
        setConsoleTab('errors');
      } else {
        setConsoleTab('output');
      }
    } catch (err: any) {
      if (activeUuidRef.current !== reqProgUuid) return;
      setErrorLog(`Execution request failed: ${err.message || String(err)}`);
      setConsoleTab('errors');
    } finally {
      if (activeUuidRef.current === reqProgUuid) {
        setIsRunning(false);
      }
    }
  };

  // 🧪 Phase 2A Test Cases Handlers
  const handleAddTestCase = async () => {
    if (!activeProgram) return;
    await createTestCase(activeProgram.uuid, '', '');
  };

  const handleUpdateTestCase = async (uuid: string, updates: Partial<TestCase>) => {
    await updateTestCase(uuid, updates);
  };

  const handleDeleteTestCase = async (uuid: string) => {
    await deleteTestCase(uuid);
  };

  const handleOpenTestPanel = () => {
    setIsConsoleOpen(true);
    setConsoleTab('tests');
  };

  const handleRunTests = async () => {
    if (!activeProgram || isTesting || testCases.length === 0) return;
    const reqProgUuid = activeProgram.uuid;

    setIsTesting(true);
    setIsConsoleOpen(true);
    setConsoleTab('tests');
    setTestProgress({ completed: 0, total: testCases.length });

    try {
      const summary = await runTestCasesBatch(
        currentCode,
        activeProgram.language,
        testCases,
        (completed: number, total: number) => {
          if (activeUuidRef.current === reqProgUuid) {
            setTestProgress({ completed, total });
          }
        }
      );

      if (activeUuidRef.current !== reqProgUuid) return;
      setTestSummary(summary);
      testedCodeRef.current = currentCode;
    } catch (err: any) {
      // Handled inside runner
    } finally {
      if (activeUuidRef.current === reqProgUuid) {
        setIsTesting(false);
      }
    }
  };

  // 🔍 Phase 2C Intelligent Code Review Handler
  const handleOpenReviewModal = async () => {
    if (!activeProgram) return;
    const reqProgUuid = activeProgram.uuid;

    // 1. Run deterministic static code analysis immediately
    const staticAnalysis = analyzeCode(activeProgram.language, currentCode);
    setAnalysisResult(staticAnalysis);
    analyzedCodeRef.current = currentCode;
    setIsAnalysisModalOpen(true);

    // 2. Trigger asynchronous server-side AI Code Review
    setIsAiLoading(true);
    setAiError(null);
    setAiReview(null);

    const reviewContext: CodeReviewContext = {
      language: activeProgram.language,
      code: currentCode,
      analysis: staticAnalysis,
      execution: executionResult,
      tests: testSummary
    };

    try {
      const res = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewContext)
      });

      const data: AIReviewResponse = await res.json();

      if (activeUuidRef.current !== reqProgUuid) return;

      if (data.success && data.review) {
        setAiReview(data.review);
      } else {
        setAiError(data.error || 'AI review unavailable. Static analysis is active.');
      }
    } catch (err: any) {
      if (activeUuidRef.current !== reqProgUuid) return;
      setAiError('AI review endpoint unavailable. Static analysis is active.');
    } finally {
      if (activeUuidRef.current === reqProgUuid) {
        setIsAiLoading(false);
      }
    }
  };

  // 🧠 Phase 2D: Explain My Code Handler
  const handleOpenExplainModal = async () => {
    if (!activeProgram) return;
    const reqProgUuid = activeProgram.uuid;
    const trimmed = currentCode.trim();

    // Guard: empty code
    if (!trimmed) {
      setExplanation(null);
      setExplainError('No code available to explain.');
      setIsExplainModalOpen(true);
      return;
    }

    setIsExplainModalOpen(true);
    setExplanation(null);
    setExplainError(null);
    setIsExplaining(true);

    const context: CodeExplanationContext = {
      language: activeProgram.language,
      code: currentCode,
      analysis: analysisResult,
      execution: executionResult,
      tests: testSummary
    };

    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context)
      });

      const data: AIExplainResponse = await res.json();

      if (activeUuidRef.current !== reqProgUuid) return;

      if (data.success && data.explanation) {
        setExplanation(data.explanation);
      } else {
        setExplainError(data.error || 'AI explanation unavailable.');
      }
    } catch {
      if (activeUuidRef.current !== reqProgUuid) return;
      setExplainError('AI explanation endpoint unavailable. Please check your connection.');
    } finally {
      if (activeUuidRef.current === reqProgUuid) {
        setIsExplaining(false);
      }
    }
  };

  // ▶ Phase 3A: Trace Handler
  const handleOpenTraceModal = async () => {
    if (!activeProgram || isTracing) return;
    const reqProgUuid = activeProgram.uuid;
    const trimmed = currentCode.trim();

    if (!trimmed) {
      setTraceError('No code available to trace.');
      setTraceResult(null);
      setIsTraceModalOpen(true);
      return;
    }

    setIsTraceModalOpen(true);
    setIsTracing(true);
    setTraceError(null);
    setTraceResult(null);
    setTraceLine(null);

    try {
      const res = await fetch('/api/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: activeProgram.language,
          code: currentCode,
          stdin: inputText,
        }),
      });

      const data: TraceResult = await res.json();

      if (activeUuidRef.current !== reqProgUuid) return;

      setTraceResult(data);
      // Record the code snapshot that produced this trace
      setTraceCodeSnapshot(currentCode);

      if (data.status === 'error' || data.status === 'unsupported') {
        setTraceError(data.error ?? null);
      }
    } catch (err: unknown) {
      if (activeUuidRef.current !== reqProgUuid) return;
      const msg = err instanceof Error ? err.message : String(err);
      setTraceError(`Trace request failed: ${msg}`);
    } finally {
      if (activeUuidRef.current === reqProgUuid) {
        setIsTracing(false);
      }
    }
  };

  // 🏎️ Phase 3B: Benchmark Handler
  const handleOpenBenchmarkModal = () => {
    setIsBenchmarkModalOpen(true);
  };

  const handleRunBenchmark = async (runs: number) => {
    if (!activeProgram || isBenchmarking) return;
    const reqProgUuid = activeProgram.uuid;

    if (!currentCode.trim()) {
      setBenchmarkError('No code available to benchmark.');
      return;
    }

    // Cancel any in-flight benchmark
    if (benchmarkAbortRef.current) {
      benchmarkAbortRef.current.abort();
    }
    const abortController = new AbortController();
    benchmarkAbortRef.current = abortController;

    setIsBenchmarking(true);
    setBenchmarkError(null);
    setBenchmarkResult(null);
    setBenchmarkProgress({ completed: 0, total: runs });

    try {
      const result = await runBenchmark(
        {
          language: activeProgram.language,
          code: currentCode,
          stdin: inputText,
          runs,
        },
        abortController.signal,
        (completed, total) => {
          if (activeUuidRef.current === reqProgUuid) {
            setBenchmarkProgress({ completed, total });
          }
        }
      );

      if (activeUuidRef.current !== reqProgUuid) return;

      setBenchmarkResult(result);
      setBenchmarkFingerprint(result.fingerprint);
    } catch (err: unknown) {
      if (activeUuidRef.current !== reqProgUuid) return;
      const msg = err instanceof Error ? err.message : String(err);
      setBenchmarkError(`Benchmark failed: ${msg}`);
    } finally {
      if (activeUuidRef.current === reqProgUuid) {
        setIsBenchmarking(false);
        setBenchmarkProgress(null);
      }
      benchmarkAbortRef.current = null;
    }
  };

  const handleCancelBenchmark = () => {
    if (benchmarkAbortRef.current) {
      benchmarkAbortRef.current.abort();
    }
  };

  // Phase 3C: Compare Code handlers
  const handleTakeSnapshot = () => {
    if (!activeProgram) return;
    const newSnapshot: CodeSnapshot = {
      id: crypto.randomUUID(),
      label: `${activeProgram.name} (Snapshot)`,
      code: currentCode,
      language: activeProgram.language,
      input: inputText,
      createdAt: Date.now(),
      analysis: analysisResult,
      benchmark: benchmarkResult,
      execution: executionResult,
      tests: testSummary,
    };
    setSnapshotA(newSnapshot);
  };

  const handleOpenCompareModal = () => {
    if (!activeProgram) return;
    if (!snapshotA) {
      handleTakeSnapshot();
    }
    setIsCompareModalOpen(true);
  };

  // Phase 3D: Program History handlers
  const handleOpenSaveVersionModal = () => {
    if (!activeProgram) return;
    setIsSaveVersionModalOpen(true);
  };

  const handleOpenHistoryModal = () => {
    if (!activeProgram) return;
    setIsHistoryModalOpen(true);
  };

  const handleSaveVersionSubmit = async (label: string) => {
    if (!activeProgram) return { success: false, message: 'No active program.' };

    const res = await saveProgramVersion({
      programUuid: activeProgram.uuid,
      code: currentCode,
      language: activeProgram.language,
      input: inputText,
      label,
      executionResult,
      testSummary,
      analysisResult,
      benchmarkResult,
      benchmarkFingerprint,
      aiReview,
    });

    if (res.success) {
      await loadProgramVersions();
    }
    return res;
  };

  const handleRestoreVersion = (version: ProgramVersion) => {
    if (!activeProgram) return;
    // Replace current code & input
    setCurrentCode(version.code);
    setInputText(version.input ?? '');

    // Invalidate stale runtime state
    setExecutionResult(null);
    setTestSummary(null);
    setTestProgress(null);
    setAnalysisResult(null);
    setAiReview(null);
    setAiError(null);
    setTraceResult(null);
    setTraceError(null);
    setTraceLine(null);
    setTraceCodeSnapshot(null);
    setBenchmarkResult(null);
    setBenchmarkError(null);
    setBenchmarkFingerprint(null);

    // Mark as unsaved changes
    setIsUnsaved(true);
  };

  const handleCompareVersion = (version: ProgramVersion) => {
    const snap = versionToSnapshot(version);
    setSnapshotA(snap);
    setIsCompareModalOpen(true);
  };

  const handleUpdateVersionLabel = async (versionUuid: string, newLabel: string) => {
    await updateVersionLabel(versionUuid, newLabel);
    await loadProgramVersions();
  };

  const handleDeleteVersion = async (versionUuid: string) => {
    await deleteProgramVersion(versionUuid);
    await loadProgramVersions();
  };

  const handleClearHistory = async () => {
    if (!activeProgram) return;
    await clearProgramHistory(activeProgram.uuid);
    await loadProgramVersions();
  };

  const currentSnapshotB: CodeSnapshot = {
    id: 'current-version-b',
    label: `${activeProgram?.name ?? 'Current Code'} (Current)`,
    code: currentCode,
    language: activeProgram?.language ?? 'c',
    input: inputText,
    createdAt: Date.now(),
    analysis: analysisResult,
    benchmark: benchmarkResult,
    execution: executionResult,
    tests: testSummary,
  };

  // Reset database helper
  const handleResetDatabase = async () => {
    await db.programs.clear();
    await db.testCases.clear();
    await seedInitialPrograms();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d1117] text-gray-200 overflow-hidden">
      {/* Top Bar */}
      <TopBar
        currentProgram={activeProgram}
        onLanguageChange={handleLanguageChange}
        onProgramRename={(name) => handleRenameProgram(name)}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeView={activeView}
        onViewChange={setActiveView}
        activePracticeProblem={activePracticeProblem}
      />

      {/* Main Content View Switcher */}
      {activeView === 'practice' ? (
        <PracticeWorkspace
          problems={practiceProblems}
          programs={programs}
          attempts={practiceAttempts}
          onCreateProblem={handleCreatePracticeProblem}
          onUpdateProblem={handleUpdatePracticeProblem}
          onDeleteProblem={handleDeletePracticeProblem}
          onOpenPracticeProgram={handleOpenPracticeProgram}
          onCreateAndLinkProgram={handleCreateAndLinkProgram}
          onDeleteAttempt={handleDeleteAttempt}
          onClearAllAttempts={handleClearAllAttempts}
          onCompareAttemptWithCurrent={handleCompareAttemptWithCurrent}
        />
      ) : (
        /* Main Workspace Body (Editor View) */
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Sidebar */}
          <Sidebar
            programs={programs}
            activeUuid={activeUuid}
            onSelectProgram={handleSelectProgram}
            onOpenNewModal={() => setIsNewModalOpen(true)}
            onOpenRenameModal={(prog) => {
              setProgramToRename(prog);
              setIsRenameModalOpen(true);
            }}
            onDeleteProgram={handleDeleteProgram}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          {/* Center/Main Area: Toolbar + Editor + Console */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
            {/* Action Toolbar */}
            <EditorToolbar
              currentProgram={activeProgram}
              onRun={handleRunProgram}
              onOpenTestPanel={handleOpenTestPanel}
              onOpenReviewModal={handleOpenReviewModal}
              onOpenExplainModal={handleOpenExplainModal}
              onOpenTraceModal={handleOpenTraceModal}
              onOpenBenchmarkModal={handleOpenBenchmarkModal}
              onOpenCompareModal={handleOpenCompareModal}
              onOpenSaveVersionModal={handleOpenSaveVersionModal}
              onOpenHistoryModal={handleOpenHistoryModal}
              onRecordAttempt={handleRecordAttempt}
              activePracticeProblem={activePracticeProblem}
              isRunning={isRunning}
              isExplaining={isExplaining}
              isTracing={isTracing}
              isBenchmarking={isBenchmarking}
              isSaving={isSaving}
              isUnsaved={isUnsaved}
              onManualSave={handleManualSave}
            />

            {/* Editor Workspace */}
            <div className="flex-1 min-h-0 relative">
              {activeProgram ? (
                <MonacoEditorWrapper
                  code={currentCode}
                  language={activeProgram.language}
                  onChange={handleCodeChange}
                  onSave={handleManualSave}
                  settings={settings}
                  traceLine={isTraceModalOpen ? traceLine : null}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
                  <p className="text-sm font-medium">No program selected</p>
                  <button
                    onClick={() => setIsNewModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                  >
                    + Create New Program
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Console Panel */}
            <ConsolePanel
              isOpen={isConsoleOpen}
              onToggleOpen={() => setIsConsoleOpen(!isConsoleOpen)}
              activeTab={consoleTab}
              onTabChange={setConsoleTab}
              inputText={inputText}
              onInputChange={(val) => {
                setInputText(val);
                // Invalidate benchmark when input changes (result tied to code+input+language)
                if (benchmarkFingerprint !== null) setBenchmarkFingerprint(null);
              }}
              outputLog={outputLog}
              errorLog={errorLog}
              executionTimeMs={executionTimeMs}
              exitCode={exitCode}
              isRunning={isRunning}
              onClearConsole={() => {
                setOutputLog('');
                setErrorLog('');
                setExecutionTimeMs(null);
                setExitCode(null);
              }}
              testCases={testCases}
              onAddTestCase={handleAddTestCase}
              onUpdateTestCase={handleUpdateTestCase}
              onDeleteTestCase={handleDeleteTestCase}
              onRunTests={handleRunTests}
              isTesting={isTesting}
              testProgress={testProgress}
              testSummary={testSummary}
            />
          </main>
        </div>
      )}

      {/* Modals */}
      <NewProgramModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateProgram}
      />

      <RenameModal
        isOpen={isRenameModalOpen}
        currentName={programToRename?.name || activeProgram?.name || ''}
        onClose={() => {
          setIsRenameModalOpen(false);
          setProgramToRename(null);
        }}
        onRename={handleRenameProgram}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSet) => setSettings((prev) => ({ ...prev, ...newSet }))}
        onResetDatabase={handleResetDatabase}
      />

      <CodeAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        result={analysisResult}
        aiReview={aiReview}
        isAiLoading={isAiLoading}
        aiError={aiError}
        testSummary={testSummary}
        executionResult={executionResult}
      />

      <CodeExplainModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        explanation={explanation}
        isLoading={isExplaining}
        error={explainError}
        language={activeProgram?.language ?? 'c'}
      />

      <TraceModal
        isOpen={isTraceModalOpen}
        onClose={() => {
          setIsTraceModalOpen(false);
          setTraceLine(null);
        }}
        result={traceResult}
        isLoading={isTracing}
        error={traceError}
        language={activeProgram?.language ?? 'c'}
        onRequestTrace={handleOpenTraceModal}
        onHighlightLine={setTraceLine}
      />

      <BenchmarkModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
        result={benchmarkResult}
        isBenchmarking={isBenchmarking}
        benchmarkProgress={benchmarkProgress}
        error={benchmarkError}
        language={activeProgram?.language ?? 'c'}
        currentInput={inputText}
        onRunBenchmark={handleRunBenchmark}
        onCancelBenchmark={handleCancelBenchmark}
        isStale={
          benchmarkResult !== null &&
          benchmarkFingerprint !== null &&
          benchmarkFingerprint !== computeFingerprint(
            activeProgram?.language ?? 'c',
            currentCode,
            inputText
          )
        }
      />

      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        snapshotA={snapshotA}
        snapshotB={currentSnapshotB}
        currentCode={currentCode}
        onTakeSnapshot={handleTakeSnapshot}
        onOpenBenchmarkModal={handleOpenBenchmarkModal}
      />

      <SaveVersionModal
        isOpen={isSaveVersionModalOpen}
        onClose={() => setIsSaveVersionModalOpen(false)}
        defaultVersionNumber={
          programVersions.reduce((max, v) => Math.max(max, v.versionNumber), 0) + 1
        }
        onSave={handleSaveVersionSubmit}
      />

      <ProgramHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        programName={activeProgram?.name ?? 'Program'}
        versions={programVersions}
        currentCode={currentCode}
        onOpenSaveVersionModal={handleOpenSaveVersionModal}
        onRestoreVersion={handleRestoreVersion}
        onCompareVersion={handleCompareVersion}
        onUpdateLabel={handleUpdateVersionLabel}
        onDeleteVersion={handleDeleteVersion}
        onClearHistory={handleClearHistory}
      />

      {/* No Problem Warning Modal */}
      {noProblemWarningMsg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNoProblemWarningMsg(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="no-problem-warning-title"
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="no-problem-warning-title" className="text-sm font-bold text-amber-400">No Active Practice Problem</h3>
            <p className="text-xs text-gray-300">{noProblemWarningMsg}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setNoProblemWarningMsg(null)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Attempt Prompt */}
      {isDuplicatePromptOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDuplicatePromptOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-attempt-prompt-title"
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="duplicate-attempt-prompt-title" className="text-sm font-bold text-gray-100">Duplicate Code Attempt</h3>
            <p className="text-xs text-gray-400">
              This code matches your previous recorded attempt for "{activePracticeProblem?.title}".
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsDuplicatePromptOpen(false)}
                className="px-3.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 border border-[#30363d] rounded text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsDuplicatePromptOpen(false);
                  await executeRecordAttempt();
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
              >
                Record Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Solved Status Prompt */}
      {solvedPromptProblem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSolvedPromptProblem(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="solved-prompt-title"
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="solved-prompt-title" className="text-sm font-bold text-emerald-400">Attempt Solved! 🎉</h3>
            <p className="text-xs text-gray-300">
              All test cases passed for "{solvedPromptProblem.title}". Would you like to mark this practice problem as Solved?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSolvedPromptProblem(null)}
                className="px-3.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 border border-[#30363d] rounded text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
              >
                Keep Current Status
              </button>
              <button
                onClick={async () => {
                  await updatePracticeProblem(solvedPromptProblem.uuid, { status: 'Solved' });
                  if (activePracticeProblem?.uuid === solvedPromptProblem.uuid) {
                    setActivePracticeProblem((prev) => (prev ? { ...prev, status: 'Solved' } : null));
                  }
                  setSolvedPromptProblem(null);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
              >
                Mark as Solved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attempt Toast Notification */}
      {attemptToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#161b22] border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span>{attemptToast.msg}</span>
        </div>
      )}
    </div>
  );
};
