'use client';

import React from 'react';
import {
  FolderOpen,
  Plus,
  FileCode2,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Code
} from 'lucide-react';
import { Program, LanguageType } from '@/types';
import { STARTER_TEMPLATES } from '@/lib/constants';

interface SidebarProps {
  programs: Program[];
  activeUuid: string | null;
  onSelectProgram: (uuid: string) => void;
  onOpenNewModal: () => void;
  onOpenRenameModal: (program: Program) => void;
  onDeleteProgram: (uuid: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  programs,
  activeUuid,
  onSelectProgram,
  onOpenNewModal,
  onOpenRenameModal,
  onDeleteProgram,
  isCollapsed,
  onToggleCollapse
}) => {
  const [progToDelete, setProgToDelete] = React.useState<Program | null>(null);

  const getLanguageBadge = (lang: LanguageType) => {
    switch (lang) {
      case 'c':
        return <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 border border-blue-800/40 px-1 py-0.2 rounded font-mono">C</span>;
      case 'cpp':
        return <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-1 py-0.2 rounded font-mono">C++</span>;
      case 'python':
        return <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-1 py-0.2 rounded font-mono">PY</span>;
      case 'java':
        return <span className="text-[10px] font-bold text-orange-400 bg-orange-950/60 border border-orange-800/40 px-1 py-0.2 rounded font-mono">JV</span>;
      default:
        return <Code className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <>
      <aside
        className={`bg-[#161b22] border-r border-[#30363d] flex flex-col transition-all duration-200 select-none z-10 ${
          isCollapsed ? 'w-12' : 'w-60'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-10 px-3 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]/30">
          {!isCollapsed && (
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
              <FolderOpen className="w-4 h-4 text-emerald-400" />
              <span>Programs</span>
              <span className="text-[10px] text-gray-500 font-mono">({programs.length})</span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className={`p-1 text-gray-400 hover:text-gray-200 hover:bg-[#21262d] rounded transition-colors ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* New Program Button */}
        <div className="p-2 border-b border-[#30363d]/60">
          <button
            onClick={onOpenNewModal}
            className={`w-full flex items-center justify-center gap-2 bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] rounded text-xs font-medium py-1.5 transition-colors ${
              isCollapsed ? 'px-1' : 'px-3'
            }`}
            title="New Program"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            {!isCollapsed && <span>New Program</span>}
          </button>
        </div>

        {/* Program List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {programs.length === 0 ? (
            !isCollapsed && (
              <div className="p-4 text-center text-xs text-gray-500 italic">
                No programs created yet.
              </div>
            )
          ) : (
            programs.map((prog) => {
              const isActive = prog.uuid === activeUuid;

              if (isCollapsed) {
                return (
                  <button
                    key={prog.uuid}
                    onClick={() => onSelectProgram(prog.uuid)}
                    className={`w-full py-2 flex justify-center rounded transition-colors ${
                      isActive ? 'bg-[#282e38] text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:bg-[#21262d]'
                    }`}
                    title={`${prog.name} (${STARTER_TEMPLATES[prog.language]?.name || prog.language})`}
                  >
                    {getLanguageBadge(prog.language)}
                  </button>
                );
              }

              return (
                <div
                  key={prog.uuid}
                  onClick={() => onSelectProgram(prog.uuid)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors border ${
                    isActive
                      ? 'bg-[#282e38] border-emerald-500/40 text-emerald-300 font-medium'
                      : 'border-transparent text-gray-300 hover:bg-[#21262d] hover:text-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getLanguageBadge(prog.language)}
                    <span className="truncate font-mono text-[12px]">{prog.name}</span>
                  </div>

                  {/* Hover action icons */}
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRenameModal(prog);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-400 hover:bg-[#30363d] rounded transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProgToDelete(prog);
                      }}
                      className="p-1 text-gray-400 hover:text-red-400 hover:bg-[#30363d] rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer info */}
        {!isCollapsed && (
          <div className="p-2 border-t border-[#30363d] text-[11px] text-gray-500 flex justify-between items-center bg-[#0d1117]/30">
            <span>Dexie IndexedDB</span>
            <span className="text-emerald-500 font-mono">Local</span>
          </div>
        )}
      </aside>

      {/* Delete Program Confirmation Modal */}
      {progToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
              <Trash2 className="w-4 h-4" />
              <span>Delete Program?</span>
            </div>
            <p className="text-xs text-gray-300">
              Are you sure you want to delete <span className="font-mono text-white font-semibold">"{progToDelete.name}"</span>? This will permanently remove its test cases and saved versions.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setProgToDelete(null)}
                className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteProgram(progToDelete.uuid);
                  setProgToDelete(null);
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
