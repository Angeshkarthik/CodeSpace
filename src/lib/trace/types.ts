import { LanguageType } from '@/types';

export type TraceEventType =
  | 'statement'
  | 'variable-change'
  | 'loop'
  | 'function-enter'
  | 'function-exit'
  | 'return'
  | 'condition'
  | 'program-end'
  | 'error';

export type TraceStatus = 'completed' | 'error' | 'timeout' | 'step-limit' | 'unsupported';

export interface TraceEvent {
  /** 1-based step number */
  step: number;
  /** 1-based source line in the ORIGINAL (un-instrumented) user code */
  line?: number;
  eventType: TraceEventType;
  /** All visible variable values at this step, serialized as human-readable strings */
  variables: Record<string, string>;
  /** Names of variables whose value changed since the previous step */
  changedVariables?: string[];
  /** Human-readable description of this event */
  message?: string;
  functionName?: string;
  returnValue?: string;
}

export interface TraceResult {
  status: TraceStatus;
  events: TraceEvent[];
  totalSteps: number;
  stdout?: string;
  stderr?: string;
  executionTimeMs?: number;
  error?: string;
  language: LanguageType;
}

export interface TraceRequest {
  language: LanguageType;
  code: string;
  stdin?: string;
  maxSteps?: number;
}

export interface ITraceProvider {
  trace(request: TraceRequest): Promise<TraceResult>;
}

/** Max trace steps before forceful stop (protects against infinite loops) */
export const DEFAULT_MAX_TRACE_STEPS = 500;
/** Max chars for a single variable value display */
export const MAX_VAR_VALUE_LENGTH = 200;
