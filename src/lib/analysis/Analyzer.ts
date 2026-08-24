import { LanguageType } from '@/types';
import {
  CodeAnalysisResult,
  StructureMetrics,
  ComplexityAnalysis,
  AnalysisIssue,
  AnalysisSuggestion,
  DSAPatternHint,
  TimeComplexityEstimate,
  SpaceComplexityEstimate,
  ConfidenceLevel
} from './types';

export function analyzeCode(language: LanguageType, code: string): CodeAnalysisResult {
  const trimmed = code.trim();

  // Handle empty or incomplete code gracefully
  if (!trimmed || trimmed.length < 10) {
    return {
      language,
      structure: {
        functions: 0,
        loops: 0,
        nestedLoopDepth: 0,
        conditionals: 0,
        recursionDetected: false
      },
      complexity: {
        time: {
          estimate: 'Unknown',
          confidence: 'low',
          explanation: 'Code is empty or incomplete.'
        },
        space: {
          estimate: 'Unknown',
          confidence: 'low',
          explanation: 'Code is empty or incomplete.'
        }
      },
      issues: [
        {
          id: 'empty-code',
          severity: 'info',
          category: 'readability',
          title: 'Incomplete Source Code',
          message: 'Analysis is limited because the editor code appears incomplete.'
        }
      ],
      suggestions: [],
      dsaPatterns: []
    };
  }

  // 1. Clean code by removing comments
  const cleanCode = stripComments(code, language);

  // 2. Parse structural metrics
  const structure = parseStructure(cleanCode, language);

  // 3. Analyze time and space complexity with fine-grained bound analysis
  const complexity = analyzeComplexity(cleanCode, language, structure);

  // 4. Run rule checks for issues and suggestions
  const issues: AnalysisIssue[] = [];
  const suggestions: AnalysisSuggestion[] = [];
  runRuleChecks(cleanCode, language, structure, issues, suggestions);

  // 5. Detect DSA algorithmic patterns with high precision
  const dsaPatterns = detectDSAPatterns(cleanCode, language);

  return {
    language,
    structure,
    complexity,
    issues,
    suggestions,
    dsaPatterns
  };
}

/**
 * Removes comments from code based on language syntax
 */
function stripComments(code: string, language: LanguageType): string {
  if (language === 'python') {
    return code.replace(/#.*$/gm, '').replace(/('''[\s\S]*?'''|"""[\s\S]*?""")/g, '');
  } else {
    return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  }
}

interface DetailedLoopInfo {
  isConstantBound: boolean; // e.g. j < 10
  isLogarithmic: boolean;   // e.g. x *= 2 or x /= 2
  isLinear: boolean;        // e.g. i < n, i++
  boundVariable?: string;
}

/**
 * Parses structural metrics
 */
function parseStructure(code: string, language: LanguageType): StructureMetrics {
  let functionCount = 0;
  let loopCount = 0;
  let conditionalsCount = 0;
  let maxLoopDepth = 0;
  let recursionDetected = false;

  const lines = code.split('\n');

  // Function signature detection patterns
  let funcPattern: RegExp;
  if (language === 'python') {
    funcPattern = /\bdef\s+([a-zA-Z_]\w*)\s*\(/g;
  } else if (language === 'c' || language === 'cpp') {
    funcPattern = /\b(?:void|int|double|float|char|bool|long|auto|string|vector<[^>]+>)\s+([a-zA-Z_]\w*)\s*\([^;)]*\)\s*\{/g;
  } else {
    funcPattern = /\b(?:public|private|protected|static|\s)+(?:void|int|double|float|char|boolean|long|String|[\w<>\[\]]+)\s+([a-zA-Z_]\w*)\s*\([^)]*\)\s*(?:throws\s+\w+)?\s*\{/g;
  }

  const funcNames: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = funcPattern.exec(code)) !== null) {
    functionCount++;
    if (match[1] && !['if', 'for', 'while', 'switch', 'main'].includes(match[1])) {
      funcNames.push(match[1]);
    }
  }

  // Check for recursion: function calling itself
  for (const fnName of funcNames) {
    const fnCallRegex = new RegExp(`\\b${fnName}\\s*\\(`, 'g');
    const matches = code.match(fnCallRegex);
    if (matches && matches.length > 1) {
      recursionDetected = true;
      break;
    }
  }

  if (!recursionDetected && /\b(factorial|fibonacci|solve|dfs|quicksort|mergesort)\s*\([^)]*\)/i.test(code)) {
    if (/\b(return|void)\s+\w+\s*\([^)]*\).*\{[\s\S]*?\b\w+\s*\(/.test(code)) {
      recursionDetected = true;
    }
  }

  // Count conditionals
  const condMatches = code.match(/\b(if|else\s+if|elif|switch)\b/g);
  if (condMatches) {
    conditionalsCount = condMatches.length;
  }

  // Calculate loop count and nesting depth
  if (language !== 'python') {
    let nonPyLoopCount = 0;
    let nonPyMaxDepth = 0;

    // Stack of open scopes: { isLoop: boolean, isBlock: boolean }
    const scopeStack: Array<{ isLoop: boolean; isBlock: boolean }> = [];

    const getLoopDepth = () => scopeStack.filter((s) => s.isLoop).length;

    for (let i = 0; i < lines.length; i++) {
      // Strip comments and string literals to prevent false brace/keyword matches
      let rawLine = lines[i].replace(/\/\/.*$/, '').replace(/"([^"\\]|\\.)*"/g, '""').replace(/'([^'\\]|\\.)*'/g, "''");
      const line = rawLine.trim();
      if (!line) continue;

      const isDoWhileEnd = /^\}\s*while\s*\(/.test(line);
      const isLoopHeader = !isDoWhileEnd && (
        /\b(for|while)\b/.test(line) || /\bdo\b/.test(line)
      );

      const openingBraces = (line.match(/\{/g) || []).length;
      const closingBraces = (line.match(/\}/g) || []).length;
      const hasSemicolon = line.endsWith(';') || /;\s*$/.test(line);

      if (isLoopHeader) {
        nonPyLoopCount++;

        const hasOpeningBrace = line.includes('{');
        const hasClosingBrace = line.includes('}');

        if (hasOpeningBrace && hasClosingBrace) {
          // Single-line block loop: e.g. for (int i=0; i<n; i++) { sum += i; }
          const currentDepth = getLoopDepth();
          const lineMaxDepth = currentDepth + 1;
          if (lineMaxDepth > nonPyMaxDepth) {
            nonPyMaxDepth = lineMaxDepth;
          }
          while (scopeStack.length > 0 && !scopeStack[scopeStack.length - 1].isBlock) {
            scopeStack.pop();
          }
        } else if (hasOpeningBrace) {
          // Multi-line block loop starting on this line: e.g. for (...) {
          while (scopeStack.length > 0 && !scopeStack[scopeStack.length - 1].isBlock) {
            scopeStack.pop();
          }
          scopeStack.push({ isLoop: true, isBlock: true });
          const currentDepth = getLoopDepth();
          if (currentDepth > nonPyMaxDepth) {
            nonPyMaxDepth = currentDepth;
          }
        } else {
          // Check if statement ends on same line after header: e.g. for (int i=0; i<n; i++) sum += i;
          const headerEndIdx = line.lastIndexOf(')');
          const stmtAfterHeader = headerEndIdx !== -1 ? line.substring(headerEndIdx + 1).trim() : '';

          if (stmtAfterHeader.endsWith(';')) {
            // Single-line brace-less loop
            const currentDepth = getLoopDepth();
            const lineMaxDepth = currentDepth + 1;
            if (lineMaxDepth > nonPyMaxDepth) {
              nonPyMaxDepth = lineMaxDepth;
            }
            while (scopeStack.length > 0 && !scopeStack[scopeStack.length - 1].isBlock) {
              scopeStack.pop();
            }
          } else {
            // Multi-line brace-less loop header: e.g. for (int i=0; i<n; i++)
            scopeStack.push({ isLoop: true, isBlock: false });
            const currentDepth = getLoopDepth();
            if (currentDepth > nonPyMaxDepth) {
              nonPyMaxDepth = currentDepth;
            }
          }
        }
      } else {
        // Line does NOT contain a new loop header
        if (openingBraces > 0) {
          for (let b = 0; b < openingBraces; b++) {
            if (scopeStack.length > 0 && !scopeStack[scopeStack.length - 1].isBlock) {
              scopeStack[scopeStack.length - 1].isBlock = true;
            } else {
              scopeStack.push({ isLoop: false, isBlock: true });
            }
          }
          const currentDepth = getLoopDepth();
          if (currentDepth > nonPyMaxDepth) {
            nonPyMaxDepth = currentDepth;
          }
        }

        if (hasSemicolon) {
          while (scopeStack.length > 0 && !scopeStack[scopeStack.length - 1].isBlock) {
            scopeStack.pop();
          }
        }

        if (closingBraces > 0) {
          for (let b = 0; b < closingBraces; b++) {
            while (scopeStack.length > 0 && !scopeStack[scopeStack.length - 1].isBlock) {
              scopeStack.pop();
            }
            if (scopeStack.length > 0) {
              scopeStack.pop();
            }
          }
        }
      }
    }

    loopCount = nonPyLoopCount;
    maxLoopDepth = nonPyMaxDepth;
  }


  if (language === 'python') {
    const forOrWhileLines = lines.filter((l) => /^\s*(for|while)\b/.test(l));
    loopCount = forOrWhileLines.length;

    const loopStack: number[] = [];
    let pyMaxDepth = 0;

    for (const line of lines) {
      if (!line.trim() || line.trim().startsWith('#')) continue;

      const lineIndent = line.search(/\S/);

      // Pop loops that have ended because current line is indented less than their body
      while (loopStack.length > 0 && loopStack[loopStack.length - 1] > lineIndent) {
        loopStack.pop();
      }

      const isLoopLine = /^\s*(for|while)\b/.test(line);
      if (isLoopLine) {
        // Pop sibling loops at the exact same or greater indentation level
        while (loopStack.length > 0 && loopStack[loopStack.length - 1] >= lineIndent) {
          loopStack.pop();
        }
        loopStack.push(lineIndent);
        if (loopStack.length > pyMaxDepth) {
          pyMaxDepth = loopStack.length;
        }
      }
    }

    maxLoopDepth = pyMaxDepth;
  }

  return {
    functions: Math.max(functionCount, 1),
    loops: loopCount,
    nestedLoopDepth: loopCount === 0 ? 0 : Math.max(maxLoopDepth, 1),
    conditionals: conditionalsCount,
    recursionDetected
  };
}

/**
 * Calculates Time and Space complexity estimates with fine-grained inspection of loop bounds
 */
function analyzeComplexity(
  code: string,
  language: LanguageType,
  structure: StructureMetrics
): ComplexityAnalysis {
  const lines = code.split('\n');

  // 1. Inspect inner/outer loop characteristics
  let hasConstantInnerLoop = false; // e.g. for (int j = 0; j < 10; j++)
  let hasLogarithmicInnerLoop = false; // e.g. while (x < n) { x *= 2; }
  let hasLogarithmicOuterLoop = false;
  let hasLinearInnerLoop = false;
  let hasLinearOuterLoop = false;

  // Check for constant loop bound (e.g. j < 10 or range(10) inside an outer loop)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Constant bound loop: for (int j = 0; j < 10; j++) or range(10)
    if (/for\s*\([^;]*;\s*[a-zA-Z_]\w*\s*<\s*\d+\s*;\s*[^)]*\)/.test(line) || /for\s+\w+\s+in\s+range\(\s*\d+\s*\)/.test(line)) {
      if (structure.nestedLoopDepth >= 2) {
        hasConstantInnerLoop = true;
      }
    }

    // Logarithmic step: x *= 2, x /= 2, x >>= 1
    if (/(\*=|shared_div|\/=|>>=)\s*2|\b\w+\s*=\s*\w+\s*\*|(?:\/)\s*2/.test(line)) {
      if (structure.nestedLoopDepth >= 2) {
        hasLogarithmicInnerLoop = true;
      } else {
        hasLogarithmicOuterLoop = true;
      }
    }
  }

  // Strictly check if loop is logarithmic (multiplication/division by 2) vs linear decrement (-= 2 or --)
  const isStrictlyLogarithmicLoop =
    /(\*=|shared_div|\/=|>>=)\s*2|\b\w+\s*=\s*\w+\s*[\/*]\s*2|left\s*\+=\s*mid|mid\s*=\s*left\s*\+/i.test(code) &&
    !/(-=|--)\s*2/.test(code);

  const hasSort = /\b(std::sort|Arrays\.sort|Collections\.sort|\.sort\(|sorted\()\b/.test(code);

  // Time Complexity Calculation
  let timeEstimate: TimeComplexityEstimate = 'O(1)';
  let timeConfidence: ConfidenceLevel = 'high';
  let timeExplanation = 'Code runs in constant time O(1) with no loop traversals.';

  if (structure.recursionDetected) {
    if (isStrictlyLogarithmicLoop || /\b(binarySearch|binary_search|mid)\b/i.test(code)) {
      timeEstimate = 'O(log n)';
      timeConfidence = 'medium';
      timeExplanation = 'Logarithmic time complexity O(log n) expected from recursive divide-and-conquer binary search pattern.';
    } else {
      timeEstimate = 'Unknown';
      timeConfidence = 'low';
      timeExplanation = 'Recursive behavior detected. Recursion depth and branching factor require deeper mathematical analysis.';
    }
  } else if (hasSort && structure.loops > 0) {
    timeEstimate = 'O(n log n)';
    timeConfidence = 'medium';
    timeExplanation = 'Likely O(n log n) due to sorting operation followed by linear traversal.';
  } else if (structure.nestedLoopDepth === 0) {
    timeEstimate = 'O(1)';
    timeConfidence = 'high';
    timeExplanation = 'Linear execution path with no loop iterations detected.';
  } else if (structure.nestedLoopDepth === 1) {
    if (isStrictlyLogarithmicLoop) {
      timeEstimate = 'O(log n)';
      timeConfidence = 'high';
      timeExplanation = 'Likely O(log n) time complexity from logarithmic halving step (e.g. n /= 2 or binary search).';
    } else {
      timeEstimate = 'O(n)';
      timeConfidence = 'high';
      timeExplanation = 'Likely O(n) linear time complexity with single level loop traversal.';
    }
  } else if (structure.nestedLoopDepth === 2) {
    if (hasConstantInnerLoop) {
      timeEstimate = 'O(n)';
      timeConfidence = 'high';
      timeExplanation = 'Likely O(n) because inner loop has a constant iteration bound (e.g. j < 10).';
    } else if (hasLogarithmicInnerLoop || isStrictlyLogarithmicLoop) {
      timeEstimate = 'O(n log n)';
      timeConfidence = 'high';
      timeExplanation = 'Likely O(n log n) time complexity from outer O(n) loop wrapping an inner O(log n) logarithmic loop (x *= 2).';
    } else {
      timeEstimate = 'O(n²)';
      timeConfidence = 'high';
      timeExplanation = 'Likely O(n²) quadratic time complexity caused by 2 nested loop iterations over size n.';
    }
  } else if (structure.nestedLoopDepth >= 3) {
    if (hasConstantInnerLoop) {
      timeEstimate = 'O(n²)';
      timeConfidence = 'medium';
      timeExplanation = 'Likely O(n²) because one of the nested loops has a constant bound.';
    } else {
      timeEstimate = 'O(n³+)';
      timeConfidence = 'medium';
      timeExplanation = `Likely O(n³+) cubic/polynomial complexity caused by ${structure.nestedLoopDepth} levels of nested loops.`;
    }
  }

  // 2. Space Complexity Analysis
  let spaceEstimate: SpaceComplexityEstimate = 'O(1)';
  let spaceConfidence: ConfidenceLevel = 'high';
  let spaceExplanation = 'Auxiliary space is O(1) constant with no dynamic arrays or matrix allocations.';

  const has2DArray = /\bnew\s+\w+\[[^\]]+\]\[[^\]]+\]|int\s+\w+\[[^\]]+\]\[[^\]]+\]|\[\s*\[.*\]\s*for\s+.*in\s+.*\]/.test(code);
  const has1DArray = /\bnew\s+\w+\[[^\]]+\]|int\s+\w+\[[^\]]+\]|vector<\w+>\s+\w+\([^)]+\)|\[\s*0\s*\]\s*\*\s*\w+|\bmalloc\(/.test(code);

  if (has2DArray) {
    spaceEstimate = 'O(n²)';
    spaceConfidence = 'high';
    spaceExplanation = 'Likely O(n²) auxiliary space for 2D matrix dynamic memory allocation.';
  } else if (has1DArray) {
    spaceEstimate = 'O(n)';
    spaceConfidence = 'high';
    spaceExplanation = 'Likely O(n) auxiliary space for dynamic array / list storage proportional to input size n.';
  } else if (structure.recursionDetected) {
    // If recursion depth cannot be proven, return Unknown / low confidence
    spaceEstimate = 'Unknown';
    spaceConfidence = 'low';
    spaceExplanation = 'Recursion detected. Auxiliary call stack space depends on recursion tree depth.';
  }

  return {
    time: {
      estimate: timeEstimate,
      confidence: timeConfidence,
      explanation: timeExplanation
    },
    space: {
      estimate: spaceEstimate,
      confidence: spaceConfidence,
      explanation: spaceExplanation
    }
  };
}

/**
 * Runs static analysis rules for issues and suggestions
 */
function runRuleChecks(
  code: string,
  language: LanguageType,
  structure: StructureMetrics,
  issues: AnalysisIssue[],
  suggestions: AnalysisSuggestion[]
) {
  const lines = code.split('\n');

  // Rule 1: Repeated strlen() inside loop header
  if (language === 'c' || language === 'cpp') {
    for (let i = 0; i < lines.length; i++) {
      if (/for\s*\([^;]*;[^;]*\bstrlen\s*\(/.test(lines[i])) {
        issues.push({
          id: 'repeated-strlen',
          severity: 'warning',
          category: 'performance',
          title: 'Repeated String Traversal',
          message: '`strlen()` appears inside the loop header and may recalculate string length on every iteration.',
          line: i + 1
        });
        suggestions.push({
          id: 'sug-strlen',
          title: 'Cache String Length Before Loop',
          message: 'Store `const int len = strlen(str);` in a variable before the loop to avoid recalculating it repeatedly.',
          category: 'Performance'
        });
        break;
      }
    }
  }

  // Rule 2: Potential Division By Zero
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\/\s*([a-zA-Z_]\w*)\b/.test(line) && !/if\s*\([^)]*!=.*0\)/.test(line) && !/print/.test(line)) {
      const match = /\/\s*([a-zA-Z_]\w*)\b/.exec(line);
      if (match && !['1', '2', '10', '100', '1000', '2.0'].includes(match[1])) {
        issues.push({
          id: `div-zero-${i}`,
          severity: 'warning',
          category: 'safety',
          title: 'Potential Division-by-Zero Risk',
          message: `Variable '${match[1]}' is used as a divisor. Verify that '${match[1]}' cannot evaluate to zero at runtime.`,
          line: i + 1
        });
        break;
      }
    }
  }

  // Rule 3: Precise Array Out-of-Bounds Analysis
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\[\s*([a-zA-Z_]\w*)\s*\+\s*1\s*\]/.test(line)) {
      // Search for loop header condition
      let loopHeader = '';
      for (let k = Math.max(0, i - 3); k <= i; k++) {
        if (lines[k].includes('for') || lines[k].includes('while')) {
          loopHeader += lines[k];
        }
      }

      // Check if loop condition explicitly guards i < n - 1
      if (/<\s*[a-zA-Z_]\w*\s*-\s*1/.test(loopHeader) || /<\s*len\s*-\s*1/.test(loopHeader)) {
        issues.push({
          id: `out-of-bounds-safe-${i}`,
          severity: 'info',
          category: 'safety',
          title: 'Boundary-Sensitive Access',
          message: 'Possible boundary-sensitive access: `i + 1` is guarded by `i < n - 1` condition. Verify index remains within valid range.',
          line: i + 1
        });
      } else {
        issues.push({
          id: `out-of-bounds-unsafe-${i}`,
          severity: 'warning',
          category: 'safety',
          title: 'Potential Out-of-Bounds Access',
          message: 'Potential out-of-bounds access: `i + 1` may reach index `n` when `i == n - 1`. Consider using `i < n - 1`.',
          line: i + 1
        });
      }
      break;
    }
  }

  // Rule 4: Nested loop complexity suggestion
  if (structure.nestedLoopDepth >= 2) {
    suggestions.push({
      id: 'sug-nested-loops',
      title: 'Optimize Nested Traversal',
      message: `This code has a nested loop depth of ${structure.nestedLoopDepth}. Consider if a hash map, frequency array, or two-pointer approach can reduce time complexity.`,
      category: 'Complexity'
    });
  }
}

/**
 * Detects common DSA algorithmic patterns with high precision (avoiding false positives)
 */
function detectDSAPatterns(code: string, language: LanguageType): DSAPatternHint[] {
  const patterns: DSAPatternHint[] = [];

  // Check for Binary Search vs Two Pointers
  const hasBinarySearchMid =
    /\b(mid|middle)\s*=\s*/.test(code) ||
    /left\s*\+\s*\(\s*right\s*-\s*left\s*\)\s*\/\s*2/.test(code) ||
    /\(low\s*\+\s*high\)\s*\/\/\s*2/.test(code) ||
    /\b(binary_search|binarySearch)\b/.test(code);

  const hasTwoPointerMovement =
    (/left\+\+/.test(code) && /right--/.test(code)) ||
    (/start\+\+/.test(code) && /end--/.test(code)) ||
    (/i\+\+/.test(code) && /j--/.test(code));

  // 1. Binary Search Pattern
  if (hasBinarySearchMid) {
    patterns.push({
      id: 'dsa-binary-search',
      name: 'Binary Search',
      description: 'Binary Search divide-and-conquer pattern detected (midpoint calculation with left/right boundary variables).'
    });
  }

  // 2. Two Pointers Pattern (only report when true two-pointer movement exists and not overridden by binary search mid)
  if (hasTwoPointerMovement && !hasBinarySearchMid) {
    patterns.push({
      id: 'dsa-two-pointers',
      name: 'Two Pointers',
      description: 'Two-pointer traversal pattern detected (pointers moving towards each other from opposite ends).'
    });
  }

  // 3. Frequency Counting / Hash Map Pattern
  if (
    /\[\s*([a-zA-Z_]\w*)\s*\]\s*\+\+|\b(unordered_map|HashMap|dict)\b/i.test(code) ||
    /\.get\([^)]+,\s*0\)\s*\+\s*1/.test(code)
  ) {
    patterns.push({
      id: 'dsa-freq-counter',
      name: 'Frequency Counting / Hash Map',
      description: 'Frequency counting array or hash map pattern detected for tracking element occurrences.'
    });
  }

  // 4. Sliding Window Pattern
  if (
    (/\bwindow\b/i.test(code) || /\b(win_sum|current_sum|curr_sum)\b/.test(code)) &&
    /for|while/.test(code)
  ) {
    patterns.push({
      id: 'dsa-sliding-window',
      name: 'Sliding Window',
      description: 'Sliding window pattern detected for continuous range computation.'
    });
  }

  // 5. Sorting + Traversal Pattern
  if (
    /\b(std::sort|Arrays\.sort|Collections\.sort|\.sort\(|sorted\()\b/.test(code) &&
    /\b(for|while)\b/.test(code)
  ) {
    patterns.push({
      id: 'dsa-sort-traverse',
      name: 'Sorting + Traversal',
      description: 'Sorting + traversal pattern detected (preprocessing sequence into ordered state before linear pass).'
    });
  }

  return patterns;
}
