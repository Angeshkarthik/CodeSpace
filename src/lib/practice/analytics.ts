import { PracticeProblem, PracticeAttempt, PracticeDifficulty, AttemptOutcome } from './types';
import { LanguageType } from '@/types';

export interface OverallMetrics {
  totalProblems: number;
  solvedProblems: number;
  inProgressProblems: number;
  notStartedProblems: number;
  attemptedProblems: number;
  solveRate: number; // 0-100 percentage
  totalAttempts: number;
  averageAttemptsPerProblem: number;
  averageAttemptsToSolve: number;
}

export interface DifficultyMetric {
  difficulty: PracticeDifficulty;
  total: number;
  solved: number;
  inProgress: number;
  notStarted: number;
  attempts: number;
  attempted: number;
  solveRate: number; // 0-100 percentage
}

export interface TopicMetric {
  topic: string;
  problemCount: number;
  solvedCount: number;
  attemptCount: number;
  attemptedCount: number;
  solveRate: number; // 0-100 percentage
}

export interface OutcomeDistribution {
  solved: number;
  failed: number;
  incomplete: number;
  total: number;
  solvedRate: number; // percentage of attempts
}

export interface TimelineEntry {
  date: string; // YYYY-MM-DD
  timestamp: number; // Start of day timestamp
  total: number;
  solved: number;
  failed: number;
  incomplete: number;
}

export interface DSAPatternMetric {
  pattern: string;
  count: number;
  percentage: number; // percentage of total attempts with patterns
}

export interface LanguageBenchmarkInsight {
  language: LanguageType;
  attemptCount: number;
  averageMs: number;
  fastestMs: number;
  slowestMs: number;
}

export interface BenchmarkInsights {
  benchmarkedAttempts: number;
  averageRuntimeMs: number;
  fastestRuntimeMs: number;
  slowestRuntimeMs: number;
  byLanguage: LanguageBenchmarkInsight[];
}

export interface PracticeAnalyticsData {
  overall: OverallMetrics;
  difficulty: Record<PracticeDifficulty, DifficultyMetric>;
  topics: TopicMetric[];
  outcomes: OutcomeDistribution;
  timeline: TimelineEntry[];
  dsaPatterns: DSAPatternMetric[];
  benchmarks: BenchmarkInsights;
}

/**
 * Pure, deterministic analytics aggregator function for CodeSpace Practice Workspace.
 * Safely handles empty datasets, unlinked programs, missing evidence, and edge cases.
 * Never returns NaN, Infinity, or unhandled errors.
 */
export function calculatePracticeAnalytics(
  problems: PracticeProblem[] = [],
  attempts: PracticeAttempt[] = []
): PracticeAnalyticsData {
  const safeProblems = Array.isArray(problems) ? problems : [];
  const safeAttempts = Array.isArray(attempts) ? attempts : [];

  // Map problems for fast lookup
  const problemMap = new Map<string, PracticeProblem>();
  safeProblems.forEach((p) => {
    if (p && p.uuid) problemMap.set(p.uuid, p);
  });

  // Unique problems that have at least 1 attempt or non-'Not Started' status
  const attemptedProblemUuids = new Set<string>();
  safeAttempts.forEach((a) => {
    if (a && a.practiceProblemUuid) {
      attemptedProblemUuids.add(a.practiceProblemUuid);
    }
  });

  safeProblems.forEach((p) => {
    if (p && (p.status === 'Solved' || p.status === 'In Progress')) {
      attemptedProblemUuids.add(p.uuid);
    }
  });

  // 1. OVERALL METRICS
  const totalProblems = safeProblems.length;
  let solvedProblems = 0;
  let inProgressProblems = 0;
  let notStartedProblems = 0;

  safeProblems.forEach((p) => {
    if (p.status === 'Solved') solvedProblems++;
    else if (p.status === 'In Progress') inProgressProblems++;
    else notStartedProblems++;
  });

  const attemptedProblems = attemptedProblemUuids.size;
  const rawSolveRate = attemptedProblems > 0 ? (solvedProblems / attemptedProblems) * 100 : 0;
  const solveRate = Number.isFinite(rawSolveRate) ? Math.round(rawSolveRate * 10) / 10 : 0;

  const totalAttempts = safeAttempts.length;
  const rawAvgAttempts = attemptedProblems > 0 ? totalAttempts / attemptedProblems : 0;
  const averageAttemptsPerProblem = Number.isFinite(rawAvgAttempts)
    ? Math.round(rawAvgAttempts * 10) / 10
    : 0;

  // Average attempts required to solve a problem
  const solvedProblemUuids = new Set(
    safeProblems.filter((p) => p.status === 'Solved').map((p) => p.uuid)
  );

  const solvedAttemptsMap = new Map<string, number>();
  safeAttempts.forEach((a) => {
    if (a && a.practiceProblemUuid && solvedProblemUuids.has(a.practiceProblemUuid)) {
      solvedAttemptsMap.set(
        a.practiceProblemUuid,
        (solvedAttemptsMap.get(a.practiceProblemUuid) || 0) + 1
      );
    }
  });

  let totalAttemptsForSolved = 0;
  let solvedProblemCountWithAttempts = 0;

  solvedAttemptsMap.forEach((count) => {
    totalAttemptsForSolved += count;
    solvedProblemCountWithAttempts++;
  });

  const rawAvgToSolve =
    solvedProblemCountWithAttempts > 0
      ? totalAttemptsForSolved / solvedProblemCountWithAttempts
      : 0;
  const averageAttemptsToSolve = Number.isFinite(rawAvgToSolve)
    ? Math.round(rawAvgToSolve * 10) / 10
    : 0;

  const overall: OverallMetrics = {
    totalProblems,
    solvedProblems,
    inProgressProblems,
    notStartedProblems,
    attemptedProblems,
    solveRate,
    totalAttempts,
    averageAttemptsPerProblem,
    averageAttemptsToSolve,
  };

  // 2. DIFFICULTY METRICS
  const difficulties: PracticeDifficulty[] = ['Easy', 'Medium', 'Hard'];
  const difficultyMap: Record<PracticeDifficulty, DifficultyMetric> = {
    Easy: { difficulty: 'Easy', total: 0, solved: 0, inProgress: 0, notStarted: 0, attempts: 0, attempted: 0, solveRate: 0 },
    Medium: { difficulty: 'Medium', total: 0, solved: 0, inProgress: 0, notStarted: 0, attempts: 0, attempted: 0, solveRate: 0 },
    Hard: { difficulty: 'Hard', total: 0, solved: 0, inProgress: 0, notStarted: 0, attempts: 0, attempted: 0, solveRate: 0 },
  };

  const difficultyAttemptedUuids: Record<PracticeDifficulty, Set<string>> = {
    Easy: new Set(),
    Medium: new Set(),
    Hard: new Set(),
  };

  safeProblems.forEach((p) => {
    const diff = difficulties.includes(p.difficulty) ? p.difficulty : 'Medium';
    difficultyMap[diff].total++;
    if (p.status === 'Solved') {
      difficultyMap[diff].solved++;
      difficultyAttemptedUuids[diff].add(p.uuid);
    } else if (p.status === 'In Progress') {
      difficultyMap[diff].inProgress++;
      difficultyAttemptedUuids[diff].add(p.uuid);
    } else {
      difficultyMap[diff].notStarted++;
    }
  });

  safeAttempts.forEach((a) => {
    if (!a || !a.practiceProblemUuid) return;
    const prob = problemMap.get(a.practiceProblemUuid);
    const diff = prob && difficulties.includes(prob.difficulty) ? prob.difficulty : 'Medium';
    difficultyMap[diff].attempts++;
    difficultyAttemptedUuids[diff].add(a.practiceProblemUuid);
  });

  difficulties.forEach((diff) => {
    const attemptedCount = difficultyAttemptedUuids[diff].size;
    difficultyMap[diff].attempted = attemptedCount;
    const solved = difficultyMap[diff].solved;
    const rawRate = attemptedCount > 0 ? (solved / attemptedCount) * 100 : 0;
    difficultyMap[diff].solveRate = Number.isFinite(rawRate) ? Math.round(rawRate * 10) / 10 : 0;
  });

  // 3. TOPIC MASTERY
  const topicAggMap = new Map<
    string,
    { topic: string; problemCount: number; solvedCount: number; attemptCount: number; attemptedUuids: Set<string> }
  >();

  safeProblems.forEach((p) => {
    const rawTopic = (p.topic || 'General').trim();
    const topicKey = rawTopic.toLowerCase();
    if (!topicAggMap.has(topicKey)) {
      topicAggMap.set(topicKey, {
        topic: rawTopic || 'General',
        problemCount: 0,
        solvedCount: 0,
        attemptCount: 0,
        attemptedUuids: new Set(),
      });
    }
    const item = topicAggMap.get(topicKey)!;
    item.problemCount++;
    if (p.status === 'Solved') {
      item.solvedCount++;
      item.attemptedUuids.add(p.uuid);
    } else if (p.status === 'In Progress') {
      item.attemptedUuids.add(p.uuid);
    }
  });

  safeAttempts.forEach((a) => {
    if (!a || !a.practiceProblemUuid) return;
    const prob = problemMap.get(a.practiceProblemUuid);
    const rawTopic = (prob?.topic || 'General').trim();
    const topicKey = rawTopic.toLowerCase();
    if (!topicAggMap.has(topicKey)) {
      topicAggMap.set(topicKey, {
        topic: rawTopic || 'General',
        problemCount: 0,
        solvedCount: 0,
        attemptCount: 0,
        attemptedUuids: new Set(),
      });
    }
    const item = topicAggMap.get(topicKey)!;
    item.attemptCount++;
    item.attemptedUuids.add(a.practiceProblemUuid);
  });

  const topics: TopicMetric[] = [];
  topicAggMap.forEach((val) => {
    const attemptedCount = val.attemptedUuids.size;
    const rawRate = attemptedCount > 0 ? (val.solvedCount / attemptedCount) * 100 : 0;
    topics.push({
      topic: val.topic,
      problemCount: val.problemCount,
      solvedCount: val.solvedCount,
      attemptCount: val.attemptCount,
      attemptedCount,
      solveRate: Number.isFinite(rawRate) ? Math.round(rawRate * 10) / 10 : 0,
    });
  });

  topics.sort((a, b) => b.problemCount - a.problemCount || b.attemptCount - a.attemptCount);

  // 4. ATTEMPT OUTCOMES
  let solvedAttempts = 0;
  let failedAttempts = 0;
  let incompleteAttempts = 0;

  safeAttempts.forEach((a) => {
    if (a.outcome === 'Solved') solvedAttempts++;
    else if (a.outcome === 'Failed') failedAttempts++;
    else incompleteAttempts++;
  });

  const rawOutcomeRate = totalAttempts > 0 ? (solvedAttempts / totalAttempts) * 100 : 0;
  const outcomes: OutcomeDistribution = {
    solved: solvedAttempts,
    failed: failedAttempts,
    incomplete: incompleteAttempts,
    total: totalAttempts,
    solvedRate: Number.isFinite(rawOutcomeRate) ? Math.round(rawOutcomeRate * 10) / 10 : 0,
  };

  // 5. ATTEMPT TIMELINE (by Date YYYY-MM-DD)
  const timelineMap = new Map<string, { date: string; timestamp: number; total: number; solved: number; failed: number; incomplete: number }>();

  safeAttempts.forEach((a) => {
    if (!a || !a.createdAt) return;
    const d = new Date(a.createdAt);
    if (isNaN(d.getTime())) return;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    if (!timelineMap.has(dateStr)) {
      const startOfDay = new Date(year, d.getMonth(), d.getDate()).getTime();
      timelineMap.set(dateStr, {
        date: dateStr,
        timestamp: startOfDay,
        total: 0,
        solved: 0,
        failed: 0,
        incomplete: 0,
      });
    }

    const entry = timelineMap.get(dateStr)!;
    entry.total++;
    if (a.outcome === 'Solved') entry.solved++;
    else if (a.outcome === 'Failed') entry.failed++;
    else entry.incomplete++;
  });

  const timeline: TimelineEntry[] = Array.from(timelineMap.values()).sort(
    (a, b) => b.timestamp - a.timestamp
  );

  // 6. DSA PATTERN FREQUENCY
  const patternCountMap = new Map<string, number>();
  let attemptsWithPatterns = 0;

  safeAttempts.forEach((a) => {
    if (!a) return;
    const extractedPatterns = new Set<string>();

    if (Array.isArray(a.patterns)) {
      a.patterns.forEach((p) => {
        if (p && typeof p === 'string') extractedPatterns.add(p.trim());
      });
    }

    if (a.analysis?.dsaPatterns && Array.isArray(a.analysis.dsaPatterns)) {
      a.analysis.dsaPatterns.forEach((p) => {
        if (p && p.name && typeof p.name === 'string') extractedPatterns.add(p.name.trim());
      });
    }

    if (extractedPatterns.size > 0) {
      attemptsWithPatterns++;
      extractedPatterns.forEach((pat) => {
        patternCountMap.set(pat, (patternCountMap.get(pat) || 0) + 1);
      });
    }
  });

  const dsaPatterns: DSAPatternMetric[] = [];
  patternCountMap.forEach((count, pattern) => {
    const rawPct = attemptsWithPatterns > 0 ? (count / attemptsWithPatterns) * 100 : 0;
    dsaPatterns.push({
      pattern,
      count,
      percentage: Number.isFinite(rawPct) ? Math.round(rawPct * 10) / 10 : 0,
    });
  });

  dsaPatterns.sort((a, b) => b.count - a.count);

  // 7. BENCHMARK INSIGHTS
  let benchmarkedAttempts = 0;
  let totalRuntimeSumMs = 0;
  let overallFastestMs = Infinity;
  let overallSlowestMs = -Infinity;

  const langBenchmarkMap = new Map<
    LanguageType,
    { count: number; sumMs: number; fastestMs: number; slowestMs: number }
  >();

  safeAttempts.forEach((a) => {
    if (!a || !a.benchmark) return;
    const bm = a.benchmark;
    if (bm.status !== 'completed' && bm.successfulRuns === 0) return;

    let avg: number | undefined = bm.averageMs;
    if (avg === undefined || avg === null || !Number.isFinite(avg)) {
      if (Array.isArray(bm.timingsMs) && bm.timingsMs.length > 0) {
        const validTimings = bm.timingsMs.filter((t) => typeof t === 'number' && Number.isFinite(t));
        if (validTimings.length > 0) {
          const sum = validTimings.reduce((acc, curr) => acc + curr, 0);
          avg = sum / validTimings.length;
        } else {
          avg = undefined;
        }
      } else {
        avg = undefined;
      }
    }
    if (avg === undefined || avg === null || !Number.isFinite(avg)) return;

    benchmarkedAttempts++;
    totalRuntimeSumMs += avg;

    const fast = bm.fastestMs ?? avg;
    const slow = bm.slowestMs ?? avg;

    if (fast < overallFastestMs) overallFastestMs = fast;
    if (slow > overallSlowestMs) overallSlowestMs = slow;

    const lang = a.language || bm.language || 'c';
    if (!langBenchmarkMap.has(lang)) {
      langBenchmarkMap.set(lang, { count: 0, sumMs: 0, fastestMs: Infinity, slowestMs: -Infinity });
    }

    const langStat = langBenchmarkMap.get(lang)!;
    langStat.count++;
    langStat.sumMs += avg;
    if (fast < langStat.fastestMs) langStat.fastestMs = fast;
    if (slow > langStat.slowestMs) langStat.slowestMs = slow;
  });

  const averageRuntimeMs =
    benchmarkedAttempts > 0 && Number.isFinite(totalRuntimeSumMs / benchmarkedAttempts)
      ? Math.round((totalRuntimeSumMs / benchmarkedAttempts) * 10) / 10
      : 0;

  const fastestRuntimeMs =
    benchmarkedAttempts > 0 && Number.isFinite(overallFastestMs)
      ? Math.round(overallFastestMs * 10) / 10
      : 0;

  const slowestRuntimeMs =
    benchmarkedAttempts > 0 && Number.isFinite(overallSlowestMs)
      ? Math.round(overallSlowestMs * 10) / 10
      : 0;

  const byLanguage: LanguageBenchmarkInsight[] = [];
  langBenchmarkMap.forEach((stat, lang) => {
    const avgMs = stat.count > 0 ? stat.sumMs / stat.count : 0;
    byLanguage.push({
      language: lang,
      attemptCount: stat.count,
      averageMs: Number.isFinite(avgMs) ? Math.round(avgMs * 10) / 10 : 0,
      fastestMs: Number.isFinite(stat.fastestMs) ? Math.round(stat.fastestMs * 10) / 10 : 0,
      slowestMs: Number.isFinite(stat.slowestMs) ? Math.round(stat.slowestMs * 10) / 10 : 0,
    });
  });

  byLanguage.sort((a, b) => b.attemptCount - a.attemptCount);

  const benchmarks: BenchmarkInsights = {
    benchmarkedAttempts,
    averageRuntimeMs,
    fastestRuntimeMs,
    slowestRuntimeMs,
    byLanguage,
  };

  return {
    overall,
    difficulty: difficultyMap,
    topics,
    outcomes,
    timeline,
    dsaPatterns,
    benchmarks,
  };
}
