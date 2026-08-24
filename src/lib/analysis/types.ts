import { LanguageType } from '@/types';

export type TimeComplexityEstimate =
  | 'O(1)'
  | 'O(log n)'
  | 'O(n)'
  | 'O(n log n)'
  | 'O(n²)'
  | 'O(n³+)'
  | 'Unknown';

export type SpaceComplexityEstimate =
  | 'O(1)'
  | 'O(n)'
  | 'O(n²)'
  | 'Unknown';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface StructureMetrics {
  functions: number;
  loops: number;
  nestedLoopDepth: number;
  conditionals: number;
  recursionDetected: boolean;
}

export interface ComplexityAnalysis {
  time: {
    estimate: TimeComplexityEstimate;
    confidence: ConfidenceLevel;
    explanation: string;
  };
  space: {
    estimate: SpaceComplexityEstimate;
    confidence: ConfidenceLevel;
    explanation: string;
  };
}

export interface AnalysisIssue {
  id: string;
  severity: 'info' | 'warning';
  category: 'complexity' | 'correctness' | 'performance' | 'readability' | 'safety' | 'style';
  title: string;
  message: string;
  line?: number;
}

export interface AnalysisSuggestion {
  id: string;
  title: string;
  message: string;
  category: string;
}

export interface DSAPatternHint {
  id: string;
  name: string;
  description: string;
}

export interface CodeAnalysisResult {
  language: LanguageType;
  structure: StructureMetrics;
  complexity: ComplexityAnalysis;
  issues: AnalysisIssue[];
  suggestions: AnalysisSuggestion[];
  dsaPatterns: DSAPatternHint[];
}
