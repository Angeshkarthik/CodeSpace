'use client';

import React, { useRef, useEffect, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { LanguageType, AppSettings } from '@/types';
import { MONACO_LANG_MAP } from '@/lib/constants';

interface MonacoEditorWrapperProps {
  code: string;
  language: LanguageType;
  onChange: (value: string) => void;
  onSave?: () => void;
  settings?: AppSettings;
  readOnly?: boolean;
  /** When set, highlight this 1-based source line for trace. Null clears decoration. */
  traceLine?: number | null;
}

export const MonacoEditorWrapper: React.FC<MonacoEditorWrapperProps> = ({
  code,
  language,
  onChange,
  onSave = () => {},
  settings = { key: 'app_settings', theme: 'vs-dark', fontSize: 14, tabSize: 4, autoSave: true, mode: 'offline' },
  readOnly = false,
  traceLine = null,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const traceDecorationsRef = useRef<string[]>([]);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom dark theme matching CodeSpace IDE UI
    monaco.editor.defineTheme('codespace-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72', fontStyle: 'bold' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657' },
        { token: 'function', foreground: 'd2a8ff' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b22',
        'editorCursor.foreground': '#58a6ff',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#c9d1d9',
        'editorIndentGuide.background': '#21262d',
        'editorIndentGuide.activeBackground': '#30363d',
      }
    });

    // Define custom light theme matching Phase 5B semantic palette
    monaco.editor.defineTheme('codespace-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6e7781', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'cf222e', fontStyle: 'bold' },
        { token: 'string', foreground: '0a3069' },
        { token: 'number', foreground: '0550ae' },
        { token: 'type', foreground: '953800' },
        { token: 'function', foreground: '8250df' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#1c2128',
        'editor.lineHighlightBackground': '#f6f8fa',
        'editorCursor.foreground': '#0969da',
        'editorLineNumber.foreground': '#8c959f',
        'editorLineNumber.activeForeground': '#1c2128',
        'editorIndentGuide.background': '#d0d7de',
        'editorIndentGuide.activeBackground': '#afb8c1',
      }
    });

    monaco.editor.setTheme(resolvedTheme === 'light' ? 'codespace-light' : 'codespace-dark');

    // Add keyboard shortcut for Ctrl+S / Cmd+S
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });
  };

  // Apply / clear trace line decoration whenever traceLine changes
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    if (traceLine != null && traceLine > 0) {
      const newDecorations = editor.deltaDecorations(traceDecorationsRef.current, [
        {
          range: new monaco.Range(traceLine, 1, traceLine, 1),
          options: {
            isWholeLine: true,
            className: 'trace-line-highlight',
            glyphMarginClassName: 'trace-glyph',
            overviewRuler: { color: '#7c3aed', position: monaco.editor.OverviewRulerLane.Full },
          },
        },
      ]);
      traceDecorationsRef.current = newDecorations;
      // Reveal line in editor
      editor.revealLineInCenterIfOutsideViewport(traceLine);
    } else {
      // Clear decorations
      traceDecorationsRef.current = editor.deltaDecorations(traceDecorationsRef.current, []);
    }

    return () => {
      if (editorRef.current && traceDecorationsRef.current.length > 0) {
        traceDecorationsRef.current = editorRef.current.deltaDecorations(traceDecorationsRef.current, []);
      }
    };
  }, [traceLine]);

  // Sync Monaco theme when resolvedTheme changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(resolvedTheme === 'light' ? 'codespace-light' : 'codespace-dark');
    }
  }, [resolvedTheme]);

  const monacoLanguage = MONACO_LANG_MAP[language] || 'plaintext';
  
  // Prevent hydration mismatch by using dark theme initially until mounted
  const currentTheme = mounted && resolvedTheme === 'light' ? 'codespace-light' : 'codespace-dark';

  return (
    <div className="w-full h-full bg-canvas relative overflow-hidden">
      <Editor
        height="100%"
        language={monacoLanguage}
        value={code}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        theme={currentTheme}
        options={{
          readOnly,
          fontSize: settings.fontSize || 14,
          tabSize: settings.tabSize || 4,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          lineNumbersMinChars: 4,
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 10,
          wordWrap: 'on',
          minimap: { enabled: false },
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
          autoIndent: 'full',
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          scrollBeyondLastLine: false,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          contextmenu: true,
          renderControlCharacters: false,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true
          }
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-canvas text-xs text-muted font-mono">
            Loading Monaco Editor...
          </div>
        }
      />
    </div>
  );
};
