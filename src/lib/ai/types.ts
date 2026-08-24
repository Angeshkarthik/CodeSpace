import { CodeAnalysisResult } from '../analysis/types';
import { ExecutionResult } from '../execution/types';
import { BatchTestSummary } from '../execution/TestRunner';
import { LanguageType } from '@/types';

export interface CodeReviewContext {
  language: LanguageType;
  code: string;
  analysis: CodeAnalysisResult;
  execution?: ExecutionResult | null;
  tests?: BatchTestSummary | null;
}

export interface AIReviewResult {
  summary: string;
  correctness: {
    status: 'working' | 'issues_found' | 'insufficient_evidence';
    explanation: string;
  };
  complexity: {
    time: string;
    space: string;
    explanation: string;
  };
  strengths: string[];
  issues: {
    title: string;
    severity: 'low' | 'medium' | 'high';
    explanation: string;
  }[];
  suggestions: {
    title: string;
    explanation: string;
  }[];
  learningPoints: string[];
}

export interface AIReviewResponse {
  success: boolean;
  review?: AIReviewResult;
  fallback?: boolean;
  error?: string;
}

// ─── Phase 2D: Explain My Code ───────────────────────────────────────────────

export interface CodeExplanationContext {
  language: LanguageType;
  code: string;
  analysis?: CodeAnalysisResult | null;
  execution?: ExecutionResult | null;
  tests?: BatchTestSummary | null;
}

export interface CodeExplanation {
  overview: string;
  purpose: string;
  keyConcepts: {
    title: string;
    explanation: string;
  }[];
  variables: {
    name: string;
    role: string;
  }[];
  functions: {
    name: string;
    purpose: string;
    parameters?: string;
    returnValue?: string;
  }[];
  controlFlow: string[];
  algorithm?: {
    name: string;
    explanation: string;
  };
  complexity?: {
    time: string;
    space: string;
    explanation: string;
  };
  walkthrough?: {
    input: string;
    steps: {
      step: number;
      explanation: string;
    }[];
    finalResult: string;
  };
  learningPoints: string[];
}

export interface AIExplainResponse {
  success: boolean;
  explanation?: CodeExplanation;
  error?: string;
}
