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
    <header className="h-12 bg-surface border-b border-default flex items-center justify-between px-3 text-xs select-none z-20">
      {/* Left: Logo & Navigation Tabs */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 font-bold tracking-wide text-primary shrink-0">
          <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">CodeSpace</span>
        </div>

        <div className="h-4 w-[1px] bg-surface-hover mx-1 shrink-0" />

        {/* Workspace View Switcher Tabs */}
        <div role="tablist" aria-label="Workspace views" className="flex items-center gap-1 text-xs shrink-0 h-full pt-1">
          <button
            role="tab"
            aria-selected={activeView === 'editor'}
            onClick={() => onViewChange('editor')}
            aria-label="Switch to Workspace Editor"
            className={`flex items-center justify-center gap-1.5 px-3 h-full border-b-[3px] text-xs transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50 ${
              activeView === 'editor'
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-500 font-semibold'
                : 'border-transparent text-secondary hover:text-primary hover:border-subtle'
            }`}
          >
            <span>Editor</span>
          </button>
          <button
            role="tab"
            aria-selected={activeView === 'practice'}
            onClick={() => onViewChange('practice')}
            aria-label="Switch to Practice Workspace"
            className={`flex items-center justify-center gap-1.5 px-3 h-full border-b-[3px] text-xs transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50 ${
              activeView === 'practice'
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-500 font-semibold'
                : 'border-transparent text-secondary hover:text-primary hover:border-subtle'
            }`}
          >
            <span>Practice</span>
          </button>
        </div>

        <div className="h-4 w-[1px] bg-surface-hover mx-1 shrink-0" />

        {/* Practice Problem Context Banner or Program Name */}
        {activeView === 'editor' && activePracticeProblem ? (
          <div className="flex items-center gap-2 bg-blue-950/30 border border-blue-800/40 rounded px-2.5 py-0.5 text-xs text-blue-300 min-w-0 max-w-[240px] sm:max-w-[360px]">
            <span className="font-semibold truncate" title={activePracticeProblem.title}>{activePracticeProblem.title}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-900/50 border border-blue-700/50 font-mono shrink-0">
              {activePracticeProblem.topic}
            </span>
            <button
              onClick={() => onViewChange('practice')}
              className="ml-1 text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50 rounded px-1 shrink-0"
            >
              <ArrowLeft className="w-3 h-3" aria-hidden="true" /> Back to Practice
            </button>
          </div>
        ) : activeView === 'editor' && currentProgram ? (
          <div className="flex items-center gap-1.5 bg-canvas border border-default rounded px-2.5 py-1 min-w-0 max-w-[200px] sm:max-w-[320px]">
            <span className="text-[11px] font-mono text-secondary shrink-0">File:</span>
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
                  className="bg-surface text-xs font-mono text-blue-400 border border-blue-500 rounded px-1 py-0.5 outline-none w-36 focus-visible:ring-1 focus-visible:ring-blue-500/50"
                />
                <button
                  onClick={handleNameSubmit}
                  aria-label="Confirm program rename"
                  className="text-blue-500 hover:text-blue-400 p-0.5 rounded focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50 shrink-0"
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
                className="flex items-center gap-1.5 text-xs font-mono font-medium text-primary hover:text-blue-500 group transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50 rounded px-1 min-w-0"
                title={`Click to rename program: ${currentProgram.name}`}
              >
                <span className="truncate max-w-[150px] sm:max-w-[260px]">{currentProgram.name}</span>
                <Edit2 className="w-3 h-3 text-muted group-hover:text-blue-500 transition-colors shrink-0" aria-hidden="true" />
              </button>
            )}
          </div>
        ) : activeView === 'editor' ? (
          <span className="text-xs text-muted italic shrink-0">No program selected</span>
        ) : null}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Language Selector */}
        {currentProgram && (
          <div className="relative flex items-center">
            <label htmlFor="topbar-lang-select" className="text-[11px] font-medium text-secondary mr-1.5 hidden sm:inline">
              Lang:
            </label>
            <div className="relative">
              <select
                key={currentProgram.language}
                id="topbar-lang-select"
                aria-label="Target programming language"
                value={currentProgram.language}
                onChange={(e) => onLanguageChange(e.target.value as LanguageType)}
                className="appearance-none bg-canvas border border-default hover:border-active text-blue-500 text-xs font-mono rounded pl-2.5 pr-7 py-1 focus:outline-none focus:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/50 cursor-pointer transition-colors"
              >
                {(Object.keys(STARTER_TEMPLATES) as LanguageType[]).map((lang) => (
                  <option key={lang} value={lang} className="bg-surface text-primary font-mono">
                    {STARTER_TEMPLATES[lang].name} ({STARTER_TEMPLATES[lang].extension})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-secondary absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            </div>
          </div>
        )}

        {/* Settings Icon */}
        <button
          onClick={onOpenSettings}
          aria-label="Workspace Settings"
          className="p-1.5 text-secondary hover:text-primary hover:bg-surface-elevated rounded transition-colors border border-transparent hover:border-default focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50"
          title="Workspace Settings"
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
