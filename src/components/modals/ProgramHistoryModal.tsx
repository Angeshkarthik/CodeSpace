'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Clock,
  Save,
  RotateCcw,
  ArrowLeftRight,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Pencil,
  Check,
  Gauge,
  FlaskConical,
  Activity,
  Layers,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { MONACO_LANG_MAP } from '@/lib/constants';
import { ProgramVersion } from '@/lib/history/types';
import { fmtMs } from '@/lib/benchmark/types';

interface ProgramHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  programName: string;
  versions: ProgramVersion[];
  currentCode: string;
  onOpenSaveVersionModal: () => void;
  onRestoreVersion: (version: ProgramVersion) => void;
  onCompareVersion: (version: ProgramVersion) => void;
  onUpdateLabel: (versionUuid: string, newLabel: string) => Promise<void>;
  onDeleteVersion: (versionUuid: string) => Promise<void>;
  onClearHistory: () => Promise<void>;
}

export const ProgramHistoryModal: React.FC<ProgramHistoryModalProps> = ({
  isOpen,
  onClose,
  programName,
  versions,
  currentCode,
  onOpenSaveVersionModal,
  onRestoreVersion,
  onCompareVersion,
  onUpdateLabel,
  onDeleteVersion,
  onClearHistory,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<ProgramVersion | null>(null);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [confirmDeleteUuid, setConfirmDeleteUuid] = useState<string | null>(null);
  const [confirmRestoreVersion, setConfirmRestoreVersion] = useState<ProgramVersion | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Keyboard shortcut: Escape to close top-most sub-dialog or modal
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmRestoreVersion) {
          setConfirmRestoreVersion(null);
        } else if (confirmDeleteUuid) {
          setConfirmDeleteUuid(null);
        } else if (confirmClearAll) {
          setConfirmClearAll(false);
        } else if (editingUuid) {
          setEditingUuid(null);
        } else if (selectedVersion) {
          setSelectedVersion(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    isOpen,
    onClose,
    confirmRestoreVersion,
    confirmDeleteUuid,
    confirmClearAll,
    editingUuid,
    selectedVersion,
  ]);

  if (!isOpen) return null;

  const latestSavedVersion = versions[0];
  const isCurrentModified =
    latestSavedVersion && latestSavedVersion.code.trim() !== currentCode.trim();

  const handleStartRename = (v: ProgramVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUuid(v.uuid);
    setEditLabel(v.label);
  };

  const handleSaveRename = async (vUuid: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingUuid) {
      await onUpdateLabel(vUuid, editLabel);
      setEditingUuid(null);
    }
  };

  const monacoLanguage = selectedVersion
    ? MONACO_LANG_MAP[selectedVersion.language] || 'plaintext'
    : 'plaintext';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex flex-col w-full max-w-5xl h-[88vh] bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#30363d] bg-[#161b22] shrink-0">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                Program History
                <span className="text-gray-400 font-mono font-normal">({programName})</span>
              </h2>
              <p className="text-[11px] text-gray-400">
                {versions.length} saved version{versions.length !== 1 ? 's' : ''} • Intentional program checkpoints
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenSaveVersionModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Version</span>
            </button>
            {versions.length > 0 && (
              <button
                onClick={() => setConfirmClearAll(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#21262d] hover:bg-red-900/30 hover:text-red-300 text-gray-400 border border-[#30363d] rounded text-xs transition-colors cursor-pointer"
                title="Clear all saved history for this program"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#30363d] text-gray-400 hover:text-gray-100 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Status Bar ── */}
        <div className="flex items-center justify-between px-5 py-2 bg-[#0d1117] border-b border-[#21262d] text-xs font-mono shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Current Editor Status:</span>
            {isCurrentModified ? (
              <span className="px-2 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-700/30 text-[11px]">
                Modified since v{latestSavedVersion.versionNumber}
              </span>
            ) : latestSavedVersion ? (
              <span className="px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-300 border border-emerald-700/30 text-[11px]">
                Saved as v{latestSavedVersion.versionNumber}
              </span>
            ) : (
              <span className="text-gray-500 text-[11px]">No saved versions</span>
            )}
          </div>

          {latestSavedVersion && (
            <span className="text-gray-500 text-[11px]">
              Latest Checkpoint: v{latestSavedVersion.versionNumber} ({new Date(latestSavedVersion.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </span>
          )}
        </div>

        {/* ── Modal Body Split ── */}
        <div className="flex-1 flex min-h-0 divide-x divide-[#30363d] overflow-hidden">

          {/* Left Column: Version History Timeline */}
          <div className="w-full md:w-1/2 flex flex-col min-h-0 bg-[#0d1117]">
            {versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center space-y-3">
                <History className="w-10 h-10 text-gray-600" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-gray-300">No Saved Versions</h3>
                  <p className="text-xs text-gray-500 max-w-xs">
                    Click "Save Version" above to create a persistent checkpoint of your code, complexity analysis, and benchmark evidence.
                  </p>
                </div>
                <button
                  onClick={onOpenSaveVersionModal}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save First Version</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {versions.map((v) => {
                  const isSelected = selectedVersion?.uuid === v.uuid;
                  return (
                    <div
                      key={v.uuid}
                      onClick={() => setSelectedVersion(v)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-[#161b22] border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-[#161b22]/70 hover:bg-[#161b22] border-[#30363d]'
                      }`}
                    >
                      {/* Item Top Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 font-mono text-xs font-bold shrink-0">
                            v{v.versionNumber}
                          </span>

                          {editingUuid === v.uuid ? (
                            <form
                              onSubmit={(e) => handleSaveRename(v.uuid, e)}
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                className="px-2 py-0.5 bg-[#0d1117] border border-emerald-500 rounded text-xs text-gray-200 font-mono focus:outline-hidden"
                                autoFocus
                              />
                              <button
                                type="submit"
                                className="p-1 text-emerald-400 hover:text-emerald-300"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-xs font-semibold text-gray-200 truncate">
                                {v.label}
                              </span>
                              <button
                                onClick={(e) => handleStartRename(v, e)}
                                className="p-0.5 text-gray-500 hover:text-gray-300 transition-colors"
                                title="Rename label"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        <span className="text-[11px] font-mono text-gray-500 shrink-0">
                          {new Date(v.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          •{' '}
                          {new Date(v.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Item Evidence Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-[#21262d] text-gray-400 border border-[#30363d] uppercase">
                          {v.language}
                        </span>

                        {v.analysis && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/40">
                            {v.analysis.complexity.time.estimate} • {v.analysis.complexity.space.estimate}
                          </span>
                        )}

                        {v.benchmark && v.benchmark.averageMs !== undefined && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                            Avg: {fmtMs(v.benchmark.averageMs)} ms
                          </span>
                        )}

                        {v.tests && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                            Tests: {v.tests.passed}/{v.tests.total}
                          </span>
                        )}

                        {v.execution && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                            Status: {v.execution.status}
                          </span>
                        )}
                      </div>

                      {/* Item Action Buttons */}
                      <div
                        className="flex items-center justify-end gap-1.5 pt-1 border-t border-[#21262d]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedVersion(v)}
                          className="flex items-center gap-1 px-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded text-[11px] transition-colors"
                          title="View source code & detailed evidence"
                        >
                          <Eye className="w-3 h-3 text-sky-400" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => onCompareVersion(v)}
                          className="flex items-center gap-1 px-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded text-[11px] transition-colors"
                          title="Compare this version using Compare Code"
                        >
                          <ArrowLeftRight className="w-3 h-3 text-emerald-400" />
                          <span>Compare</span>
                        </button>

                        <button
                          onClick={() => setConfirmRestoreVersion(v)}
                          className="flex items-center gap-1 px-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded text-[11px] transition-colors"
                          title="Restore code into current editor"
                        >
                          <RotateCcw className="w-3 h-3 text-purple-400" />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={() => setConfirmDeleteUuid(v.uuid)}
                          className="p-1 bg-[#21262d] hover:bg-red-900/30 text-gray-400 hover:text-red-300 rounded transition-colors"
                          title="Delete version"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Code Preview & Metadata Detail */}
          <div className="hidden md:flex md:w-1/2 flex-col min-h-0 bg-[#0d1117]">
            {selectedVersion ? (
              <div className="flex-1 flex flex-col min-h-0">

                {/* Detail Header */}
                <div className="px-4 py-2.5 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 font-bold">
                      v{selectedVersion.versionNumber}
                    </span>
                    <span className="text-gray-200 font-semibold truncate max-w-[200px]">
                      {selectedVersion.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRestoreVersion(selectedVersion)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-700/50 rounded text-xs transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore Code</span>
                    </button>
                  </div>
                </div>

                {/* Monaco Read-only Code View */}
                <div className="flex-1 min-h-0 relative">
                  <Editor
                    height="100%"
                    language={monacoLanguage}
                    value={selectedVersion.code}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>

                {/* Detail Metadata Drawer */}
                <div className="p-3 bg-[#161b22] border-t border-[#30363d] space-y-2 text-xs font-mono max-h-[160px] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-gray-500">Created:</span>{' '}
                      <span className="text-gray-300">
                        {new Date(selectedVersion.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Language:</span>{' '}
                      <span className="text-gray-300 uppercase">{selectedVersion.language}</span>
                    </div>
                  </div>

                  {selectedVersion.analysis && (
                    <div className="text-[11px] bg-[#0d1117] p-2 rounded border border-[#21262d] space-y-0.5">
                      <div className="text-gray-400 font-semibold">Static Complexity:</div>
                      <div className="text-sky-300">
                        Time: {selectedVersion.analysis.complexity.time.estimate} ({selectedVersion.analysis.complexity.time.confidence}) • Space: {selectedVersion.analysis.complexity.space.estimate}
                      </div>
                    </div>
                  )}

                  {selectedVersion.benchmark && selectedVersion.benchmark.averageMs !== undefined && (
                    <div className="text-[11px] bg-[#0d1117] p-2 rounded border border-[#21262d] space-y-0.5">
                      <div className="text-gray-400 font-semibold">Benchmark Evidence:</div>
                      <div className="text-amber-300">
                        Average: {fmtMs(selectedVersion.benchmark.averageMs)} ms • Median: {fmtMs(selectedVersion.benchmark.medianMs ?? 0)} ms ({selectedVersion.benchmark.successfulRuns} runs)
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 p-6 text-center text-gray-500 font-mono text-xs space-y-2">
                <FileCode2 className="w-8 h-8 text-gray-600" />
                <p>Select a version from the timeline on the left to preview source code and preserved evidence details.</p>
              </div>
            )}
          </div>

        </div>

        {/* ── Dialog Overlays ── */}

        {/* Confirmation: Restore */}
        {confirmRestoreVersion && (
          <div
            className="absolute inset-0 z-60 bg-black/70 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmRestoreVersion(null);
            }}
          >
            <div
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 max-w-sm w-full space-y-3 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                <RotateCcw className="w-5 h-5" />
                <h3>Restore Version {confirmRestoreVersion.versionNumber}?</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                This will replace your current editor code with <strong className="text-white">{confirmRestoreVersion.label}</strong>. Your current unsaved editor changes will be overwritten.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmRestoreVersion(null)}
                  className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onRestoreVersion(confirmRestoreVersion);
                    setConfirmRestoreVersion(null);
                    onClose();
                  }}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                >
                  Restore Version
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation: Delete Single Version */}
        {confirmDeleteUuid && (
          <div
            className="absolute inset-0 z-60 bg-black/70 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmDeleteUuid(null);
            }}
          >
            <div
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 max-w-sm w-full space-y-3 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                <Trash2 className="w-5 h-5" />
                <h3>Delete Historical Version?</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Are you sure you want to delete this checkpoint? This action cannot be undone. Remaining versions will keep their current version numbering.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmDeleteUuid(null)}
                  className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await onDeleteVersion(confirmDeleteUuid);
                    setConfirmDeleteUuid(null);
                    if (selectedVersion?.uuid === confirmDeleteUuid) setSelectedVersion(null);
                  }}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation: Clear All History */}
        {confirmClearAll && (
          <div
            className="absolute inset-0 z-60 bg-black/70 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmClearAll(false);
            }}
          >
            <div
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 max-w-sm w-full space-y-3 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <h3>Clear Program History?</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Are you sure you want to delete ALL saved versions for <strong className="text-white">{programName}</strong>? All historical checkpoints and preserved evidence will be permanently deleted.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmClearAll(false)}
                  className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await onClearHistory();
                    setConfirmClearAll(false);
                    setSelectedVersion(null);
                  }}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                >
                  Clear All History
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-[#30363d] bg-[#161b22] p-3 flex items-center justify-between">
          <div className="text-[11px] text-gray-500 font-mono">
            Persistent Dexie.js program history • Phase 3D
          </div>
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
