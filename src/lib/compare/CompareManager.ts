import { analyzeCode } from '@/lib/analysis/Analyzer';
import { CodeAnalysisResult } from '@/lib/analysis/types';
import {
  CodeSnapshot,
  FullComparisonResult,
  ComplexityComparison,
  BenchmarkComparison,
  ComparisonSummaryItem,
  ComplexityChangeType,
  SpaceChangeType,
  RuntimeChangeType,
} from './types';

/** Standard asymptotic complexity ranking for comparison */
const COMPLEXITY_RANKS: Record<string, number> = {
  'O(1)': 1,
  'O(log n)': 2,
  'O(n)': 3,
  'O(n log n)': 4,
  'O(n²)': 5,
  'O(n^2)': 5,
  'O(n³+)': 6,
  'O(n^3)': 6,
  'O(2^n)': 7,
  'O(n!)': 8,
};

function getComplexityRank(notation: string): number {
  const norm = notation.trim();
  if (COMPLEXITY_RANKS[norm] !== undefined) {
    return COMPLEXITY_RANKS[norm];
  }
  // Fallback heuristics
  if (norm.includes('n!')) return 8;
  if (norm.includes('2^n')) return 7;
  if (norm.includes('n³') || norm.includes('n^3')) return 6;
  if (norm.includes('n²') || norm.includes('n^2')) return 5;
  if (norm.includes('n log n')) return 4;
  if (norm.includes('O(n)')) return 3;
  if (norm.includes('log')) return 2;
  if (norm.includes('O(1)')) return 1;
  return 99; // Unknown
}

/**
 * Pure service function to perform deterministic comparison between two code snapshots.
 */
export function compareSnapshots(
  snapshotA: CodeSnapshot,
  snapshotB: CodeSnapshot,
  currentCode?: string
): FullComparisonResult {
  const languageMatch = snapshotA.language === snapshotB.language;

  // Run or reuse deterministic static code analysis
  const analysisA: CodeAnalysisResult =
    snapshotA.analysis ?? analyzeCode(snapshotA.language, snapshotA.code);
  const analysisB: CodeAnalysisResult =
    snapshotB.analysis ?? analyzeCode(snapshotB.language, snapshotB.code);

  const dsaPatternsA = analysisA.dsaPatterns.map((p) => p.name);
  const dsaPatternsB = analysisB.dsaPatterns.map((p) => p.name);

  // Check stale condition: if current code was provided and modified since snapshotB was captured
  const isStale = currentCode !== undefined && snapshotB.code !== currentCode;

  // 1. Language mismatch handling
  if (!languageMatch) {
    return {
      snapshotA,
      snapshotB,
      languageMatch: false,
      analysisA,
      analysisB,
      complexity: {
        versionATime: analysisA.complexity.time.estimate,
        versionBTime: analysisB.complexity.time.estimate,
        timeChange: 'unknown',
        timeSummary: 'Comparison requires both versions to use the same language.',
        versionASpace: analysisA.complexity.space.estimate,
        versionBSpace: analysisB.complexity.space.estimate,
        spaceChange: 'unknown',
        spaceSummary: 'Comparison requires both versions to use the same language.',
      },
      benchmark: {
        isComparable: false,
        uncomparableReason: 'Comparison requires both versions to use the same language.',
      },
      dsaPatternsA,
      dsaPatternsB,
      summaryItems: [
        {
          icon: 'alert',
          type: 'time',
          label: 'Language Mismatch',
          detail: `Version A (${snapshotA.language.toUpperCase()}) and Version B (${snapshotB.language.toUpperCase()}) use different languages. Performance comparison is disabled.`,
          variant: 'warning',
        },
      ],
      isStale,
    };
  }

  // 2. Complexity Comparison
  const timeEstA = analysisA.complexity.time.estimate;
  const timeEstB = analysisB.complexity.time.estimate;
  const rankATime = getComplexityRank(timeEstA);
  const rankBTime = getComplexityRank(timeEstB);

  let timeChange: ComplexityChangeType = 'unknown';
  let timeSummary = 'No asymptotic time-complexity change detected.';

  if (rankATime !== 99 && rankBTime !== 99) {
    if (rankATime > rankBTime) {
      timeChange = 'improved';
      timeSummary = `Time complexity improved: ${timeEstA} → ${timeEstB}`;
    } else if (rankATime < rankBTime) {
      timeChange = 'regressed';
      timeSummary = `Time complexity regressed: ${timeEstA} → ${timeEstB}`;
    } else {
      timeChange = 'unchanged';
      timeSummary = `No asymptotic time-complexity change detected (${timeEstA}).`;
    }
  } else {
    timeSummary = `${timeEstA} → ${timeEstB}`;
  }

  const spaceEstA = analysisA.complexity.space.estimate;
  const spaceEstB = analysisB.complexity.space.estimate;
  const rankASpace = getComplexityRank(spaceEstA);
  const rankBSpace = getComplexityRank(spaceEstB);

  let spaceChange: SpaceChangeType = 'unknown';
  let spaceSummary = 'Auxiliary space unchanged.';

  if (rankASpace !== 99 && rankBSpace !== 99) {
    if (rankASpace > rankBSpace) {
      spaceChange = 'decreased';
      spaceSummary = `Auxiliary space decreased: ${spaceEstA} → ${spaceEstB}`;
    } else if (rankASpace < rankBSpace) {
      spaceChange = 'increased';
      spaceSummary = `Auxiliary space increased: ${spaceEstA} → ${spaceEstB}`;
    } else {
      spaceChange = 'unchanged';
      spaceSummary = `Auxiliary space unchanged (${spaceEstA}).`;
    }
  } else {
    spaceSummary = `${spaceEstA} → ${spaceEstB}`;
  }

  const complexityComp: ComplexityComparison = {
    versionATime: timeEstA,
    versionBTime: timeEstB,
    versionAConfidence: analysisA.complexity.time.confidence,
    versionBConfidence: analysisB.complexity.time.confidence,
    timeChange,
    timeSummary,
    versionASpace: spaceEstA,
    versionBSpace: spaceEstB,
    spaceChange,
    spaceSummary,
  };

  // 3. Benchmark Comparability Check
  const benchA = snapshotA.benchmark;
  const benchB = snapshotB.benchmark;

  let benchmarkComp: BenchmarkComparison = {
    isComparable: false,
  };

  if (!benchA && !benchB) {
    benchmarkComp = {
      isComparable: false,
      uncomparableReason: 'No benchmark evidence available for either version.',
    };
  } else if (!benchA || !benchB) {
    const missingVer = !benchA ? 'Version A (snapshot)' : 'Version B (current code)';
    const reasonText = !benchA
      ? 'Version A has no stored benchmark data. Direct benchmark comparison is available only when both versions have recorded benchmark evidence.'
      : 'Version B (current code) has no recorded benchmark data. Use "Benchmark Current Code" to generate benchmark evidence for Version B.';
    benchmarkComp = {
      isComparable: false,
      uncomparableReason: reasonText,
      versionAAvgMs: benchA?.averageMs,
      versionAMedianMs: benchA?.medianMs,
      versionBAvgMs: benchB?.averageMs,
      versionBMedianMs: benchB?.medianMs,
    };
  } else {
    // Both benchmarks exist. Verify comparability conditions.
    const inputA = (snapshotA.input ?? '').trim();
    const inputB = (snapshotB.input ?? '').trim();
    const modeA = snapshotA.mode ?? benchA.executionMode;
    const modeB = snapshotB.mode ?? benchB.executionMode;

    if (inputA !== inputB) {
      benchmarkComp = {
        isComparable: false,
        uncomparableReason: 'Different inputs — runtime comparison unavailable.',
        versionAAvgMs: benchA.averageMs,
        versionAMedianMs: benchA.medianMs,
        versionBAvgMs: benchB.averageMs,
        versionBMedianMs: benchB.medianMs,
      };

    } else if (benchA.successfulRuns === 0 || benchB.successfulRuns === 0) {
      benchmarkComp = {
        isComparable: false,
        uncomparableReason: 'Benchmark results incomplete or failed — runtime comparison unavailable.',
        versionAAvgMs: benchA.averageMs,
        versionAMedianMs: benchA.medianMs,
        versionBAvgMs: benchB.averageMs,
        versionBMedianMs: benchB.medianMs,
      };
    } else if (benchA.averageMs !== undefined && benchB.averageMs !== undefined) {
      const avgA = benchA.averageMs;
      const avgB = benchB.averageMs;

      const diffPercent = avgA > 0 ? ((avgB - avgA) / avgA) * 100 : 0;
      let runtimeChange: RuntimeChangeType = 'unchanged';
      let summary = 'Observed average runtime unchanged.';

      if (diffPercent < -0.5) {
        runtimeChange = 'faster';
        summary = `Observed runtime decreased (~${Math.abs(Math.round(diffPercent))}% lower average runtime).`;
      } else if (diffPercent > 0.5) {
        runtimeChange = 'slower';
        summary = `Observed runtime increased (~${Math.round(diffPercent)}% higher average runtime).`;
      }

      benchmarkComp = {
        isComparable: true,
        versionAAvgMs: avgA,
        versionAMedianMs: benchA.medianMs,
        versionBAvgMs: avgB,
        versionBMedianMs: benchB.medianMs,
        diffPercent,
        runtimeChange,
        summary,
      };
    }
  }

  // 4. Test & Execution Comparison
  const testA = snapshotA.tests;
  const testB = snapshotB.tests;
  const testComparison =
    testA || testB
      ? {
          versionAPassed: testA?.passed,
          versionATotal: testA?.total,
          versionBPassed: testB?.passed,
          versionBTotal: testB?.total,
          summary:
            testA && testB
              ? `Tests: ${testA.passed}/${testA.total} passed → ${testB.passed}/${testB.total} passed`
              : 'Test evidence partially available.',
        }
      : undefined;

  const execA = snapshotA.execution;
  const execB = snapshotB.execution;
  const executionComparison =
    execA || execB
      ? {
          versionAStatus: execA ? (execA.status === 'success' ? 'Success' : execA.status) : undefined,
          versionBStatus: execB ? (execB.status === 'success' ? 'Success' : execB.status) : undefined,
        }
      : undefined;

  // 5. Summary Generation
  const summaryItems: ComparisonSummaryItem[] = [];

  // Time Complexity Summary
  if (timeChange === 'improved') {
    summaryItems.push({
      icon: 'check',
      type: 'time',
      label: 'Time Complexity',
      detail: `Improved from ${timeEstA} to ${timeEstB}`,
      variant: 'success',
    });
  } else if (timeChange === 'regressed') {
    summaryItems.push({
      icon: 'alert',
      type: 'time',
      label: 'Time Complexity',
      detail: `Regressed from ${timeEstA} to ${timeEstB}`,
      variant: 'warning',
    });
  } else {
    summaryItems.push({
      icon: 'info',
      type: 'time',
      label: 'Time Complexity',
      detail: `Unchanged (${timeEstA})`,
      variant: 'neutral',
    });
  }

  // Space Complexity Summary
  if (spaceChange === 'decreased') {
    summaryItems.push({
      icon: 'check',
      type: 'space',
      label: 'Auxiliary Space',
      detail: `Decreased from ${spaceEstA} to ${spaceEstB}`,
      variant: 'success',
    });
  } else if (spaceChange === 'increased') {
    summaryItems.push({
      icon: 'alert',
      type: 'space',
      label: 'Auxiliary Space',
      detail: `Increased from ${spaceEstA} to ${spaceEstB}`,
      variant: 'warning',
    });
  } else {
    summaryItems.push({
      icon: 'info',
      type: 'space',
      label: 'Auxiliary Space',
      detail: `Unchanged (${spaceEstA})`,
      variant: 'neutral',
    });
  }

  // Benchmark Summary
  if (benchmarkComp.isComparable && benchmarkComp.summary) {
    const isFaster = benchmarkComp.runtimeChange === 'faster';
    const isSlower = benchmarkComp.runtimeChange === 'slower';
    summaryItems.push({
      icon: isFaster ? 'check' : isSlower ? 'alert' : 'info',
      type: 'runtime',
      label: 'Observed Runtime',
      detail: benchmarkComp.summary,
      variant: isFaster ? 'success' : isSlower ? 'warning' : 'neutral',
    });
  }

  // DSA Pattern Summary
  const patternsAStr = dsaPatternsA.join(', ') || 'Standard logic';
  const patternsBStr = dsaPatternsB.join(', ') || 'Standard logic';
  if (patternsAStr !== patternsBStr) {
    summaryItems.push({
      icon: 'info',
      type: 'dsa',
      label: 'DSA Approach',
      detail: `Pattern shift: [${patternsAStr}] → [${patternsBStr}]`,
      variant: 'neutral',
    });
  }

  // Test Summary
  if (testA && testB) {
    const testSuccess = testB.passed > testA.passed;
    summaryItems.push({
      icon: testSuccess ? 'check' : 'info',
      type: 'test',
      label: 'Test Results',
      detail: `${testA.passed}/${testA.total} passed → ${testB.passed}/${testB.total} passed`,
      variant: testSuccess ? 'success' : 'neutral',
    });
  }

  return {
    snapshotA,
    snapshotB,
    languageMatch: true,
    analysisA,
    analysisB,
    complexity: complexityComp,
    benchmark: benchmarkComp,
    dsaPatternsA,
    dsaPatternsB,
    testComparison,
    executionComparison,
    summaryItems,
    isStale,
  };
}
