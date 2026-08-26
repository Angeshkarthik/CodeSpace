'use client';

import React, { useState } from 'react';
import { Terminal, Settings, ChevronDown, Edit2, Check, BookOpen, Code2, ArrowLeft } from 'lucide-react';
import { LanguageType, Program, AppSettings } from '@/types';
import { PracticeProblem } from '@/lib/practice/types';
import { STARTER_TEMPLATES } from '@/lib/constants';

interface TopBarProps {
  currentProgram: Program | null;
  onLanguageChange: (lang: LanguageType) => void;
  onProgramRename: (newName: string) => void;
  settings: AppSettings;
  onOpenSettings: () => void;
  activeView: 'editor' | 'practice';
  onViewChange: (view: 'editor' | 'practice') => void;
  activePracticeProblem?: PracticeProblem | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentProgram,
  onLanguageChange,
  onProgramRename,
  settings,
  onOpenSettings,
  activeView,
  onViewChange,
  activePracticeProblem,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentProgram?.name || '');

  const handleNameSubmit = () => {
    if (editedName.trim() && currentProgram && editedName.trim() !== currentProgram.name) {
      onProgramRename(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditedName(currentProgram?.name || '');
      setIsEditingName(false);
    }
  };

  return (
    <header className="h-12 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-3 text-xs select-none z-20">
      {/* Left: Logo & Navigation Tabs */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 font-bold tracking-wide text-gray-100 shrink-0">
          <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">CodeSpace</span>
        </div>

        <div className="h-4 w-[1px] bg-[#30363d] mx-1 shrink-0" />

        {/* Workspace View Switcher Tabs */}
        <div role="tablist" aria-label="Workspace views" className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg p-0.5 text-xs shrink-0">
          <button
            role="tab"
            aria-selected={activeView === 'editor'}
            onClick={() => onViewChange('editor')}
            aria-label="Switch to Workspace Editor"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50 ${
              activeView === 'editor'
                ? 'bg-[#21262d] text-emerald-400 font-semibold shadow-xs'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Editor</span>
          </button>
          <button
            role="tab"
            aria-selected={activeView === 'practice'}
            onClick={() => onViewChange('practice')}
            aria-label="Switch to Practice Workspace"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50 ${
              activeView === 'practice'
                ? 'bg-[#21262d] text-emerald-400 font-semibold shadow-xs'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Practice</span>
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[#30363d] mx-1 shrink-0" />

        {/* Practice Problem Context Banner or Program Name */}
        {activeView === 'editor' && activePracticeProblem ? (
          <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-800/40 rounded px-2.5 py-0.5 text-xs text-emerald-300 min-w-0 max-w-[240px] sm:max-w-[360px]">
            <span className="font-semibold truncate" title={activePracticeProblem.title}>{activePracticeProblem.title}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/50 border border-emerald-700/50 font-mono shrink-0">
              {activePracticeProblem.topic}
            </span>
            <button
              onClick={() => onViewChange('practice')}
              className="ml-1 text-[11px] text-emerald-400 hover:text-emerald-200 flex items-center gap-1 hover:underline cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50 rounded px-1 shrink-0"
            >
              <ArrowLeft className="w-3 h-3" aria-hidden="true" /> Back to Practice
            </button>
          </div>
        ) : activeView === 'editor' && currentProgram ? (
          <div className="flex items-center gap-1.5 bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1 min-w-0 max-w-[200px] sm:max-w-[320px]">
            <span className="text-[11px] font-mono text-gray-400 shrink-0">File:</span>
            {isEditingName ? (
              <div className="flex items-center gap-1 min-w-0">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleNameSubmit}
                  aria-label="Edit program name"
                  autoFocus
                  className="bg-[#161b22] text-xs font-mono text-emerald-300 border border-emerald-500 rounded px-1 py-0.5 outline-none w-36 focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                />
                <button
                  onClick={handleNameSubmit}
                  aria-label="Confirm program rename"
                  className="text-emerald-400 hover:text-emerald-300 p-0.5 rounded focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50 shrink-0"
                >
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditedName(currentProgram.name);
                  setIsEditingName(true);
                }}
                aria-label={`Rename program ${currentProgram.name}`}
                className="flex items-center gap-1.5 text-xs font-mono font-medium text-gray-200 hover:text-emerald-400 group transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50 rounded px-1 min-w-0"
                title={`Click to rename program: ${currentProgram.name}`}
              >
                <span className="truncate max-w-[150px] sm:max-w-[260px]">{currentProgram.name}</span>
                <Edit2 className="w-3 h-3 text-gray-500 group-hover:text-emerald-400 transition-colors shrink-0" aria-hidden="true" />
              </button>
            )}
          </div>
        ) : activeView === 'editor' ? (
          <span className="text-xs text-gray-500 italic shrink-0">No program selected</span>
        ) : null}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Language Selector */}
        {currentProgram && (
          <div className="relative flex items-center">
            <label htmlFor="topbar-lang-select" className="text-[11px] font-medium text-gray-400 mr-1.5 hidden sm:inline">
              Lang:
            </label>
            <div className="relative">
              <select
                key={currentProgram.language}
                id="topbar-lang-select"
                aria-label="Target programming language"
                value={currentProgram.language}
                onChange={(e) => onLanguageChange(e.target.value as LanguageType)}
                className="appearance-none bg-[#0d1117] border border-[#30363d] hover:border-gray-600 text-emerald-400 text-xs font-mono rounded pl-2.5 pr-7 py-1 focus:outline-none focus:border-emerald-500 focus-visible:ring-1 focus-visible:ring-emerald-500/50 cursor-pointer transition-colors"
              >
                {(Object.keys(STARTER_TEMPLATES) as LanguageType[]).map((lang) => (
                  <option key={lang} value={lang} className="bg-[#161b22] text-gray-200 font-mono">
                    {STARTER_TEMPLATES[lang].name} ({STARTER_TEMPLATES[lang].extension})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            </div>
          </div>
        )}

        {/* Settings Icon */}
        <button
          onClick={onOpenSettings}
          aria-label="Workspace Settings"
          className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#21262d] rounded transition-colors border border-transparent hover:border-[#30363d] focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
          title="Workspace Settings"
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
