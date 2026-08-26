'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3 } from 'lucide-react';

interface RenameModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onRename: (newName: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  currentName,
  onClose,
  onRename
}) => {
  const [name, setName] = useState(currentName);

  React.useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onRename(name.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-modal-title"
        className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#0d1117]/50">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <Edit3 className="w-4 h-4 text-blue-400" aria-hidden="true" />
            <span id="rename-modal-title">Rename Program</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal dialog"
            className="text-gray-400 hover:text-gray-200 hover:bg-[#21262d] p-1 rounded transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="rename-program-input" className="block text-xs font-medium text-gray-400 mb-1">
              New File Name
            </label>
            <input
              id="rename-program-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#30363d]/60">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded shadow-sm transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
            >
              Save Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
