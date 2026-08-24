import {
  CodeReviewContext,
  AIReviewResult,
  AIReviewResponse,
  CodeExplanationContext,
  CodeExplanation,
  AIExplainResponse
} from './types';
import {
  buildReviewSystemPrompt,
  buildReviewUserPrompt,
  buildExplainSystemPrompt,
  buildExplainUserPrompt
} from './prompt';

// ─── Internal helper: call whichever AI provider is configured ───────────────

async function callAI(systemPrompt: string, userPrompt: string, maxTokens = 1800): Promise<string> {
  if (process.env.GEMINI_API_KEY) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
        })
      }
    );
    if (!response.ok) throw new Error(`Gemini API error: HTTP ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  if (process.env.CLAUDE_API_KEY) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });
    if (!response.ok) throw new Error(`Claude API error: HTTP ${response.status}`);
    const data = await response.json();
    return data.content?.[0]?.text || '';
  }

  if (process.env.OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });
    if (!response.ok) throw new Error(`OpenAI API error: HTTP ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  throw new Error('NO_API_KEY');
}

function isApiKeyConfigured(): boolean {
  return !!(
    process.env.GEMINI_API_KEY ||
    process.env.CLAUDE_API_KEY ||
    process.env.OPENAI_API_KEY
  );
}

function safeParseJson<T>(jsonText: string): T {
  const clean = jsonText.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(clean) as T;
}

// ─── AIProvider ───────────────────────────────────────────────────────────────

export interface IAIProvider {
  reviewCode(context: CodeReviewContext): Promise<AIReviewResponse>;
  explainCode(context: CodeExplanationContext): Promise<AIExplainResponse>;
}

export class AIProvider implements IAIProvider {
  // ── Phase 2C: Code Review ─────────────────────────────────────────────────
  async reviewCode(context: CodeReviewContext): Promise<AIReviewResponse> {
    if (!isApiKeyConfigured()) {
      return {
        success: false,
        fallback: true,
        error: 'AI API key not configured on server. Displaying deterministic static review.'
      };
    }

    try {
      const jsonText = await callAI(
        buildReviewSystemPrompt(),
        buildReviewUserPrompt(context),
        1500
      );

      if (!jsonText) throw new Error('Empty response received from AI provider');

      const parsedReview = safeParseJson<AIReviewResult>(jsonText);
      return { success: true, review: parsedReview };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isNoKey = msg === 'NO_API_KEY';
      return {
        success: false,
        fallback: true,
        error: isNoKey
          ? 'AI API key not configured. Displaying static review.'
          : `AI Review unavailable (${msg}). Displaying static review.`
      };
    }
  }

  // ── Phase 2D: Explain My Code ─────────────────────────────────────────────
  async explainCode(context: CodeExplanationContext): Promise<AIExplainResponse> {
    if (!isApiKeyConfigured()) {
      return {
        success: false,
        error: 'AI API key not configured on server. AI explanation is unavailable.'
      };
    }

    try {
      const jsonText = await callAI(
        buildExplainSystemPrompt(),
        buildExplainUserPrompt(context),
        2000
      );

      if (!jsonText) throw new Error('Empty response received from AI provider');

      const parsed = safeParseJson<CodeExplanation>(jsonText);
      return { success: true, explanation: parsed };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isNoKey = msg === 'NO_API_KEY';
      return {
        success: false,
        error: isNoKey
          ? 'AI API key not configured. AI explanation is unavailable.'
          : `AI explanation unavailable (${msg}).`
      };
    }
  }
}

export const aiProvider = new AIProvider();
