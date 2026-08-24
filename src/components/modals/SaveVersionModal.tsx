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

  useEffect(() => {
    if (isOpen) {
      setLabel(`Version ${defaultVersionNumber}`);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, defaultVersionNumber]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="flex flex-col w-full max-w-md bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden pointer-events-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-2">
            <Save className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-gray-100">Save Program Version</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#30363d] text-gray-400 hover:text-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">
              Version Label <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`Version ${defaultVersionNumber}`}
              className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded text-xs text-gray-200 focus:outline-hidden focus:border-emerald-500 font-mono"
              autoFocus
            />
            <p className="text-[11px] text-gray-500">
              Give this checkpoint a descriptive name (e.g. "Brute Force", "HashMap Optimization").
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700/30 rounded text-xs text-red-300 font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#21262d]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Checkpoint'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
