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

  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onRename(name.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#0d1117]/50">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <Edit3 className="w-4 h-4 text-blue-400" />
            <span>Rename Program</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 hover:bg-[#21262d] p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              New File Name
            </label>
            <input
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
              className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-[#21262d] rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded shadow-sm transition-colors"
            >
              Save Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
