import { db } from '@/lib/db';
import { LanguageType } from '@/types';
import { ExecutionResult } from '@/lib/execution/types';
import { CodeAnalysisResult } from '@/lib/analysis/types';
import { BenchmarkResult, computeFingerprint } from '@/lib/benchmark/types';
import { AIReviewResult } from '@/lib/ai/types';
import { BatchTestSummary } from '@/lib/execution/TestRunner';
import { CodeSnapshot } from '@/lib/compare/types';
import { ProgramVersion, MAX_VERSIONS_PER_PROGRAM, MAX_CODE_LENGTH_BYTES } from './types';

export interface SaveVersionInput {
  programUuid: string;
  code: string;
  language: LanguageType;
  input?: string;
  mode?: string;
  label?: string;

  // Active evidence candidates
  executionResult?: ExecutionResult | null;
  testSummary?: BatchTestSummary | null;
  analysisResult?: CodeAnalysisResult | null;
  benchmarkResult?: BenchmarkResult | null;
  benchmarkFingerprint?: string | null;
  aiReview?: AIReviewResult | null;
}

export interface SaveVersionResult {
  success: boolean;
  version?: ProgramVersion;
  message?: string;
  isDuplicate?: boolean;
}

/**
 * Service to manage persistent Program History operations via Dexie.js
 */
export async function getProgramVersions(programUuid: string): Promise<ProgramVersion[]> {
  const versions = await db.programVersions
    .where('programUuid')
    .equals(programUuid)
    .toArray();

  // Sort newest first (highest versionNumber descending)
  return versions.sort((a, b) => b.versionNumber - a.versionNumber);
}

/**
 * Save an intentional checkpoint version of the current program.
 */
export async function saveProgramVersion(params: SaveVersionInput): Promise<SaveVersionResult> {
  const {
    programUuid,
    code,
    language,
    input,
    mode,
    label,
    executionResult,
    testSummary,
    analysisResult,
    benchmarkResult,
    benchmarkFingerprint,
    aiReview,
  } = params;

  // 1. Code length safety check
  if (code.length > MAX_CODE_LENGTH_BYTES) {
    return {
      success: false,
      message: `Source code exceeds safe storage limit (${Math.round(MAX_CODE_LENGTH_BYTES / 1024)} KB).`,
    };
  }

  // 2. Fetch existing versions for this program
  const existingVersions = await db.programVersions
    .where('programUuid')
    .equals(programUuid)
    .toArray();

  // 3. Enforce MAX_VERSIONS_PER_PROGRAM limit
  if (existingVersions.length >= MAX_VERSIONS_PER_PROGRAM) {
    return {
      success: false,
      message: `Version limit reached (${MAX_VERSIONS_PER_PROGRAM} versions max per program). Delete an older version before saving another.`,
    };
  }

  // 4. Duplicate Version Protection
  const sorted = existingVersions.sort((a, b) => b.versionNumber - a.versionNumber);
  const latestVersion = sorted[0];

  const normCode = code.trim();
  const normInput = (input ?? '').trim();

  if (
    latestVersion &&
    latestVersion.code.trim() === normCode &&
    latestVersion.language === language &&
    (latestVersion.input ?? '').trim() === normInput
  ) {
    return {
      success: false,
      isDuplicate: true,
      message: `Current code is already saved as Version ${latestVersion.versionNumber}.`,
    };
  }

  // 5. Calculate sequential monotonic version number per program
  const highestVersion = existingVersions.reduce((max, v) => Math.max(max, v.versionNumber), 0);
  const nextVersionNumber = highestVersion + 1;

  const finalLabel = label && label.trim() ? label.trim() : `Version ${nextVersionNumber}`;

  // 6. Evidence Validity & Fingerprint Checks
  let validExecution: ExecutionResult | null = null;
  if (executionResult && executionResult.status === 'success') {
    validExecution = executionResult;
  }

  let validTests: BatchTestSummary | null = null;
  if (testSummary) {
    validTests = testSummary;
  }

  let validAnalysis: CodeAnalysisResult | null = null;
  if (analysisResult && analysisResult.language === language) {
    validAnalysis = analysisResult;
  }

  let validBenchmark: BenchmarkResult | null = null;
  if (
    benchmarkResult &&
    benchmarkFingerprint &&
    benchmarkFingerprint === computeFingerprint(language, code, input ?? '')
  ) {
    validBenchmark = benchmarkResult;
  }

  let validReview: AIReviewResult | null = null;
  if (aiReview) {
    validReview = aiReview;
  }

  // 7. Construct & Store ProgramVersion
  const newVersion: ProgramVersion = {
    uuid: crypto.randomUUID(),
    programUuid,
    versionNumber: nextVersionNumber,
    label: finalLabel,
    code,
    language,
    input: input ?? '',
    mode,
    createdAt: Date.now(),
    execution: validExecution,
    tests: validTests,
    analysis: validAnalysis,
    benchmark: validBenchmark,
    review: validReview,
  };

  const id = await db.programVersions.add(newVersion);
  return {
    success: true,
    version: { ...newVersion, id },
  };
}

/**
 * Update user label of a historical version without altering code, evidence, or timestamp.
 */
export async function updateVersionLabel(versionUuid: string, newLabel: string): Promise<void> {
  const version = await db.programVersions.where('uuid').equals(versionUuid).first();
  if (version && version.id) {
    await db.programVersions.update(version.id, {
      label: newLabel.trim() || `Version ${version.versionNumber}`,
    });
  }
}

/**
 * Delete a single historical version. Preserves version numbering of remaining entries.
 */
export async function deleteProgramVersion(versionUuid: string): Promise<void> {
  const version = await db.programVersions.where('uuid').equals(versionUuid).first();
  if (version && version.id) {
    await db.programVersions.delete(version.id);
  }
}

/**
 * Delete all historical versions for a program.
 */
export async function clearProgramHistory(programUuid: string): Promise<void> {
  await db.programVersions.where('programUuid').equals(programUuid).delete();
}

/**
 * Helper to adapt a ProgramVersion into a Phase 3C CodeSnapshot for comparison.
 */
export function versionToSnapshot(version: ProgramVersion): CodeSnapshot {
  return {
    id: version.uuid,
    label: `v${version.versionNumber} — ${version.label}`,
    code: version.code,
    language: version.language,
    input: version.input,
    mode: version.mode,
    createdAt: version.createdAt,
    analysis: version.analysis,
    benchmark: version.benchmark,
    execution: version.execution,
    tests: version.tests,
  };
}
