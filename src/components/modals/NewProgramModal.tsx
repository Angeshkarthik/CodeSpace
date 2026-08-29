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
        className="bg-surface border border-default rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-default bg-canvas/50">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Plus className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span id="new-program-modal-title">Create New Program</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal dialog"
            className="text-secondary hover:text-primary hover:bg-surface-elevated p-1 rounded transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Language Selection */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-2">
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
                    className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-mono border transition-all text-left focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                        : 'border-default bg-canvas text-secondary hover:bg-surface-elevated'
                    }`}
                  >
                    <Code2 className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-secondary'}`} aria-hidden="true" />
                    <span>{STARTER_TEMPLATES[lang].name}</span>
                    <span className="ml-auto text-[10px] text-muted">{STARTER_TEMPLATES[lang].extension}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Program Name */}
          <div>
            <label htmlFor="new-program-name-input" className="block text-xs font-medium text-secondary mb-1">
              Program File Name
            </label>
            <input
              id="new-program-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. main.py"
              autoFocus
              className="w-full px-3 py-2 bg-canvas border border-default rounded text-xs font-mono text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-default/60">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-surface-elevated hover:bg-surface-hover text-secondary rounded text-xs font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded shadow-sm transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50"
            >
              Create Program
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
