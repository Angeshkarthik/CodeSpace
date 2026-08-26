'use client';

import React from 'react';
import { X, Settings as SettingsIcon, Database, ShieldAlert } from 'lucide-react';
import { AppSettings } from '@/types';
import { db } from '@/lib/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetDatabase: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetDatabase
}) => {
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
        aria-labelledby="settings-modal-title"
        className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#0d1117]/50">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <SettingsIcon className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span id="settings-modal-title">Workspace Settings</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal dialog"
            className="text-gray-400 hover:text-gray-200 hover:bg-[#21262d] p-1 rounded transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-5 text-xs text-gray-300">
          {/* Editor Font Size */}
          <div className="border-t border-[#30363d]/60 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-300">
                Editor Font Size
              </span>
              <span className="font-mono text-gray-400">{settings.fontSize}px</span>
            </div>
            <div className="flex gap-2" role="radiogroup" aria-label="Editor font size">
              {[12, 14, 16, 18].map((size) => (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={settings.fontSize === size}
                  onClick={() => onUpdateSettings({ fontSize: size })}
                  className={`flex-1 py-1.5 rounded border text-xs font-mono transition-all focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50 ${
                    settings.fontSize === size
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                      : 'border-[#30363d] bg-[#0d1117] text-gray-400 hover:bg-[#21262d]'
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>

          {/* Tab Size */}
          <div className="border-t border-[#30363d]/60 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-300">
                Tab Indent Size
              </span>
              <span className="font-mono text-gray-400">{settings.tabSize} spaces</span>
            </div>
            <div className="flex gap-2" role="radiogroup" aria-label="Tab indent size">
              {[2, 4].map((spaces) => (
                <button
                  key={spaces}
                  type="button"
                  role="radio"
                  aria-checked={settings.tabSize === spaces}
                  onClick={() => onUpdateSettings({ tabSize: spaces })}
                  className={`flex-1 py-1.5 rounded border text-xs font-mono transition-all focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50 ${
                    settings.tabSize === spaces
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                      : 'border-[#30363d] bg-[#0d1117] text-gray-400 hover:bg-[#21262d]'
                  }`}
                >
                  {spaces} Spaces
                </button>
              ))}
            </div>
          </div>

          {/* Local IndexedDB Management */}
          <div className="border-t border-[#30363d]/60 pt-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
                <Database className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span>IndexedDB Storage</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">
              All programs are stored locally in your browser&apos;s IndexedDB database (`CodeSpaceDB`).
            </p>
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset IndexedDB to default starter programs? Custom programs will be cleared.')) {
                  onResetDatabase();
                  onClose();
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-800/50 text-red-400 rounded text-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
            >
              <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset Local Database</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#30363d] bg-[#0d1117]/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500/50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
