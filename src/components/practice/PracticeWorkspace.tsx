'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  CheckCircle2,
  Clock,
  Circle,
  FileCode,
  Edit2,
  Trash2,
  ExternalLink,
  Tag,
  AlertCircle
} from 'lucide-react';
import { Layers, BarChart3 } from 'lucide-react';
import { Program } from '@/types';
import { PracticeProblem, PracticeDifficulty, PracticeStatus, PracticeAttempt } from '@/lib/practice/types';
import { PracticeProblemModal } from '../modals/PracticeProblemModal';
import { AttemptHistoryModal } from '../modals/AttemptHistoryModal';
import { PracticeAnalytics } from './PracticeAnalytics';

interface PracticeWorkspaceProps {
  problems: PracticeProblem[];
  programs: Program[];
  attempts: PracticeAttempt[];
  onCreateProblem: (data: {
    title: string;
    topic: string;
    difficulty: PracticeDifficulty;
    description: string;
    status: PracticeStatus;
    programUuid: string | null;
  }) => Promise<void>;
  onUpdateProblem: (uuid: string, updates: Partial<PracticeProblem>) => Promise<void>;
  onDeleteProblem: (uuid: string) => Promise<void>;
  onOpenPracticeProgram: (problem: PracticeProblem, programUuid: string) => void;
  onCreateAndLinkProgram: (problem: PracticeProblem) => Promise<void>;
  onDeleteAttempt: (uuid: string) => Promise<void>;
  onClearAllAttempts: (practiceProblemUuid: string) => Promise<void>;
  onCompareAttemptWithCurrent: (attempt: PracticeAttempt) => void;
}

export const PracticeWorkspace: React.FC<PracticeWorkspaceProps> = ({
  problems,
  programs,
  attempts,
  onCreateProblem,
  onUpdateProblem,
  onDeleteProblem,
  onOpenPracticeProgram,
  onCreateAndLinkProgram,
  onDeleteAttempt,
  onClearAllAttempts,
  onCompareAttemptWithCurrent,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'analytics'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | PracticeDifficulty>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | PracticeStatus>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [problemToEdit, setProblemToEdit] = useState<PracticeProblem | null>(null);
  const [problemToDelete, setProblemToDelete] = useState<PracticeProblem | null>(null);
  const [historyProblem, setHistoryProblem] = useState<PracticeProblem | null>(null);

  // Quick program linker modal state (for unlinked problems)
  const [problemToLink, setProblemToLink] = useState<PracticeProblem | null>(null);
  const [selectedProgramToLink, setSelectedProgramToLink] = useState<string>('');

  // Client-side search and filtering
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q || p.title.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q);
      const matchesDifficulty = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesDifficulty && matchesStatus;
    });
  }, [problems, searchQuery, difficultyFilter, statusFilter]);

  const handleSaveProblem = async (data: {
    title: string;
    topic: string;
    difficulty: PracticeDifficulty;
    description: string;
    status: PracticeStatus;
    programUuid: string | null;
  }) => {
    if (problemToEdit) {
      await onUpdateProblem(problemToEdit.uuid, data);
    } else {
      await onCreateProblem(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (problemToDelete) {
      await onDeleteProblem(problemToDelete.uuid);
      setProblemToDelete(null);
    }
  };

  const handleLinkExistingSubmit = async () => {
    if (problemToLink && selectedProgramToLink) {
      await onUpdateProblem(problemToLink.uuid, { programUuid: selectedProgramToLink });
      const targetProg = programs.find((p) => p.uuid === selectedProgramToLink);
      if (targetProg) {
        onOpenPracticeProgram(problemToLink, targetProg.uuid);
      }
      setProblemToLink(null);
    }
  };

  React.useEffect(() => {
    if (!problemToDelete && !problemToLink) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (problemToDelete) {
          setProblemToDelete(null);
        } else if (problemToLink) {
          setProblemToLink(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [problemToDelete, problemToLink]);

  const renderDifficultyBadge = (difficulty: PracticeDifficulty) => {
    switch (difficulty) {
      case 'Easy':
        return (
          <span className="text-[11px] font-medium text-emerald-500 dark:text-emerald-400">
            Easy
          </span>
        );
      case 'Medium':
        return (
          <span className="text-[11px] font-medium text-amber-500 dark:text-amber-400">
            Medium
          </span>
        );
      case 'Hard':
        return (
          <span className="text-[11px] font-medium text-red-500 dark:text-red-400">
            Hard
          </span>
        );
    }
  };

  const renderStatusBadge = (status: PracticeStatus) => {
    switch (status) {
      case 'Solved':
        return (
          <span className="flex items-center gap-1 text-emerald-400 font-medium text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Solved
          </span>
        );
      case 'In Progress':
        return (
          <span className="flex items-center gap-1 text-sky-400 font-medium text-xs">
            <Clock className="w-3.5 h-3.5" /> In Progress
          </span>
        );
      case 'Not Started':
      default:
        return (
          <span className="flex items-center gap-1 text-secondary font-medium text-xs">
            <Circle className="w-3.5 h-3.5" /> Not Started
          </span>
        );
    }
  };

  return (
    <div className="flex-1 bg-canvas text-primary overflow-y-auto p-6 select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-subtle">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-primary">Practice Workspace</h1>
            <p className="text-xs text-muted mt-0.5">
              Personal DSA & Placement Practice Organization — link problems directly to CodeSpace programs.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-surface-elevated rounded-md p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'catalog'
                    ? 'bg-surface-hover text-emerald-400 shadow-xs'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Catalog</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-surface-hover text-cyan-400 shadow-xs'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analytics</span>
              </button>
            </div>

            {activeTab === 'catalog' && (
              <button
                onClick={() => {
                  setProblemToEdit(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Problem</span>
              </button>
            )}
          </div>
        </div>

        {activeTab === 'catalog' ? (
          <>
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-2">
              {/* Client Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-secondary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search problems by title or topic..."
                  className="w-full bg-surface border border-subtle rounded-md pl-8 pr-3 py-1.5 text-xs text-primary focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 font-mono"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {/* Difficulty Filter */}
                <div className="flex items-center gap-1 text-xs">
                  {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficultyFilter(diff)}
                      className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                        difficultyFilter === diff
                          ? 'bg-surface-elevated text-primary font-medium'
                          : 'text-secondary hover:bg-surface hover:text-primary'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
                
                <div className="w-px h-4 bg-surface-hover shrink-0" />

                {/* Status Filter */}
                <div className="flex items-center gap-1 text-xs">
                  {(['All', 'Not Started', 'In Progress', 'Solved'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                        statusFilter === st
                          ? 'bg-surface-elevated text-primary font-medium'
                          : 'text-secondary hover:bg-surface hover:text-primary'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Practice Problem Cards List */}
            {filteredProblems.length > 0 ? (
              <div className="flex flex-col">
                {filteredProblems.map((prob) => {
                  const linkedProgram = programs.find((p) => p.uuid === prob.programUuid) || null;

                  return (
                    <div
                      key={prob.uuid}
                      className="group flex flex-col gap-3 py-5 border-b border-subtle last:border-b-0"
                    >
                      {/* Top: Title, Meta, Status */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-[15px] font-semibold text-primary truncate leading-tight">
                              {prob.title}
                            </h3>
                            {renderDifficultyBadge(prob.difficulty)}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] font-medium text-secondary truncate">
                              {prob.topic}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center">
                          {/* Status Selector */}
                          <select
                            value={prob.status}
                            onChange={(e) =>
                              onUpdateProblem(prob.uuid, { status: e.target.value as PracticeStatus })
                            }
                            className={`bg-transparent hover:bg-surface-elevated border border-transparent hover:border-subtle rounded px-2 py-0.5 text-[11px] font-medium focus:outline-none cursor-pointer transition-colors ${
                              prob.status === 'Solved' ? 'text-emerald-500 dark:text-emerald-400' :
                              prob.status === 'In Progress' ? 'text-sky-500 dark:text-sky-400' :
                              'text-muted'
                            }`}
                          >
                            <option value="Not Started" className="text-primary bg-surface">Not Started</option>
                            <option value="In Progress" className="text-primary bg-surface">In Progress</option>
                            <option value="Solved" className="text-primary bg-surface">Solved</option>
                          </select>
                        </div>
                      </div>

                      {/* Description */}
                      {prob.description && (
                        <p className="text-[13px] leading-relaxed text-secondary line-clamp-2 max-w-3xl">
                          {prob.description}
                        </p>
                      )}

                      {/* Bottom: Linked Program & Actions */}
                      <div className="flex items-center justify-between mt-1 gap-4 flex-wrap sm:flex-nowrap">
                        
                        {/* Linked Program tag */}
                        <div className="text-[11px] min-w-0">
                          {linkedProgram ? (
                            <span className="flex items-center gap-1.5 font-mono text-primary min-w-0">
                              <span className="text-muted">▣</span>
                              <span className="truncate hover:underline cursor-default">{linkedProgram.name}</span>
                            </span>
                          ) : (
                            <span className="text-muted italic flex items-center gap-1">No program linked</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            onClick={() => setHistoryProblem(prob)}
                            className="text-[11px] font-medium text-secondary hover:text-primary transition-colors"
                          >
                            Attempts ({attempts.filter((a) => a.practiceProblemUuid === prob.uuid).length})
                          </button>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setProblemToEdit(prob);
                                setIsModalOpen(true);
                              }}
                              className="p-1 text-muted hover:text-primary transition-colors"
                              title="Edit problem"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setProblemToDelete(prob)}
                              className="p-1 text-muted hover:text-red-400 transition-colors"
                              title="Delete problem"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          {/* Primary Action */}
                          {linkedProgram ? (
                            <button
                              onClick={() => onOpenPracticeProgram(prob, linkedProgram.uuid)}
                              className="text-[12px] font-medium text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1"
                            >
                              <span>Open Practice</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setProblemToLink(prob);
                                setSelectedProgramToLink(programs.length > 0 ? programs[0].uuid : '');
                              }}
                              className="text-[12px] font-medium text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
                            >
                              <span>Start Practice</span>
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="py-24 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center text-muted mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                {problems.length === 0 ? (
                  <div>
                    <h3 className="text-base font-semibold text-primary">Your practice workspace is empty</h3>
                    <p className="text-xs text-secondary max-w-sm mx-auto mt-1">
                      Create a problem to start organizing your placement preparation and link your code.
                    </p>
                    <button
                      onClick={() => {
                        setProblemToEdit(null);
                        setIsModalOpen(true);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ New Problem</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base font-semibold text-primary">No matching problems found</h3>
                    <p className="text-xs text-secondary max-w-sm mx-auto mt-1">
                      Try adjusting your search query or filter selection.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <PracticeAnalytics
            problems={problems}
            attempts={attempts}
            onFilterByDifficulty={(diff) => {
              setDifficultyFilter(diff);
              setActiveTab('catalog');
            }}
            onFilterByTopic={(top) => {
              setSearchQuery(top);
              setActiveTab('catalog');
            }}
          />
        )}
      </div>

      {/* Practice Problem Modal */}
      <PracticeProblemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProblemToEdit(null);
        }}
        onSave={handleSaveProblem}
        problemToEdit={problemToEdit}
        programs={programs}
      />

      {/* Delete Confirmation Modal */}
      {problemToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setProblemToDelete(null);
          }}
        >
          <div
            className="bg-surface border border-subtle rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary">Delete Practice Problem</h3>
                <p className="text-xs text-secondary">Are you sure you want to delete "{problemToDelete.title}"?</p>
              </div>
            </div>

            <p className="text-xs text-secondary bg-surface-elevated p-2.5 rounded border border-subtle/50">
              Note: Deleting this practice problem will NOT delete any linked CodeSpace program.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setProblemToDelete(null)}
                className="px-3.5 py-1.5 bg-surface-elevated hover:bg-surface-hover text-secondary border border-default rounded text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold transition-colors"
              >
                Delete Problem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link / Create Program Modal for Unlinked Problem */}
      {problemToLink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setProblemToLink(null);
          }}
        >
          <div
            className="bg-surface border border-subtle rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-subtle">
              <h3 className="text-sm font-semibold text-primary">Start Practice: {problemToLink.title}</h3>
              <button
                onClick={() => setProblemToLink(null)}
                className="p-1 text-secondary hover:text-primary"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-secondary">
              Select an existing CodeSpace program to link to this problem, or create a brand new program.
            </p>

            {programs.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-secondary">Link Existing Program</label>
                <select
                  value={selectedProgramToLink}
                  onChange={(e) => setSelectedProgramToLink(e.target.value)}
                  className="w-full bg-canvas border border-subtle rounded px-3 py-2 text-xs font-mono text-primary"
                >
                  {programs.map((p) => (
                    <option key={p.uuid} value={p.uuid}>
                      {p.name} ({p.language})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleLinkExistingSubmit}
                  disabled={!selectedProgramToLink}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors"
                >
                  Link Selected Program & Open
                </button>
              </div>
            )}

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-subtle"></div>
              <span className="flex-shrink mx-2 text-[10px] text-muted uppercase font-mono">Or</span>
              <div className="flex-grow border-t border-subtle"></div>
            </div>

            <button
              onClick={async () => {
                const targetProb = problemToLink;
                setProblemToLink(null);
                await onCreateAndLinkProgram(targetProb);
              }}
              className="w-full py-2 bg-surface-elevated hover:bg-surface-hover text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Program for this Problem</span>
            </button>
          </div>
        </div>
      )}

      {/* Attempt History Modal */}
      <AttemptHistoryModal
        isOpen={historyProblem !== null}
        onClose={() => setHistoryProblem(null)}
        problem={historyProblem}
        attempts={
          historyProblem
            ? attempts.filter((a) => a.practiceProblemUuid === historyProblem.uuid)
            : []
        }
        onDeleteAttempt={onDeleteAttempt}
        onClearAllAttempts={onClearAllAttempts}
        onCompareWithCurrent={onCompareAttemptWithCurrent}
      />
    </div>
  );
};
