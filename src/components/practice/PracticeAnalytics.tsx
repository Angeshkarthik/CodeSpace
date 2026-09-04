'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Target,
  TrendingUp,
  Zap,
  Clock,
  Search,
  Activity,
  Award,
  Layers,
  Sparkles,
  Flame,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { PracticeProblem, PracticeAttempt, PracticeDifficulty } from '@/lib/practice/types';
import { calculatePracticeAnalytics } from '@/lib/practice/analytics';

interface PracticeAnalyticsProps {
  problems: PracticeProblem[];
  attempts: PracticeAttempt[];
  onFilterByDifficulty?: (difficulty: PracticeDifficulty) => void;
  onFilterByTopic?: (topic: string) => void;
}

export const PracticeAnalytics: React.FC<PracticeAnalyticsProps> = ({
  problems,
  attempts,
  onFilterByDifficulty,
  onFilterByTopic,
}) => {
  const [topicSearch, setTopicSearch] = useState('');

  // Derived analytics calculated deterministically
  const analytics = useMemo(() => {
    return calculatePracticeAnalytics(problems, attempts);
  }, [problems, attempts]);

  const { overall, difficulty, topics, outcomes, timeline, dsaPatterns, benchmarks } = analytics;

  // Filter topics based on search query
  const filteredTopics = useMemo(() => {
    if (!topicSearch.trim()) return topics;
    const query = topicSearch.toLowerCase().trim();
    return topics.filter((t) => t.topic.toLowerCase().includes(query));
  }, [topics, topicSearch]);

  const getDifficultyBadgeColor = (diff: PracticeDifficulty) => {
    switch (diff) {
      case 'Easy':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Hard':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
  };

  const getDifficultyBarColor = (diff: PracticeDifficulty) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500';
      case 'Medium':
        return 'bg-amber-500';
      case 'Hard':
        return 'bg-rose-500';
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. TOP SUMMARY METRICS */}
      <div className="bg-surface rounded-xl p-6 border border-subtle/50 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {/* Total Problems */}
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Total Problems</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-primary">{overall.totalProblems}</span>
          </div>
          <span className="text-[11px] text-muted mt-1 truncate">
            {overall.solvedProblems} solved · {overall.inProgressProblems} active
          </span>
        </div>

        {/* Solved Problems */}
        <div className="flex flex-col md:border-l border-subtle md:pl-6">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Problems Solved</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-emerald-400">{overall.solvedProblems}</span>
            <span className="text-sm font-medium text-secondary">/ {overall.totalProblems}</span>
          </div>
        </div>

        {/* Solve Rate */}
        <div className="flex flex-col md:border-l border-subtle md:pl-6">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Solve Accuracy</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-primary">{overall.solveRate}%</span>
          </div>
          <span className="text-[11px] text-muted mt-1 truncate">
            {overall.attemptedProblems} attempted
          </span>
        </div>

        {/* Total Attempts */}
        <div className="flex flex-col md:border-l border-subtle md:pl-6">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Total Attempts</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-primary">{overall.totalAttempts}</span>
          </div>
          <span className="text-[11px] text-muted mt-1 truncate">
            {outcomes.solved} passed attempts
          </span>
        </div>

        {/* Avg Attempts per Problem */}
        <div className="flex flex-col md:border-l border-subtle md:pl-6">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1">Avg Attempts / Solved</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-primary">{overall.averageAttemptsToSolve}</span>
          </div>
          <span className="text-[11px] text-muted mt-1 truncate">
            Overall avg: {overall.averageAttemptsPerProblem} / prob
          </span>
        </div>
        </div>
      </div>

      {/* 2. DIFFICULTY DISTRIBUTION & ATTEMPT OUTCOMES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Difficulty Breakdown */}
        <div className="bg-surface rounded-xl p-6 border border-subtle/50 flex flex-col">
          <h3 className="text-[15px] font-semibold text-primary mb-6">Difficulty Distribution & Mastery</h3>

          <div className="space-y-5">
            {(['Easy', 'Medium', 'Hard'] as PracticeDifficulty[]).map((diffKey) => {
              const diffStat = difficulty[diffKey];
              return (
                <div
                  key={diffKey}
                  className="flex flex-col gap-1.5 pb-4 border-b border-subtle/50 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[13px] font-medium ${
                      diffKey === 'Easy' ? 'text-emerald-500 dark:text-emerald-400' :
                      diffKey === 'Medium' ? 'text-amber-500 dark:text-amber-400' :
                      'text-red-500 dark:text-red-400'
                    }`}>
                      {diffKey}
                    </span>
                    <span className="text-[13px] text-secondary font-mono">
                      {diffStat.solved} / {diffStat.total} <span className="text-muted text-[11px]">({diffStat.solveRate}%)</span>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${getDifficultyBarColor(diffKey)} transition-all duration-500`}
                      style={{
                        width: `${diffStat.total > 0 ? (diffStat.solved / diffStat.total) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center text-[11px] text-muted gap-2">
                    <span>{diffStat.attempts} attempts logged</span>
                    <span>·</span>
                    <span>{diffStat.inProgress} in progress</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attempt Outcomes Distribution */}
        <div className="bg-surface rounded-xl p-6 border border-subtle/50 flex flex-col justify-between">
          <h3 className="text-[15px] font-semibold text-primary mb-6 flex justify-between items-end">
            <span>Attempt Outcomes</span>
            <span className="text-xs font-normal text-muted">{outcomes.total} Total Attempts</span>
          </h3>

          {outcomes.total > 0 ? (
            <div className="space-y-6">
              {/* Visual Bar Split */}
              <div className="w-full bg-surface-elevated rounded h-8 flex overflow-hidden">
                {outcomes.solved > 0 && (
                  <div
                    className="bg-emerald-500/80 hover:bg-emerald-500 h-full transition-all flex items-center justify-center text-[10px] font-bold text-emerald-950 px-1"
                    style={{ width: `${(outcomes.solved / outcomes.total) * 100}%` }}
                    title={`Solved: ${outcomes.solved}`}
                  >
                    {Math.round((outcomes.solved / outcomes.total) * 100)}%
                  </div>
                )}
                {outcomes.failed > 0 && (
                  <div
                    className="bg-red-500/80 hover:bg-red-500 h-full transition-all flex items-center justify-center text-[10px] font-bold text-red-950 px-1 border-l border-surface"
                    style={{ width: `${(outcomes.failed / outcomes.total) * 100}%` }}
                    title={`Failed: ${outcomes.failed}`}
                  >
                    {Math.round((outcomes.failed / outcomes.total) * 100)}%
                  </div>
                )}
                {outcomes.incomplete > 0 && (
                  <div
                    className="bg-surface-hover hover:bg-surface-hover h-full transition-all flex items-center justify-center text-[10px] font-bold text-primary px-1 border-l border-surface"
                    style={{ width: `${(outcomes.incomplete / outcomes.total) * 100}%` }}
                    title={`Incomplete: ${outcomes.incomplete}`}
                  >
                    {Math.round((outcomes.incomplete / outcomes.total) * 100)}%
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-medium pb-2">
                <div className="flex flex-col">
                  <span className="text-emerald-400">Solved</span>
                  <span className="text-xl text-primary font-bold">{outcomes.solved}</span>
                </div>
                <div className="flex flex-col text-center">
                  <span className="text-red-400">Failed</span>
                  <span className="text-xl text-primary font-bold">{outcomes.failed}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-secondary">Incomplete</span>
                  <span className="text-xl text-primary font-bold">{outcomes.incomplete}</span>
                </div>
              </div>
              
              {/* Quick Accuracy Note */}
              <div className="text-[13px] text-secondary flex flex-col pt-4 border-t border-subtle">
                <span className="text-muted text-[11px] uppercase tracking-wider mb-0.5">Overall Attempt Pass Accuracy</span>
                <span className="font-semibold text-emerald-400 text-2xl">{outcomes.solvedRate}%</span>
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <span className="text-[13px] font-medium text-secondary mb-1">No attempt runs recorded yet.</span>
              <span className="text-[11px] text-muted">Code attempts recorded during practice will appear here.</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. TOPIC MASTERY TABLE */}
      {/* 3. TOPIC MASTERY TABLE */}
      <div className="bg-surface rounded-xl p-6 border border-subtle/50 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-baseline gap-3">
            <h3 className="text-[15px] font-semibold text-primary">Topic Mastery Breakdown</h3>
            <span className="text-xs text-muted font-mono">{topics.length} topics</span>
          </div>

          {/* Topic Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topic..."
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-md bg-surface border border-subtle text-xs text-primary focus:outline-none focus:border-blue-500/50 w-full sm:w-64"
            />
          </div>
        </div>

        {filteredTopics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-secondary whitespace-nowrap">
              <thead className="text-[11px] font-medium text-muted uppercase tracking-wider border-b border-subtle">
                <tr>
                  <th className="pb-3 px-2 font-normal">Topic</th>
                  <th className="pb-3 px-2 text-center font-normal">Problems</th>
                  <th className="pb-3 px-2 text-center font-normal">Solved</th>
                  <th className="pb-3 px-2 text-center font-normal">Attempts</th>
                  <th className="pb-3 px-2 text-right font-normal">Solve Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle/50">
                {filteredTopics.map((item) => (
                  <tr
                    key={item.topic}
                    onClick={() => onFilterByTopic && onFilterByTopic(item.topic)}
                    className={`hover:bg-surface-hover transition-colors ${
                      onFilterByTopic ? 'cursor-pointer' : ''
                    }`}
                  >
                    <td className="py-3 px-2 font-medium text-primary flex items-center gap-2">
                      <span className="truncate max-w-[200px] sm:max-w-[320px]" title={item.topic}>{item.topic}</span>
                    </td>
                    <td className="py-3 px-2 text-center text-secondary">{item.problemCount}</td>
                    <td className="py-3 px-2 text-center text-emerald-400 font-medium">
                      {item.solvedCount}
                    </td>
                    <td className="py-3 px-2 text-center text-secondary">{item.attemptCount}</td>
                    <td className="py-3 px-2 text-right font-mono font-medium">
                      <span
                        className={
                          item.solveRate >= 80
                            ? 'text-emerald-400'
                            : item.solveRate >= 50
                            ? 'text-amber-400'
                            : 'text-secondary'
                        }
                      >
                        {item.solveRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <span className="text-[13px] font-medium text-secondary mb-1">
              {topicSearch ? 'No topics match your search query.' : 'No practice topics logged yet.'}
            </span>
          </div>
        )}
      </div>

      {/* 4. DSA PATTERNS & BENCHMARK INSIGHTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* DSA Pattern Frequency */}
        <div className="bg-surface rounded-xl p-6 border border-subtle/50 flex flex-col">
          <h3 className="text-[15px] font-semibold text-primary mb-6 flex justify-between items-end">
            <span>DSA Pattern Frequency</span>
            <span className="text-xs font-normal text-muted">Detected in code</span>
          </h3>

          {dsaPatterns.length > 0 ? (
            <div className="space-y-4">
              {dsaPatterns.slice(0, 7).map((item) => (
                <div key={item.pattern} className="flex flex-col gap-1.5 pb-4 border-b border-subtle/50 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-primary">{item.pattern}</span>
                    <span className="text-[11px] text-muted font-mono">
                      {item.count} {item.count === 1 ? 'attempt' : 'attempts'} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-400/80 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <span className="text-[13px] font-medium text-secondary mb-1">No patterns detected yet.</span>
              <span className="text-[11px] text-muted">Attempts with static analysis evidence will display patterns here.</span>
            </div>
          )}
        </div>

        {/* Benchmark Insights */}
        <div className="bg-surface rounded-xl p-6 border border-subtle/50 flex flex-col justify-between">
          <h3 className="text-[15px] font-semibold text-primary mb-6 flex justify-between items-end">
            <span>Benchmark Insights</span>
            <span className="text-xs font-normal text-muted">{benchmarks.benchmarkedAttempts} Benchmarked Runs</span>
          </h3>

          {benchmarks.benchmarkedAttempts > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs font-medium pb-2 border-b border-subtle">
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider text-muted mb-0.5">Average</span>
                  <span className="text-xl text-cyan-400 font-bold font-mono">{benchmarks.averageRuntimeMs}ms</span>
                </div>
                <div className="flex flex-col text-center">
                  <span className="text-[11px] uppercase tracking-wider text-muted mb-0.5">Fastest</span>
                  <span className="text-xl text-emerald-400 font-bold font-mono">{benchmarks.fastestRuntimeMs}ms</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[11px] uppercase tracking-wider text-muted mb-0.5">Slowest</span>
                  <span className="text-xl text-amber-400 font-bold font-mono">{benchmarks.slowestRuntimeMs}ms</span>
                </div>
              </div>

              {/* By Language Breakdown */}
              {benchmarks.byLanguage.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[11px] uppercase tracking-wider text-muted font-medium">Language Execution Metrics</span>
                  <div className="flex flex-col space-y-2">
                    {benchmarks.byLanguage.map((langStat) => (
                      <div key={langStat.language} className="flex items-center justify-between py-2 border-b border-subtle/50 last:border-0 last:pb-0 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium uppercase text-primary">{langStat.language}</span>
                          <span className="text-muted font-mono text-[10px]">({langStat.attemptCount} runs)</span>
                        </div>
                        <div className="flex items-center gap-4 font-mono">
                          <span className="text-secondary text-[11px]">Avg: <strong className="text-cyan-400 text-xs">{langStat.averageMs}ms</strong></span>
                          <span className="text-secondary text-[11px]">Fast: <strong className="text-emerald-400 text-xs">{langStat.fastestMs}ms</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <span className="text-[13px] font-medium text-secondary mb-1">No benchmark evidence recorded.</span>
              <span className="text-[11px] text-muted">Use the Benchmark tool while solving programs to log execution timing.</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. ATTEMPT ACTIVITY TIMELINE */}
      <div className="bg-surface rounded-xl p-6 border border-subtle/50 flex flex-col">
        <h3 className="text-[15px] font-semibold text-primary mb-6 flex justify-between items-end">
          <span>Recent Activity Timeline</span>
          <span className="text-xs font-normal text-muted">{timeline.length} Activity Days</span>
        </h3>

        {timeline.length > 0 ? (
          <div className="flex flex-col">
            {timeline.slice(0, 10).map((entry) => (
              <div
                key={entry.date}
                className="py-3 flex items-center justify-between border-b border-subtle/50 last:border-0 text-[13px]"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono font-medium text-primary">{entry.date}</span>
                  <span className="text-[11px] text-muted">
                    {entry.total} {entry.total === 1 ? 'attempt' : 'attempts'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  {entry.solved > 0 && (
                    <span className="text-emerald-400 font-medium">{entry.solved} passed</span>
                  )}
                  {entry.failed > 0 && (
                    <span className="text-red-400 font-medium">{entry.failed} failed</span>
                  )}
                  {entry.incomplete > 0 && (
                    <span className="text-secondary font-medium">{entry.incomplete} incomplete</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <span className="text-[13px] font-medium text-secondary mb-1">No attempt history recorded yet.</span>
          </div>
        )}
      </div>
    </div>
  );
};
