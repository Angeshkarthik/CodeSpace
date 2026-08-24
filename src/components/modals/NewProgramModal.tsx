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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#0d1117]/50">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Create New Program</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 hover:bg-[#21262d] p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Language Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Select Language
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(STARTER_TEMPLATES) as LanguageType[]).map((lang) => {
                const isSelected = language === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageChange(lang)}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-mono border transition-all text-left ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                        : 'border-[#30363d] bg-[#0d1117] text-gray-300 hover:bg-[#21262d]'
                    }`}
                  >
                    <Code2 className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-gray-400'}`} />
                    <span>{STARTER_TEMPLATES[lang].name}</span>
                    <span className="ml-auto text-[10px] text-gray-500">{STARTER_TEMPLATES[lang].extension}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Program Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Program File Name
            </label>
            <input
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
              className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-[#21262d] rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded shadow-sm transition-colors"
            >
              Create Program
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
