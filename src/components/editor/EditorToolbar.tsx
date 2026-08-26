'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Search,
  Brain,
  FlaskConical,
  Save,
  CheckCircle2,
  Loader2,
  Activity,
  Gauge,
  ArrowLeftRight,
  History,
  Target,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';
import { Program } from '@/types';
import { PracticeProblem } from '@/lib/practice/types';

interface EditorToolbarProps {
  currentProgram: Program | null;
  onRun: () => void;
  onOpenTestPanel: () => void;
  onOpenReviewModal: () => void;
  onOpenExplainModal: () => void;
  onOpenTraceModal: () => void;
  onOpenBenchmarkModal: () => void;
  onOpenCompareModal: () => void;
  onOpenSaveVersionModal: () => void;
  onOpenHistoryModal: () => void;
  onRecordAttempt: () => void;
  onOpenAttemptHistory?: () => void;
  activePracticeProblem?: PracticeProblem | null;
  isRunning: boolean;
  isExplaining: boolean;
  isTracing: boolean;
  isBenchmarking: boolean;
  isSaving: boolean;
  isUnsaved: boolean;
  onManualSave: () => void;
}

// ─── More Menu Item ──────────────────────────────────────────────────────────
interface MoreMenuItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const MoreMenuItem: React.FC<MoreMenuItemProps> = ({
  icon,
  label,
  description,
  onClick,
  disabled = false,
  isLoading = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled || isLoading}
    className="w-full flex items-start gap-3 px-3 py-2 rounded-md text-left transition-colors hover:bg-[#21262d] disabled:opacity-40 disabled:cursor-not-allowed group"
  >
    <span className="mt-0.5 shrink-0 w-4 h-4 flex items-center justify-center">
      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" /> : icon}
    </span>
    <div>
      <div className="text-xs font-medium text-gray-200 group-hover:text-white leading-none mb-0.5">
        {label}
      </div>
      <div className="text-[11px] text-gray-500 leading-tight">{description}</div>
    </div>
  </button>
);

// ─── Section Label ───────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-3 pt-2 pb-1">
    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
  </div>
);

const Divider = () => <div className="border-t border-[#30363d] my-1" />;

// ─── EditorToolbar ───────────────────────────────────────────────────────────
export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  currentProgram,
  onRun,
  onOpenTestPanel,
  onOpenReviewModal,
  onOpenExplainModal,
  onOpenTraceModal,
  onOpenBenchmarkModal,
  onOpenCompareModal,
  onOpenSaveVersionModal,
  onOpenHistoryModal,
  onRecordAttempt,
  activePracticeProblem,
  isRunning,
  isExplaining,
  isTracing,
  isBenchmarking,
  isSaving,
  isUnsaved,
  onManualSave,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // Capability flags
  const disabled = !currentProgram;

  // Close More menu when clicking outside
  useEffect(() => {
    if (!isMoreOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        moreRef.current &&
        !moreRef.current.contains(e.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(e.target as Node)
      ) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMoreOpen]);

  // Keyboard: Escape closes the menu
  useEffect(() => {
    if (!isMoreOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMoreOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isMoreOpen]);

  const closeAndCall = useCallback((fn: () => void) => {
    setIsMoreOpen(false);
    fn();
  }, []);

  return (
    <div className="h-10 bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between select-none z-10 relative">
      {/* ── Left: Primary Actions ── */}
      <div className="flex items-center gap-1.5 min-w-0">

        {/* ▶ Run — strongest primary action */}
        <button
          onClick={onRun}
          disabled={disabled || isRunning}
          aria-label="Run Program"
          title="Run Program (Ctrl + S then Run)"
          className="flex items-center gap-1.5 px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span>Running…</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              <span>Run</span>
            </>
          )}
        </button>

        <div className="h-4 w-px bg-[#30363d] mx-0.5" />

        {/* 🧪 Test — always visible secondary */}
        <button
          onClick={onOpenTestPanel}
          disabled={disabled}
          aria-label="Open Test Panel"
          title="Test Cases"
          className="flex items-center gap-1.5 px-2.5 py-1 text-gray-300 hover:text-gray-100 hover:bg-[#21262d] disabled:opacity-40 rounded text-xs font-medium cursor-pointer transition-colors disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
        >
          <FlaskConical className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
          <span>Test</span>
        </button>

        {/* 🔍 Review — static analysis & AI insights */}
        <button
          onClick={onOpenReviewModal}
          disabled={disabled}
          aria-label="Open Code Review"
          title="Code Review — static analysis & AI insights"
          className="flex items-center gap-1.5 px-2.5 py-1 text-gray-300 hover:text-gray-100 hover:bg-[#21262d] disabled:opacity-40 rounded text-xs font-medium cursor-pointer transition-colors disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
        >
          <Search className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
          <span>Review</span>
        </button>

        {/* 🧠 Explain — AI analysis & explanation */}
        <button
          onClick={onOpenExplainModal}
          disabled={disabled || isExplaining}
          aria-label="Explain Code"
          title="Explain Code — AI analysis & explanation"
          className="flex items-center gap-1.5 px-2.5 py-1 text-gray-300 hover:text-gray-100 hover:bg-[#21262d] disabled:opacity-40 rounded text-xs font-medium cursor-pointer transition-colors disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
        >
          {isExplaining ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" aria-hidden="true" />
          ) : (
            <Brain className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" />
          )}
          <span>Explain</span>
        </button>

        <div className="h-4 w-px bg-[#30363d] mx-0.5" />

        {/* ⋯ More — dropdown for secondary tools */}
        <div className="relative">
          <button
            ref={moreButtonRef}
            onClick={() => setIsMoreOpen((v) => !v)}
            disabled={disabled}
            aria-label="More Tools"
            aria-expanded={isMoreOpen}
            aria-haspopup="true"
            title="More Tools"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50 ${
              isMoreOpen
                ? 'bg-[#21262d] text-gray-100 border border-[#30363d]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#21262d]'
            }`}
          >
            <MoreHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>More</span>
          </button>

          {/* ── More Dropdown ── */}
          {isMoreOpen && (
            <div
              ref={moreRef}
              role="menu"
              aria-label="More Tools Menu"
              className="absolute top-[calc(100%+6px)] left-0 z-50 w-60 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl py-1.5 overflow-hidden"
            >
              {/* ─ Execution ─ */}
              <SectionLabel label="Execution" />
              <MoreMenuItem
                icon={<Activity className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" />}
                label="Trace"
                description="Step through program execution"
                onClick={() => closeAndCall(onOpenTraceModal)}
                disabled={disabled}
                isLoading={isTracing}
              />
              <MoreMenuItem
                icon={<Gauge className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />}
                label="Benchmark"
                description="Measure observed runtime"
                onClick={() => closeAndCall(onOpenBenchmarkModal)}
                disabled={disabled}
                isLoading={isBenchmarking}
              />

              <Divider />

              {/* ─ Code ─ */}
              <SectionLabel label="Code" />
              <MoreMenuItem
                icon={<ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />}
                label="Compare"
                description="Compare two code versions"
                onClick={() => closeAndCall(onOpenCompareModal)}
                disabled={disabled}
              />
              <MoreMenuItem
                icon={<Save className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />}
                label="Save Version"
                description="Create a history checkpoint"
                onClick={() => closeAndCall(onOpenSaveVersionModal)}
                disabled={disabled}
              />
              <MoreMenuItem
                icon={<History className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />}
                label="History"
                description="View and restore saved versions"
                onClick={() => closeAndCall(onOpenHistoryModal)}
                disabled={disabled}
              />

              {/* ─ Practice (only when active) ─ */}
              {activePracticeProblem && (
                <>
                  <Divider />
                  <SectionLabel label="Practice" />
                  <MoreMenuItem
                    icon={<Target className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />}
                    label="Record Attempt"
                    description={`Save attempt for "${activePracticeProblem.title}"`}
                    onClick={() => closeAndCall(onRecordAttempt)}
                    disabled={disabled}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Save Status ── */}
      <div className="flex items-center gap-3 text-xs shrink-0">
        <button
          onClick={onManualSave}
          disabled={disabled}
          aria-label="Manual Save (Ctrl+S)"
          title="Manual Save (Ctrl + S)"
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50 rounded px-1"
        >
          {isSaving ? (
            <span className="text-amber-400 animate-pulse font-mono text-[11px]">Saving…</span>
          ) : isUnsaved ? (
            <span className="flex items-center gap-1 text-amber-400 font-mono text-[11px]">
              <Save className="w-3 h-3" aria-hidden="true" /> Unsaved
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-500 font-mono text-[11px]">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Saved
            </span>
          )}
        </button>
        <span className="hidden md:inline font-mono text-[10px] text-gray-600 bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#30363d]">
          Ctrl+S
        </span>
      </div>
    </div>
  );
};
