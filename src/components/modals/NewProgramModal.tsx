'use client';

import React, { useState } from 'react';
import { X, Code2, Plus } from 'lucide-react';
import { LanguageType } from '@/types';
import { STARTER_TEMPLATES } from '@/lib/constants';

interface NewProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, language: LanguageType) => void;
}

export const NewProgramModal: React.FC<NewProgramModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [name, setName] = useState('untitled.py');
  const [language, setLanguage] = useState<LanguageType>('python');

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

  const handleLanguageChange = (lang: LanguageType) => {
    setLanguage(lang);
    const ext = STARTER_TEMPLATES[lang].extension;
    const baseName = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : name;
    setName(`${baseName || 'untitled'}${ext}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), language);
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
        aria-labelledby="new-program-modal-title"
        className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#0d1117]/50">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <Plus className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span id="new-program-modal-title">Create New Program</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal dialog"
            className="text-gray-400 hover:text-gray-200 hover:bg-[#21262d] p-1 rounded transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Language Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Select Language
            </label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Select language">
              {(Object.keys(STARTER_TEMPLATES) as LanguageType[]).map((lang) => {
                const isSelected = language === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleLanguageChange(lang)}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-mono border transition-all text-left focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                        : 'border-[#30363d] bg-[#0d1117] text-gray-300 hover:bg-[#21262d]'
                    }`}
                  >
                    <Code2 className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-gray-400'}`} aria-hidden="true" />
                    <span>{STARTER_TEMPLATES[lang].name}</span>
                    <span className="ml-auto text-[10px] text-gray-500">{STARTER_TEMPLATES[lang].extension}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Program Name */}
          <div>
            <label htmlFor="new-program-name-input" className="block text-xs font-medium text-gray-400 mb-1">
              Program File Name
            </label>
            <input
              id="new-program-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. main.py"
              autoFocus
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded text-xs font-mono text-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Action buttons */}
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
              className="px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow-sm transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
            >
              Create Program
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
