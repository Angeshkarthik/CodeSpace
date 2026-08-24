import { NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai/AIProvider';
import { CodeExplanationContext } from '@/lib/ai/types';

export async function POST(req: Request) {
  try {
    const body: CodeExplanationContext = await req.json();

    if (!body.code || !body.language) {
      return NextResponse.json(
        { success: false, error: 'Missing required code or language payload.' },
        { status: 400 }
      );
    }

    if (body.code.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'No code available to explain.' },
        { status: 400 }
      );
    }

    if (body.code.length > 500000) {
      return NextResponse.json(
        { success: false, error: 'Code payload exceeds maximum allowed size (500KB).' },
        { status: 400 }
      );
    }

    const result = await aiProvider.explainCode(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Server processing error: ${msg}` },
      { status: 500 }
    );
  }
}
