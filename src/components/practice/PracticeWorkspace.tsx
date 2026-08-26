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
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Easy
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Medium
          </span>
        );
      case 'Hard':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/30">
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
          <span className="flex items-center gap-1 text-gray-400 font-medium text-xs">
            <Circle className="w-3.5 h-3.5" /> Not Started
          </span>
        );
    }
  };

  return (
    <div className="flex-1 bg-[#0d1117] text-gray-200 overflow-y-auto p-6 select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-400" />
              <h1 className="text-xl font-bold tracking-tight text-gray-100">Practice Workspace</h1>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Personal DSA & Placement Practice Organization — link problems directly to CodeSpace programs.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded-lg p-1 text-xs">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'catalog'
                    ? 'bg-[#21262d] text-emerald-400 font-semibold shadow-xs'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Catalog</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-[#21262d] text-cyan-400 font-semibold shadow-xs'
                    : 'text-gray-400 hover:text-gray-200'
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
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Problem</span>
              </button>
            )}
          </div>
        </div>

        {activeTab === 'catalog' ? (
          <>
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#161b22] border border-[#30363d] p-3 rounded-xl">
              {/* Client Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search problems by title or topic..."
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {/* Difficulty Filter */}
                <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg p-1 text-xs">
                  {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficultyFilter(diff)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${
                        difficultyFilter === diff
                          ? 'bg-[#21262d] text-emerald-400 font-semibold shadow-xs'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg p-1 text-xs">
                  {(['All', 'Not Started', 'In Progress', 'Solved'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${
                        statusFilter === st
                          ? 'bg-[#21262d] text-emerald-400 font-semibold shadow-xs'
                          : 'text-gray-400 hover:text-gray-200'
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProblems.map((prob) => {
                  const linkedProgram = programs.find((p) => p.uuid === prob.programUuid) || null;

                  return (
                    <div
                      key={prob.uuid}
                      className="bg-[#161b22] border border-[#30363d] hover:border-gray-600 rounded-xl p-4 flex flex-col justify-between transition-all group shadow-xs"
                    >
                      <div>
                        {/* Header Row: Title & Badges */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold text-gray-100 group-hover:text-emerald-400 transition-colors break-words">
                              {prob.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="flex items-center gap-1 text-[11px] text-gray-400 min-w-0 truncate">
                                <Tag className="w-3 h-3 text-sky-400 shrink-0" />
                                <span className="truncate">{prob.topic}</span>
                              </span>
                              {renderDifficultyBadge(prob.difficulty)}
                            </div>
                          </div>

                          {/* Status Dropdown Trigger */}
                          <div className="relative shrink-0">
                            <select
                              value={prob.status}
                              onChange={(e) =>
                                onUpdateProblem(prob.uuid, { status: e.target.value as PracticeStatus })
                              }
                              className="bg-[#0d1117] border border-[#30363d] text-gray-300 hover:border-gray-500 rounded px-2 py-1 text-xs focus:outline-none cursor-pointer"
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Solved">Solved</option>
                            </select>
                          </div>
                        </div>

                        {/* Description Excerpt */}
                        {prob.description && (
                          <p className="text-xs text-gray-400 line-clamp-2 mb-3 bg-[#0d1117]/60 p-2 rounded border border-[#30363d]/50 font-sans break-words">
                            {prob.description}
                          </p>
                        )}
                      </div>

                      {/* Footer Row: Linked Program Info & Action Buttons */}
                      <div className="pt-3 border-t border-[#30363d]/70 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                        {/* Linked Program Tag */}
                        <div className="text-[11px] text-gray-400 truncate min-w-0 flex-1">
                          {linkedProgram ? (
                            <span className="flex items-center gap-1 font-mono text-emerald-400 min-w-0">
                              <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">{linkedProgram.name}</span>
                            </span>
                          ) : (
                            <span className="text-gray-500 italic">No program linked</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
                          {/* Attempts Button */}
                          <button
                            onClick={() => setHistoryProblem(prob)}
                            className="flex items-center gap-1 px-2 py-1 bg-[#0d1117] hover:bg-[#21262d] text-gray-300 border border-[#30363d] rounded text-xs font-mono transition-colors"
                            title="View Attempt History"
                            aria-label="View Attempt History"
                          >
                            <Layers className="w-3.5 h-3.5 text-sky-400" />
                            <span>Attempts ({attempts.filter((a) => a.practiceProblemUuid === prob.uuid).length})</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setProblemToEdit(prob);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#21262d] rounded transition-colors"
                            title="Edit practice problem"
                            aria-label="Edit problem"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setProblemToDelete(prob)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                            title="Delete practice problem"
                            aria-label="Delete problem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Primary Open/Start Practice Action */}
                          {linkedProgram ? (
                            <button
                              onClick={() => onOpenPracticeProgram(prob, linkedProgram.uuid)}
                              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            >
                              <span>Open Practice</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setProblemToLink(prob);
                                setSelectedProgramToLink(programs.length > 0 ? programs[0].uuid : '');
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] rounded text-xs font-medium cursor-pointer transition-colors"
                            >
                              <span>Start Practice</span>
                              <Plus className="w-3 h-3 text-emerald-400" />
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
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                {problems.length === 0 ? (
                  <div>
                    <h3 className="text-base font-semibold text-gray-200">Your practice workspace is empty</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                      Create a problem to start organizing your placement preparation and link your code.
                    </p>
                    <button
                      onClick={() => {
                        setProblemToEdit(null);
                        setIsModalOpen(true);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ New Problem</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base font-semibold text-gray-200">No matching problems found</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
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
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-100">Delete Practice Problem</h3>
                <p className="text-xs text-gray-400">Are you sure you want to delete "{problemToDelete.title}"?</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 bg-[#0d1117] p-2.5 rounded border border-[#30363d]">
              Note: Deleting this practice problem will NOT delete any linked CodeSpace program.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setProblemToDelete(null)}
                className="px-3.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 border border-[#30363d] rounded text-xs transition-colors"
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
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
              <h3 className="text-sm font-semibold text-gray-100">Start Practice: {problemToLink.title}</h3>
              <button
                onClick={() => setProblemToLink(null)}
                className="p-1 text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Select an existing CodeSpace program to link to this problem, or create a brand new program.
            </p>

            {programs.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-300">Link Existing Program</label>
                <select
                  value={selectedProgramToLink}
                  onChange={(e) => setSelectedProgramToLink(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-xs font-mono text-gray-200"
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
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors"
                >
                  Link Selected Program & Open
                </button>
              </div>
            )}

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#30363d]"></div>
              <span className="flex-shrink mx-2 text-[10px] text-gray-500 uppercase font-mono">Or</span>
              <div className="flex-grow border-t border-[#30363d]"></div>
            </div>

            <button
              onClick={async () => {
                const targetProb = problemToLink;
                setProblemToLink(null);
                await onCreateAndLinkProgram(targetProb);
              }}
              className="w-full py-2 bg-[#21262d] hover:bg-[#30363d] text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5"
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
