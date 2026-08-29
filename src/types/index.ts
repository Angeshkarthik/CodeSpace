export type LanguageType = 'c' | 'cpp' | 'python' | 'java';

export interface Program {
  id?: number;
  uuid: string;
  name: string;
  language: LanguageType;
  code: string;
  createdAt: number;
  updatedAt: number;
}

export interface TestCase {
  id?: number;
  uuid: string;
  programUuid: string;
  input: string;
  expectedOutput?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  id?: number;
  key: string;
  theme: 'vs-dark' | 'light';
  fontSize: number;
  tabSize: number;
  autoSave: boolean;
}

export type ConsoleTab = 'run_io' | 'errors' | 'tests';

export interface StarterTemplate {
  name: string;
  language: LanguageType;
  extension: string;
  defaultCode: string;
}
