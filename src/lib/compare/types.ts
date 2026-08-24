import { LanguageType } from '@/types';
import { ExecutionResult } from '@/lib/execution/types';
import { CodeAnalysisResult } from '@/lib/analysis/types';
import { BenchmarkResult } from '@/lib/benchmark/types';
import { BatchTestSummary } from '@/lib/execution/TestRunner';

export interface CodeSnapshot {
  id: string;
  label: string;
  code: string;
  language: LanguageType;
  input?: string;
  mode?: string;
  createdAt: number;
  analysis?: CodeAnalysisResult | null;
  benchmark?: BenchmarkResult | null;
  execution?: ExecutionResult | null;
  tests?: BatchTestSummary | null;
}

export type ComplexityChangeType = 'improved' | 'regressed' | 'unchanged' | 'unknown';
export type SpaceChangeType = 'increased' | 'decreased' | 'unchanged' | 'unknown';
export type RuntimeChangeType = 'faster' | 'slower' | 'unchanged' | 'uncomparable';

export interface ComplexityComparison {
  versionATime: string;
  versionBTime: string;
  versionAConfidence?: string;
  versionBConfidence?: string;
  timeChange: ComplexityChangeType;
  timeSummary: string;

  versionASpace: string;
  versionBSpace: string;
  spaceChange: SpaceChangeType;
  spaceSummary: string;
}

export interface BenchmarkComparison {
  isComparable: boolean;
  uncomparableReason?: string;
  versionAAvgMs?: number;
  versionAMedianMs?: number;
  versionBAvgMs?: number;
  versionBMedianMs?: number;
  diffPercent?: number; // negative means faster (e.g. -87.3 = 87.3% lower runtime)
  runtimeChange?: RuntimeChangeType;
  summary?: string;
}

export interface ComparisonSummaryItem {
  icon: 'check' | 'alert' | 'info';
  type: 'time' | 'space' | 'runtime' | 'dsa' | 'test' | 'execution';
  label: string;
  detail: string;
  variant: 'success' | 'warning' | 'neutral';
}

export interface FullComparisonResult {
  snapshotA: CodeSnapshot;
  snapshotB: CodeSnapshot;
  languageMatch: boolean;
  analysisA: CodeAnalysisResult;
  analysisB: CodeAnalysisResult;
  complexity: ComplexityComparison;
  benchmark: BenchmarkComparison;
  dsaPatternsA: string[];
  dsaPatternsB: string[];
  testComparison?: {
    versionAPassed?: number;
    versionATotal?: number;
    versionBPassed?: number;
    versionBTotal?: number;
    summary?: string;
  };
  executionComparison?: {
    versionAStatus?: string;
    versionBStatus?: string;
    summary?: string;
  };
  summaryItems: ComparisonSummaryItem[];
  isStale: boolean;
}
