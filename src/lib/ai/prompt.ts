import { CodeReviewContext, CodeExplanationContext } from './types';

// ─── Phase 2C: Code Review prompts ───────────────────────────────────────────

export function buildReviewSystemPrompt(): string {
  return `You are CodeSpace AI, a senior programming & DSA code review mentor.
Your job is to provide concise, accurate, educational feedback on student code.

STRICT CONSTRAINTS:
1. DETERMINISTIC EVIDENCE IS SOURCE OF TRUTH:
   - If tests are provided, respect test pass/fail counts exactly. If 4/5 passed, state that 1 test failed.
   - If no tests are provided, correctness status MUST be "insufficient_evidence".
   - If execution status is compile_error or runtime_error, correctness status MUST be "issues_found".
2. RESPECT DETERMINISTIC ANALYSIS:
   - Do NOT override the provided Time/Space complexity estimate. If deterministic analyzer reports "Likely O(n²)", explain why it is O(n²).
   - If complexity is "Unknown", explain why complexity could not be determined reliably.
3. TEACH, DO NOT SPOIL SOLUTIONS:
   - Do NOT output a full rewritten code solution.
   - Provide conceptual suggestions and hints that help the user think and optimize on their own.
4. OUTPUT FORMAT:
   - Respond ONLY with a single valid JSON object matching the requested schema. Do not include markdown code blocks or conversational text.`;
}

export function buildReviewUserPrompt(context: CodeReviewContext): string {
  const { language, code, analysis, execution, tests } = context;

  const testSummaryText = tests
    ? `Total: ${tests.total}, Passed: ${tests.passed}, Failed: ${tests.failed}`
    : 'No test cases executed';

  const executionSummaryText = execution
    ? `Status: ${execution.status}, Exit Code: ${execution.exitCode ?? 'N/A'}, Duration: ${execution.executionTimeMs ?? 0}ms\nStdout: ${execution.stdout || '(none)'}\nStderr: ${execution.stderr || '(none)'}`
    : 'No recent single execution';

  return JSON.stringify({
    task: 'Review the following code based on execution and static analysis data.',
    codeContext: {
      language,
      code,
      deterministicAnalysis: {
        timeComplexity: analysis.complexity.time.estimate,
        timeConfidence: analysis.complexity.time.confidence,
        timeExplanation: analysis.complexity.time.explanation,
        spaceComplexity: analysis.complexity.space.estimate,
        spaceExplanation: analysis.complexity.space.explanation,
        structure: analysis.structure,
        detectedDSAPatterns: analysis.dsaPatterns.map((p) => p.name),
        issues: analysis.issues.map((i) => ({ title: i.title, message: i.message, line: i.line }))
      },
      executionSummary: executionSummaryText,
      testSummary: testSummaryText
    },
    requestedJSONFormat: {
      summary: 'Short 1-2 sentence overall review summary',
      correctness: {
        status: 'working | issues_found | insufficient_evidence',
        explanation: 'Detailed explanation based on test/execution evidence'
      },
      complexity: {
        time: 'Complexity estimate string (e.g. Likely O(n²))',
        space: 'Space estimate string (e.g. O(1))',
        explanation: 'Detailed explanation of time and space factors'
      },
      strengths: ['Strength 1', 'Strength 2'],
      issues: [
        {
          title: 'Issue Title',
          severity: 'low | medium | high',
          explanation: 'Clear explanation of potential issue'
        }
      ],
      suggestions: [
        {
          title: 'Optimization Hint Title',
          explanation: 'Conceptual guidance on how to improve without full code rewrite'
        }
      ],
      learningPoints: ['Key DSA takeaway 1', 'Key DSA takeaway 2']
    }
  }, null, 2);
}

// ─── Phase 2D: Explain My Code prompts ───────────────────────────────────────

export function buildExplainSystemPrompt(): string {
  return `You are CodeSpace AI, an expert programming mentor and teacher.
Your job is to help a developer understand their OWN code — not to improve or critique it.

STRICT RULES:
1. EXPLAIN, DO NOT REVIEW: Do not critique or suggest improvements. This is a teaching session.
2. EXPLAIN THE USER'S ACTUAL CODE: Explain only what is present in the supplied code.
3. DO NOT FABRICATE:
   - Do not invent execution outputs not present in the supplied context.
   - Do not invent test results not present in the supplied context.
   - Do not invent complexity when deterministic analysis says Unknown — preserve Unknown.
4. DETERMINISTIC ANALYSIS IS AUTHORITATIVE:
   - If static analysis results are provided, use them for time/space complexity. Do not override.
   - If complexity is Unknown, state "Unknown" and explain why it cannot be determined.
5. TEACH IN SIMPLE LANGUAGE: Use language-appropriate terminology (pointers for C/C++, lists/dicts for Python, etc.).
6. WALKTHROUGH MUST BE LOGICALLY CONSISTENT WITH THE CODE: 
   - Only generate step-by-step walkthroughs that accurately trace the actual code logic.
   - Do not invent variables or behavior not present in the code.
   - If a meaningful walkthrough cannot be safely generated, set walkthrough to null.
7. DO NOT REWRITE CODE: Provide no optimized alternatives or full rewrites.
8. FOCUS ON UNDERSTANDING: Help the user mentally trace and understand their own code.
9. OUTPUT FORMAT:
   - Respond ONLY with a single valid JSON object matching the schema below exactly.
   - Do NOT include markdown code fences, explanatory text, or anything outside the JSON object.`;
}

export function buildExplainUserPrompt(context: CodeExplanationContext): string {
  const { language, code, analysis, execution, tests } = context;

  const analysisContext = analysis
    ? {
        timeComplexity: analysis.complexity.time.estimate,
        timeConfidence: analysis.complexity.time.confidence,
        spaceComplexity: analysis.complexity.space.estimate,
        detectedDSAPatterns: analysis.dsaPatterns.map((p) => p.name),
        structure: {
          functions: analysis.structure.functions,
          loops: analysis.structure.loops,
          nestedLoopDepth: analysis.structure.nestedLoopDepth,
          recursionDetected: analysis.structure.recursionDetected
        }
      }
    : null;

  const executionContext = execution
    ? {
        status: execution.status,
        stdout: execution.stdout || '(none)',
        stderr: execution.stderr || '(none)',
        executionTimeMs: execution.executionTimeMs ?? 0
      }
    : null;

  const testContext = tests
    ? { total: tests.total, passed: tests.passed, failed: tests.failed }
    : null;

  return JSON.stringify({
    task: 'Explain the following code to its author so they understand exactly how it works.',
    codeContext: {
      language,
      code,
      deterministicAnalysis: analysisContext,
      executionResult: executionContext,
      testSummary: testContext
    },
    requestedJSONSchema: {
      overview: 'string — One concise sentence: what does this program do overall?',
      purpose: 'string — One or two sentences: what is the main implementation strategy?',
      keyConcepts: [
        {
          title: 'string — Concept name (e.g. Loop, Array, Recursion, Hash Map)',
          explanation: 'string — Why this concept appears in this specific code'
        }
      ],
      variables: [
        {
          name: 'string — variable identifier',
          role: 'string — What this variable stores or tracks in context of the algorithm'
        }
      ],
      functions: [
        {
          name: 'string — function/method name',
          purpose: 'string — What this function does in context',
          parameters: 'string | null — Parameter names and meaning, or null if none',
          returnValue: 'string | null — What it returns, or null if void/none'
        }
      ],
      controlFlow: [
        'string — Step 1: Describe first significant control flow action',
        'string — Step 2: Next action, etc.'
      ],
      algorithm: {
        name: 'string | null — Algorithm name (e.g. Binary Search, Linear Traversal) or null if none applies',
        explanation: 'string | null — How and why this algorithm is used, or null'
      },
      complexity: {
        time: 'string — Use deterministic estimate if provided, otherwise Unknown',
        space: 'string — Use deterministic estimate if provided, otherwise Unknown',
        explanation: 'string — Explain why the code has this time and space complexity'
      },
      walkthrough: {
        input: 'string — A simple concrete example input',
        steps: [
          {
            step: 'number — Step number starting at 1',
            explanation: 'string — What happens at this step using example values'
          }
        ],
        finalResult: 'string — Output or final state for the example input'
      },
      learningPoints: [
        'string — A key insight about this code that helps the author understand it better'
      ]
    }
  }, null, 2);
}
