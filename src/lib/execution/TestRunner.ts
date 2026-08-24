import { TestCase, LanguageType } from '@/types';
import { ExecutionResult } from './types';

export interface TestResultItem {
  id: string;
  testCaseUuid: string;
  testNumber: number;
  input: string;
  expectedOutput?: string;
  actualOutput: string;
  stderr: string;
  status: 'passed' | 'failed' | 'compile_error' | 'runtime_error' | 'timeout' | 'execution_error';
  executionTimeMs?: number;
  exitCode?: number | null;
  errorMessage?: string;
}

export interface BatchTestSummary {
  total: number;
  passed: number;
  failed: number;
  results: TestResultItem[];
}

export async function runTestCasesBatch(
  code: string,
  language: LanguageType,
  testCases: TestCase[],
  onProgress?: (completed: number, total: number) => void
): Promise<BatchTestSummary> {
  const results: TestResultItem[] = [];
  let passedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];

    try {
      // Call server execution API endpoint POST /api/execute sequentially
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language,
          code,
          stdin: tc.input
        })
      });

      const execRes: ExecutionResult = await res.json();

      let status: TestResultItem['status'] = 'passed';
      let errorMessage: string | undefined;

      if (execRes.status !== 'success') {
        status = execRes.status;
        errorMessage = execRes.stderr || `Execution failed (${execRes.status})`;
      } else if (tc.expectedOutput !== undefined && tc.expectedOutput.trim() !== '') {
        // Compare conservative normalized outputs: trim trailing whitespace and normalize line endings
        const normActual = (execRes.stdout || '').replace(/\r\n/g, '\n').trimEnd();
        const normExpected = tc.expectedOutput.replace(/\r\n/g, '\n').trimEnd();

        if (normActual !== normExpected) {
          status = 'failed';
        }
      }

      if (status === 'passed') {
        passedCount++;
      } else {
        failedCount++;
      }

      results.push({
        id: crypto.randomUUID(),
        testCaseUuid: tc.uuid,
        testNumber: i + 1,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: execRes.stdout || '',
        stderr: execRes.stderr || '',
        status,
        executionTimeMs: execRes.executionTimeMs,
        exitCode: execRes.exitCode,
        errorMessage
      });
    } catch (err: any) {
      failedCount++;
      results.push({
        id: crypto.randomUUID(),
        testCaseUuid: tc.uuid,
        testNumber: i + 1,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: '',
        stderr: err.message || String(err),
        status: 'execution_error',
        executionTimeMs: 0,
        errorMessage: err.message || String(err)
      });
    }

    if (onProgress) {
      onProgress(i + 1, testCases.length);
    }
  }

  return {
    total: testCases.length,
    passed: passedCount,
    failed: failedCount,
    results
  };
}
