'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Code, FileText, Tag, BarChart2 } from 'lucide-react';
import { Program } from '@/types';
import { PracticeProblem, PracticeDifficulty, PracticeStatus } from '@/lib/practice/types';

interface PracticeProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    topic: string;
    difficulty: PracticeDifficulty;
    description: string;
    status: PracticeStatus;
    programUuid: string | null;
  }) => Promise<void>;
  problemToEdit?: PracticeProblem | null;
  programs: Program[];
}

export const PracticeProblemModal: React.FC<PracticeProblemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  problemToEdit = null,
  programs,
}) => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>('Easy');
  const [status, setStatus] = useState<PracticeStatus>('Not Started');
  const [description, setDescription] = useState('');
  const [programUuid, setProgramUuid] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (problemToEdit) {
      setTitle(problemToEdit.title);
      setTopic(problemToEdit.topic);
      setDifficulty(problemToEdit.difficulty);
      setStatus(problemToEdit.status);
      setDescription(problemToEdit.description ?? '');
      setProgramUuid(problemToEdit.programUuid ?? '');
    } else {
      setTitle('');
      setTopic('');
      setDifficulty('Easy');
      setStatus('Not Started');
      setDescription('');
      setProgramUuid('');
    }
    setError(null);
  }, [problemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Problem title is required.');
      return;
    }
    if (!topic.trim()) {
      setError('Problem topic is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        title: title.trim(),
        topic: topic.trim(),
        difficulty,
        description: description.trim(),
        status,
        programUuid: programUuid.trim() ? programUuid.trim() : null,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to save practice problem: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d] bg-[#0d1117]/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-100">
                {problemToEdit ? 'Edit Practice Problem' : 'Create Practice Problem'}
              </h2>
              <p className="text-xs text-gray-400">
                {problemToEdit ? 'Update problem metadata and linked program' : 'Add a new DSA or placement practice problem'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#21262d] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="problem-title" className="block font-medium text-gray-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" /> Title <span className="text-red-400">*</span>
            </label>
            <input
              id="problem-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Two Sum, Reverse Linked List"
              required
              className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Topic & Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="problem-topic" className="block font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-sky-400" /> Topic / Category <span className="text-red-400">*</span>
              </label>
              <input
                id="problem-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Arrays, Trees, DP"
                required
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>

            <div>
              <label htmlFor="problem-difficulty" className="block font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-amber-400" /> Difficulty <span className="text-red-400">*</span>
              </label>
              <select
                id="problem-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as PracticeDifficulty)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Status & Linked Program */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="problem-status" className="block font-medium text-gray-300 mb-1">
                Practice Status
              </label>
              <select
                id="problem-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as PracticeStatus)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Solved">Solved</option>
              </select>
            </div>

            <div>
              <label htmlFor="problem-program" className="block font-medium text-gray-300 mb-1">
                Linked Program (Optional)
              </label>
              <select
                id="problem-program"
                value={programUuid}
                onChange={(e) => setProgramUuid(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-emerald-500 text-xs cursor-pointer font-mono"
              >
                <option value="">-- No Linked Program --</option>
                {programs.map((p) => (
                  <option key={p.uuid} value={p.uuid}>
                    {p.name} ({p.language})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="problem-desc" className="block font-medium text-gray-300 mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              id="problem-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add problem statement, constraints, or key DSA takeaways..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-emerald-500 text-xs font-mono"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#30363d]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 border border-[#30363d] rounded text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{problemToEdit ? 'Save Changes' : 'Create Problem'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
