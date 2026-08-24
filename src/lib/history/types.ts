import { LanguageType } from '@/types';
import { ExecutionResult } from '@/lib/execution/types';
import { CodeAnalysisResult } from '@/lib/analysis/types';
import { BenchmarkResult } from '@/lib/benchmark/types';
import { AIReviewResult } from '@/lib/ai/types';
import { BatchTestSummary } from '@/lib/execution/TestRunner';

export interface ProgramVersion {
  id?: number;
  uuid: string;
  programUuid: string;
  versionNumber: number;
  label: string;
  code: string;
  language: LanguageType;
  input?: string;
  mode?: string;
  createdAt: number;
  execution?: ExecutionResult | null;
  tests?: BatchTestSummary | null;
  analysis?: CodeAnalysisResult | null;
  benchmark?: BenchmarkResult | null;
  review?: AIReviewResult | null;
}

export const MAX_VERSIONS_PER_PROGRAM = 100;
export const MAX_CODE_LENGTH_BYTES = 500 * 1024; // 500 KB limit for safe storage
