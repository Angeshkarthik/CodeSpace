import { LanguageType } from '@/types';

export type { LanguageType };

export type ExecutionStatus =
  | 'success'
  | 'compile_error'
  | 'runtime_error'
  | 'timeout'
  | 'execution_error';

export interface ExecutionRequest {
  mode?: string;
  language: LanguageType;
  code: string;
  stdin?: string;
}

export interface ExecutionResult {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  executionTimeMs?: number;
  exitCode?: number | null;
  errorDetails?: string;
}

export interface IExecutionProvider {
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}
