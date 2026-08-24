import { NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai/AIProvider';
import { CodeReviewContext } from '@/lib/ai/types';

export async function POST(req: Request) {
  try {
    const body: CodeReviewContext = await req.json();

    if (!body.code || !body.language || !body.analysis) {
      return NextResponse.json(
        { success: false, error: 'Missing required code, language, or analysis payload' },
        { status: 400 }
      );
    }

    if (typeof body.code === 'string' && body.code.length > 500000) {
      return NextResponse.json(
        { success: false, error: 'Code payload exceeds maximum allowed size (500KB).' },
        { status: 400 }
      );
    }

    const result = await aiProvider.reviewCode(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        fallback: true,
        error: `Server processing error: ${err.message || String(err)}`
      },
      { status: 500 }
    );
  }
}
