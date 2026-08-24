'use client';

import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
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

    monaco.editor.setTheme('codespace-dark');

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

  const monacoLanguage = MONACO_LANG_MAP[language] || 'plaintext';

  return (
    <div className="w-full h-full bg-[#0d1117] relative overflow-hidden">
      <Editor
        height="100%"
        language={monacoLanguage}
        value={code}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        theme="codespace-dark"
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
          <div className="flex items-center justify-center h-full bg-[#0d1117] text-xs text-gray-400 font-mono">
            Loading Monaco Editor...
          </div>
        }
      />
    </div>
  );
};
