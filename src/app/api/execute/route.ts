import { NextRequest, NextResponse } from 'next/server';
import { executionManager } from '@/lib/execution/ExecutionManager';
import { ExecutionRequest, LanguageType } from '@/lib/execution/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, language, code, stdin = '' } = body;

    if (!language || !['c', 'cpp', 'python', 'java'].includes(language)) {
      return NextResponse.json(
        {
          status: 'execution_error',
          stdout: '',
          stderr: 'Invalid language specified. Supported: c, cpp, python, java.'
        },
        { status: 400 }
      );
    }

    if (typeof code !== 'string') {
      return NextResponse.json(
        {
          status: 'execution_error',
          stdout: '',
          stderr: 'Code payload must be a string.'
        },
        { status: 400 }
      );
    }

    if (code.length > 500000) {
      return NextResponse.json(
        {
          status: 'execution_error',
          stdout: '',
          stderr: 'Code payload exceeds maximum allowed size (500KB).'
        },
        { status: 400 }
      );
    }

    const requestPayload: ExecutionRequest = {
      mode,
      language: language as LanguageType,
      code,
      stdin
    };

    const result = await executionManager.execute(requestPayload);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'execution_error',
        stdout: '',
        stderr: `Server execution endpoint error: ${error.message || String(error)}`
      },
      { status: 500 }
    );
  }
}
