import { LanguageType } from '@/types';
import { ExecutionResult } from '../execution/types';
import { BatchTestSummary } from '../execution/TestRunner';
import { CodeAnalysisResult } from '../analysis/types';
import { BenchmarkResult } from '../benchmark/types';

export type PracticeDifficulty = 'Easy' | 'Medium' | 'Hard';
export type PracticeStatus = 'Not Started' | 'In Progress' | 'Solved';
export type AttemptOutcome = 'Solved' | 'Failed' | 'Incomplete';

export interface PracticeProblem {
  id?: number;
  uuid: string;
  title: string;
  topic: string;
  difficulty: PracticeDifficulty;
  description: string;
  status: PracticeStatus;
  programUuid?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface PracticeAttempt {
  id?: number;
  uuid: string;
  practiceProblemUuid: string;
  programUuid?: string | null;
  attemptNumber: number;
  createdAt: number;

  // Code Snapshot
  code: string;
  language: LanguageType;

  // Context
  input?: string | null;
  executionMode?: string | null;

  // Evidence
  execution?: ExecutionResult | null;
  tests?: BatchTestSummary | null;
  analysis?: CodeAnalysisResult | null;
  benchmark?: BenchmarkResult | null;

  // Detected Information
  patterns?: string[];

  // Outcome
  outcome: AttemptOutcome;
}
