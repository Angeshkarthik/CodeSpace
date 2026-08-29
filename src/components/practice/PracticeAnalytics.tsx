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
      {/* 1. TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Problems */}
        <div className="p-4 rounded-xl border border-subtle bg-surface-elevated backdrop-blur-sm flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="text-xs font-medium uppercase tracking-wider truncate">Total Problems</span>
            <Target className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{overall.totalProblems}</span>
            <span className="text-xs text-muted">problems</span>
          </div>
          <div className="mt-2 text-xs text-secondary flex items-center gap-1.5 truncate">
            <span className="text-emerald-400 font-semibold">{overall.solvedProblems}</span> solved
            <span className="text-muted">•</span>
            <span className="text-amber-400 font-semibold">{overall.inProgressProblems}</span> active
          </div>
        </div>

        {/* Solved Problems */}
        <div className="p-4 rounded-xl border border-subtle bg-surface-elevated backdrop-blur-sm flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="text-xs font-medium uppercase tracking-wider truncate">Problems Solved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{overall.solvedProblems}</span>
            <span className="text-xs text-muted">/ {overall.totalProblems}</span>
          </div>
          <div className="mt-2 w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{
                width: `${overall.totalProblems > 0 ? (overall.solvedProblems / overall.totalProblems) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Solve Rate */}
        <div className="p-4 rounded-xl border border-subtle bg-surface-elevated backdrop-blur-sm flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="text-xs font-medium uppercase tracking-wider truncate">Solve Accuracy</span>
            <TrendingUp className="w-4 h-4 text-blue-400 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{overall.solveRate}%</span>
          </div>
          <div className="mt-2 text-xs text-secondary truncate">
            Across <span className="text-primary font-semibold">{overall.attemptedProblems}</span> attempted problems
          </div>
        </div>

        {/* Total Attempts */}
        <div className="p-4 rounded-xl border border-subtle bg-surface-elevated backdrop-blur-sm flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="text-xs font-medium uppercase tracking-wider truncate">Total Attempts</span>
            <Flame className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{overall.totalAttempts}</span>
            <span className="text-xs text-muted">runs</span>
          </div>
          <div className="mt-2 text-xs text-secondary truncate">
            <span className="text-emerald-400 font-semibold">{outcomes.solved}</span> passed attempts
          </div>
        </div>

        {/* Avg Attempts per Problem */}
        <div className="p-4 rounded-xl border border-subtle bg-surface-elevated backdrop-blur-sm flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="text-xs font-medium uppercase tracking-wider truncate">Avg Attempts / Solved</span>
            <Award className="w-4 h-4 text-violet-400 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{overall.averageAttemptsToSolve}</span>
            <span className="text-xs text-muted">attempts</span>
          </div>
          <div className="mt-2 text-xs text-secondary truncate">
            Overall avg: <span className="text-secondary font-semibold">{overall.averageAttemptsPerProblem}</span> / prob
          </div>
        </div>
      </div>

      {/* 2. DIFFICULTY DISTRIBUTION & ATTEMPT OUTCOMES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Difficulty Breakdown */}
        <div className="p-5 rounded-xl border border-subtle bg-surface-elevated space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-primary">Difficulty Distribution & Mastery</h3>
            </div>
            <span className="text-xs text-muted">By problem tier</span>
          </div>

          <div className="space-y-4">
            {(['Easy', 'Medium', 'Hard'] as PracticeDifficulty[]).map((diffKey) => {
              const diffStat = difficulty[diffKey];
              return (
                <div
                  key={diffKey}
                  onClick={() => onFilterByDifficulty && onFilterByDifficulty(diffKey)}
                  className={`p-3.5 rounded-lg border bg-surface transition-all ${
                    onFilterByDifficulty ? 'cursor-pointer hover:border-subtle hover:bg-surface' : ''
                  } ${getDifficultyBadgeColor(diffKey)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider">{diffKey}</span>
                      {onFilterByDifficulty && <ArrowUpRight className="w-3 h-3 text-muted" />}
                    </div>
                    <div className="text-xs font-semibold text-secondary">
                      {diffStat.solved} / {diffStat.total}{' '}
                      <span className="text-muted font-normal">({diffStat.solveRate}%)</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden border border-subtle">
                    <div
                      className={`h-full ${getDifficultyBarColor(diffKey)} transition-all duration-500`}
                      style={{
                        width: `${diffStat.total > 0 ? (diffStat.solved / diffStat.total) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-xs text-secondary">
                    <span>{diffStat.attempts} attempts logged</span>
                    <span>{diffStat.inProgress} in progress</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attempt Outcomes Distribution */}
        <div className="p-5 rounded-xl border border-subtle bg-surface-elevated space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-primary">Attempt Outcomes</h3>
              </div>
              <span className="text-xs text-muted">{outcomes.total} Total Attempts</span>
            </div>

            {/* Visual Bar Split */}
            {outcomes.total > 0 ? (
              <div className="space-y-4">
                <div className="w-full bg-surface rounded-lg p-1.5 border border-subtle flex gap-1 h-10 items-center">
                  {outcomes.solved > 0 && (
                    <div
                      className="bg-emerald-500/80 hover:bg-emerald-500 h-full rounded transition-all flex items-center justify-center text-[10px] font-bold text-emerald-950 px-1"
                      style={{ width: `${(outcomes.solved / outcomes.total) * 100}%` }}
                      title={`Solved: ${outcomes.solved}`}
                    >
                      {Math.round((outcomes.solved / outcomes.total) * 100)}%
                    </div>
                  )}
                  {outcomes.failed > 0 && (
                    <div
                      className="bg-rose-500/80 hover:bg-rose-500 h-full rounded transition-all flex items-center justify-center text-[10px] font-bold text-rose-950 px-1"
                      style={{ width: `${(outcomes.failed / outcomes.total) * 100}%` }}
                      title={`Failed: ${outcomes.failed}`}
                    >
                      {Math.round((outcomes.failed / outcomes.total) * 100)}%
                    </div>
                  )}
                  {outcomes.incomplete > 0 && (
                    <div
                      className="bg-surface-hover hover:bg-surface-hover h-full rounded transition-all flex items-center justify-center text-[10px] font-bold text-primary px-1"
                      style={{ width: `${(outcomes.incomplete / outcomes.total) * 100}%` }}
                      title={`Incomplete: ${outcomes.incomplete}`}
                    >
                      {Math.round((outcomes.incomplete / outcomes.total) * 100)}%
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-center">
                    <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-semibold mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Solved
                    </div>
                    <span className="text-xl font-bold text-emerald-400">{outcomes.solved}</span>
                    <span className="text-[10px] block text-secondary">
                      {outcomes.total > 0 ? Math.round((outcomes.solved / outcomes.total) * 100) : 0}% of runs
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-center">
                    <div className="flex items-center justify-center gap-1 text-rose-400 text-xs font-semibold mb-1">
                      <XCircle className="w-3.5 h-3.5" /> Failed
                    </div>
                    <span className="text-xl font-bold text-rose-400">{outcomes.failed}</span>
                    <span className="text-[10px] block text-secondary">
                      {outcomes.total > 0 ? Math.round((outcomes.failed / outcomes.total) * 100) : 0}% of runs
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-subtle bg-surface-elevated text-center">
                    <div className="flex items-center justify-center gap-1 text-secondary text-xs font-semibold mb-1">
                      <AlertCircle className="w-3.5 h-3.5 text-secondary" /> Incomplete
                    </div>
                    <span className="text-xl font-bold text-secondary">{outcomes.incomplete}</span>
                    <span className="text-[10px] block text-secondary">
                      {outcomes.total > 0 ? Math.round((outcomes.incomplete / outcomes.total) * 100) : 0}% of runs
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-subtle rounded-lg text-muted text-xs">
                No attempt runs recorded yet. Code attempts recorded during practice will appear here.
              </div>
            )}
          </div>

          {/* Quick Accuracy Note */}
          <div className="mt-4 p-3 rounded-lg bg-surface border border-subtle text-xs text-secondary flex items-center justify-between">
            <span>Overall Attempt Pass Accuracy:</span>
            <span className="font-semibold text-emerald-400">{outcomes.solvedRate}%</span>
          </div>
        </div>
      </div>

      {/* 3. TOPIC MASTERY TABLE */}
      <div className="p-5 rounded-xl border border-subtle bg-surface-elevated space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-primary">Topic Mastery Breakdown</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-elevated text-secondary font-mono">
              {topics.length} topics
            </span>
          </div>

          {/* Topic Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topic..."
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-surface border border-subtle text-xs text-primary placeholder:text-muted focus:outline-none focus:border-cyan-500/50 w-full sm:w-48"
            />
          </div>
        </div>

        {filteredTopics.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-subtle">
            <table className="w-full text-left text-xs text-secondary">
              <thead className="bg-surface text-secondary font-semibold border-b border-subtle">
                <tr>
                  <th className="py-2.5 px-4">Topic</th>
                  <th className="py-2.5 px-4 text-center">Problems</th>
                  <th className="py-2.5 px-4 text-center">Solved</th>
                  <th className="py-2.5 px-4 text-center">Attempts</th>
                  <th className="py-2.5 px-4 text-right">Solve Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle bg-surface-elevated">
                {filteredTopics.map((item) => (
                  <tr
                    key={item.topic}
                    onClick={() => onFilterByTopic && onFilterByTopic(item.topic)}
                    className={`hover:bg-surface-elevated transition-colors ${
                      onFilterByTopic ? 'cursor-pointer' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 font-medium text-primary flex items-center gap-2 min-w-0">
                      <span className="truncate max-w-[200px] sm:max-w-[320px]" title={item.topic}>{item.topic}</span>
                      {onFilterByTopic && <Filter className="w-3 h-3 text-muted hover:text-cyan-400 shrink-0" />}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-secondary">{item.problemCount}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-emerald-400 font-semibold">
                      {item.solvedCount}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-secondary">{item.attemptCount}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold">
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
          <div className="p-8 text-center border border-dashed border-subtle rounded-lg text-muted text-xs">
            {topicSearch ? 'No topics match your search query.' : 'No practice topics logged yet.'}
          </div>
        )}
      </div>

      {/* 4. DSA PATTERNS & BENCHMARK INSIGHTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DSA Pattern Frequency */}
        <div className="p-5 rounded-xl border border-subtle bg-surface-elevated space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-primary">DSA Pattern Frequency</h3>
            </div>
            <span className="text-xs text-muted">Detected in code analysis</span>
          </div>

          {dsaPatterns.length > 0 ? (
            <div className="space-y-3">
              {dsaPatterns.slice(0, 7).map((item) => (
                <div key={item.pattern} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-secondary">{item.pattern}</span>
                    <span className="text-secondary font-mono">
                      {item.count} {item.count === 1 ? 'attempt' : 'attempts'} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden border border-subtle">
                    <div
                      className="bg-amber-400/80 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-subtle rounded-lg text-muted text-xs">
              No DSA patterns detected yet. Practice attempts with static analysis evidence will display detected patterns here.
            </div>
          )}
        </div>

        {/* Benchmark Insights */}
        <div className="p-5 rounded-xl border border-subtle bg-surface-elevated space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-primary">Benchmark Runtime Insights</h3>
            </div>
            <span className="text-xs text-muted">
              {benchmarks.benchmarkedAttempts} Benchmarked Runs
            </span>
          </div>

          {benchmarks.benchmarkedAttempts > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-surface border border-subtle text-center">
                  <span className="text-[10px] uppercase font-semibold text-secondary block mb-1">Average</span>
                  <span className="text-lg font-bold font-mono text-cyan-400">{benchmarks.averageRuntimeMs} ms</span>
                </div>
                <div className="p-3 rounded-lg bg-surface border border-subtle text-center">
                  <span className="text-[10px] uppercase font-semibold text-secondary block mb-1">Fastest</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">{benchmarks.fastestRuntimeMs} ms</span>
                </div>
                <div className="p-3 rounded-lg bg-surface border border-subtle text-center">
                  <span className="text-[10px] uppercase font-semibold text-secondary block mb-1">Slowest</span>
                  <span className="text-lg font-bold font-mono text-amber-400">{benchmarks.slowestRuntimeMs} ms</span>
                </div>
              </div>

              {/* By Language Breakdown */}
              {benchmarks.byLanguage.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-subtle">
                  <span className="text-xs font-semibold text-secondary uppercase tracking-wider block">
                    Language Execution Metrics
                  </span>
                  <div className="divide-y divide-subtle bg-surface rounded-lg border border-subtle">
                    {benchmarks.byLanguage.map((langStat) => (
                      <div key={langStat.language} className="p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold uppercase text-primary">{langStat.language}</span>
                          <span className="text-muted font-mono">({langStat.attemptCount} runs)</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-secondary">Avg: <strong className="text-cyan-400">{langStat.averageMs}ms</strong></span>
                          <span className="text-secondary">Fast: <strong className="text-emerald-400">{langStat.fastestMs}ms</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-subtle rounded-lg text-muted text-xs">
              No benchmark evidence recorded yet. Use the Benchmark tool while solving programs to log execution timing insights.
            </div>
          )}
        </div>
      </div>

      {/* 5. ATTEMPT ACTIVITY TIMELINE */}
      <div className="p-5 rounded-xl border border-subtle bg-surface-elevated space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-primary">Recent Attempt Timeline</h3>
          </div>
          <span className="text-xs text-muted">{timeline.length} Activity Days</span>
        </div>

        {timeline.length > 0 ? (
          <div className="space-y-2">
            {timeline.slice(0, 10).map((entry) => (
              <div
                key={entry.date}
                className="p-3 rounded-lg border border-subtle bg-surface flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-secondary">{entry.date}</span>
                  <span className="text-muted">
                    {entry.total} {entry.total === 1 ? 'attempt' : 'attempts'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {entry.solved > 0 && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {entry.solved} passed
                    </span>
                  )}
                  {entry.failed > 0 && (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {entry.failed} failed
                    </span>
                  )}
                  {entry.incomplete > 0 && (
                    <span className="text-secondary font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {entry.incomplete} incomplete
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-subtle rounded-lg text-muted text-xs">
            No attempt history timeline recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};
