'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SaveVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultVersionNumber: number;
  onSave: (label: string) => Promise<{ success: boolean; message?: string; isDuplicate?: boolean }>;
}

export const SaveVersionModal: React.FC<SaveVersionModalProps> = ({
  isOpen,
  onClose,
  defaultVersionNumber,
  onSave,
}) => {
  const [label, setLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setLabel(`Version ${defaultVersionNumber}`);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, defaultVersionNumber]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await onSave(label);
      if (res.success) {
        onClose();
      } else {
        setError(res.message || 'Failed to save version.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Save error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-version-modal-title"
        className="flex flex-col w-full max-w-md bg-canvas border border-default rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-default bg-surface">
          <div className="flex items-center gap-2">
            <Save className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <h2 id="save-version-modal-title" className="text-sm font-semibold text-primary">Save Program Version</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal dialog"
            className="p-1 rounded hover:bg-surface-hover text-secondary hover:text-primary transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="save-version-label-input" className="text-xs font-medium text-secondary">
              Version Label <span className="text-muted font-normal">(Optional)</span>
            </label>
            <input
              id="save-version-label-input"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`Version ${defaultVersionNumber}`}
              className="w-full px-3 py-2 bg-surface border border-default rounded text-xs text-primary focus:outline-hidden focus:border-blue-500 font-mono"
              autoFocus
            />
            <p className="text-[11px] text-muted">
              Give this checkpoint a descriptive name (e.g. "Brute Force", "HashMap Optimization").
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700/30 rounded text-xs text-red-300 font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-surface-elevated hover:bg-surface-hover text-secondary rounded text-xs font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500/50"
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isSubmitting ? 'Saving...' : 'Save Checkpoint'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
