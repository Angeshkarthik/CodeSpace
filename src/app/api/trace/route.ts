import { NextRequest, NextResponse } from 'next/server';
import { traceManager } from '@/lib/trace/TraceManager';
import { TraceRequest, DEFAULT_MAX_TRACE_STEPS } from '@/lib/trace/types';
import { LanguageType } from '@/types';

const VALID_LANGUAGES: LanguageType[] = ['c', 'cpp', 'python', 'java'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { language, code, stdin = '', maxSteps } = body;

    if (!language || !VALID_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { status: 'error', events: [], totalSteps: 0, error: 'Invalid language. Supported: c, cpp, python, java.' },
        { status: 400 }
      );
    }

    if (typeof code !== 'string') {
      return NextResponse.json(
        { status: 'error', events: [], totalSteps: 0, error: 'Code must be a string.' },
        { status: 400 }
      );
    }

    if (code.length > 500000) {
      return NextResponse.json(
        { status: 'error', events: [], totalSteps: 0, error: 'Code payload exceeds maximum allowed size (500KB).' },
        { status: 400 }
      );
    }

    if (!code.trim()) {
      return NextResponse.json({
        status: 'unsupported',
        events: [],
        totalSteps: 0,
        error: 'No code available to trace.',
        language,
      });
    }

    const safeMaxSteps = typeof maxSteps === 'number' && maxSteps > 0
      ? Math.min(maxSteps, 1000)
      : DEFAULT_MAX_TRACE_STEPS;

    const traceRequest: TraceRequest = {
      language: language as LanguageType,
      code,
      stdin,
      maxSteps: safeMaxSteps,
    };

    const result = await traceManager.trace(traceRequest);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { status: 'error', events: [], totalSteps: 0, error: `Trace endpoint error: ${msg}` },
      { status: 500 }
    );
  }
}
