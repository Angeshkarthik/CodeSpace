import Dexie, { Table } from 'dexie';
import { Program, AppSettings, TestCase } from '@/types';
import { ProgramVersion } from '../history/types';
import { STARTER_TEMPLATES } from '../constants';

import { PracticeProblem, PracticeAttempt } from '../practice/types';

export class CodeSpaceDatabase extends Dexie {
  programs!: Table<Program, number>;
  settings!: Table<AppSettings, number>;
  testCases!: Table<TestCase, number>;
  programVersions!: Table<ProgramVersion, number>;
  practiceProblems!: Table<PracticeProblem, number>;
  practiceAttempts!: Table<PracticeAttempt, number>;

  constructor() {
    super('CodeSpaceDB');
    this.version(1).stores({
      programs: '++id, uuid, name, language, createdAt, updatedAt',
      settings: '++id, key'
    });

    this.version(2).stores({
      programs: '++id, uuid, name, language, createdAt, updatedAt',
      settings: '++id, key',
      testCases: '++id, uuid, programUuid, createdAt'
    });

    this.version(3).stores({
      programs: '++id, uuid, name, language, createdAt, updatedAt',
      settings: '++id, key',
      testCases: '++id, uuid, programUuid, createdAt',
      programVersions: '++id, uuid, programUuid, versionNumber, createdAt'
    });

    this.version(4).stores({
      programs: '++id, uuid, name, language, createdAt, updatedAt',
      settings: '++id, key',
      testCases: '++id, uuid, programUuid, createdAt',
      programVersions: '++id, uuid, programUuid, versionNumber, createdAt',
      practiceProblems: '++id, uuid, topic, difficulty, status, programUuid, createdAt, updatedAt'
    });

    this.version(5).stores({
      programs: '++id, uuid, name, language, createdAt, updatedAt',
      settings: '++id, key',
      testCases: '++id, uuid, programUuid, createdAt',
      programVersions: '++id, uuid, programUuid, versionNumber, createdAt',
      practiceProblems: '++id, uuid, topic, difficulty, status, programUuid, createdAt, updatedAt',
      practiceAttempts: '++id, uuid, practiceProblemUuid, programUuid, attemptNumber, createdAt, outcome'
    });
  }
}

export const db = new CodeSpaceDatabase();

const INITIAL_SEED_PROGRAMS: Program[] = [
  {
    id: 1,
    uuid: 'seed-reverse-py',
    name: 'reverse.py',
    language: 'python',
    code: `def reverse_string(s: str) -> str:
    return s[::-1]

def main():
    text = "CodeSpace Workspace"
    reversed_text = reverse_string(text)
    print(f"Original: {text}")
    print(f"Reversed: {reversed_text}")

if __name__ == "__main__":
    main()
`,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
  {
    id: 2,
    uuid: 'seed-arrays-cpp',
    name: 'arrays.cpp',
    language: 'cpp',
    code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> nums = {10, 20, 30, 40, 50};
    cout << "Array elements: ";
    for (int n : nums) {
        cout << n << " ";
    }
    cout << endl;
    return 0;
}
`,
    createdAt: 1700000001000,
    updatedAt: 1700000001000,
  },
  {
    id: 3,
    uuid: 'seed-main-c',
    name: 'main.c',
    language: 'c',
    code: STARTER_TEMPLATES.c.defaultCode,
    createdAt: 1700000002000,
    updatedAt: 1700000002000,
  }
];

// Deduplicate database records and seed initial data safely
export async function seedInitialPrograms(): Promise<Program[]> {
  await db.transaction('rw', [db.programs, db.testCases], async () => {
    const all = await db.programs.toArray();

    // 1. Clean up any existing duplicate records in database
    const seenUuids = new Set<string>();
    const seenNames = new Set<string>();
    const idsToDelete: number[] = [];

    for (const item of all) {
      if (item.id) {
        if (seenUuids.has(item.uuid) || (item.uuid.startsWith('seed-') && seenNames.has(item.name))) {
          idsToDelete.push(item.id);
        } else {
          seenUuids.add(item.uuid);
          seenNames.add(item.name);
        }
      }
    }

    if (idsToDelete.length > 0) {
      await db.programs.bulkDelete(idsToDelete);
    }

    // 2. If database has zero records, seed the 3 initial programs deterministically
    const countAfterCleanup = await db.programs.count();
    if (countAfterCleanup === 0) {
      await db.programs.bulkPut(INITIAL_SEED_PROGRAMS);
    }
  });

  return await db.programs.toArray();
}

export async function createProgram(name: string, language: Program['language'], customCode?: string): Promise<Program> {
  const now = Date.now();
  const defaultCode = customCode ?? STARTER_TEMPLATES[language].defaultCode;
  const newProg: Omit<Program, 'id'> = {
    uuid: crypto.randomUUID(),
    name,
    language,
    code: defaultCode,
    createdAt: now,
    updatedAt: now
  };
  const id = await db.programs.add(newProg as Program);
  return { ...newProg, id } as Program;
}

export async function updateProgram(uuid: string, updates: Partial<Program>): Promise<void> {
  const prog = await db.programs.where('uuid').equals(uuid).first();
  if (prog && prog.id) {
    await db.programs.update(prog.id, {
      ...updates,
      updatedAt: Date.now()
    });
  }
}

export async function deleteProgram(uuid: string): Promise<void> {
  await db.transaction('rw', [db.programs, db.testCases, db.programVersions, db.practiceProblems, db.practiceAttempts], async () => {
    const prog = await db.programs.where('uuid').equals(uuid).first();
    if (prog && prog.id) {
      // Delete associated test cases and program versions as well (cascading delete)
      await db.testCases.where('programUuid').equals(uuid).delete();
      await db.programVersions.where('programUuid').equals(uuid).delete();
      // Safely unlink affected practice problems (set programUuid to null)
      await db.practiceProblems.where('programUuid').equals(uuid).modify({ programUuid: null });
      // Safely unlink historical practice attempts (set programUuid to null) while preserving historical attempt records
      await db.practiceAttempts.where('programUuid').equals(uuid).modify({ programUuid: null });
      await db.programs.delete(prog.id);
    }
  });
}

// Test Case CRUD operations
export async function getTestCases(programUuid: string): Promise<TestCase[]> {
  return await db.testCases.where('programUuid').equals(programUuid).sortBy('createdAt');
}

export async function createTestCase(programUuid: string, input: string = '', expectedOutput?: string): Promise<TestCase> {
  const now = Date.now();
  const newTestCase: Omit<TestCase, 'id'> = {
    uuid: crypto.randomUUID(),
    programUuid,
    input,
    expectedOutput,
    createdAt: now,
    updatedAt: now
  };
  const id = await db.testCases.add(newTestCase as TestCase);
  return { ...newTestCase, id } as TestCase;
}

export async function updateTestCase(uuid: string, updates: Partial<TestCase>): Promise<void> {
  const tc = await db.testCases.where('uuid').equals(uuid).first();
  if (tc && tc.id) {
    await db.testCases.update(tc.id, {
      ...updates,
      updatedAt: Date.now()
    });
  }
}

export async function deleteTestCase(uuid: string): Promise<void> {
  const tc = await db.testCases.where('uuid').equals(uuid).first();
  if (tc && tc.id) {
    await db.testCases.delete(tc.id);
  }
}

// ─── Practice Problem CRUD & Seed Operations ─────────────────────────

const INITIAL_SEED_PRACTICE_PROBLEMS: Omit<PracticeProblem, 'id'>[] = [
  {
    uuid: 'seed-prob-two-sum',
    title: 'Two Sum',
    topic: 'Arrays & Hashing',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution.',
    status: 'In Progress',
    programUuid: 'seed-reverse-py',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
  {
    uuid: 'seed-prob-max-subarray',
    title: 'Maximum Subarray',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum using Kadane\'s Algorithm (O(n) time).',
    status: 'Not Started',
    programUuid: 'seed-arrays-cpp',
    createdAt: 1700000001000,
    updatedAt: 1700000001000,
  },
  {
    uuid: 'seed-prob-buy-sell-stock',
    title: 'Best Time to Buy and Sell Stock',
    topic: 'Arrays',
    difficulty: 'Easy',
    description: 'You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.',
    status: 'Solved',
    programUuid: null,
    createdAt: 1700000002000,
    updatedAt: 1700000002000,
  },
  {
    uuid: 'seed-prob-valid-palindrome',
    title: 'Valid Palindrome',
    topic: 'Two Pointers',
    difficulty: 'Easy',
    description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
    status: 'Not Started',
    programUuid: null,
    createdAt: 1700000003000,
    updatedAt: 1700000003000,
  }
];

export async function seedInitialPracticeProblems(): Promise<PracticeProblem[]> {
  await db.transaction('rw', db.practiceProblems, async () => {
    const count = await db.practiceProblems.count();
    if (count === 0) {
      await db.practiceProblems.bulkPut(INITIAL_SEED_PRACTICE_PROBLEMS as PracticeProblem[]);
    }
  });

  return await db.practiceProblems.toArray();
}

export async function createPracticeProblem(
  data: Omit<PracticeProblem, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>
): Promise<PracticeProblem> {
  const now = Date.now();
  const newProblem: Omit<PracticeProblem, 'id'> = {
    ...data,
    uuid: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  const id = await db.practiceProblems.add(newProblem as PracticeProblem);
  return { ...newProblem, id } as PracticeProblem;
}

export async function updatePracticeProblem(
  uuid: string,
  updates: Partial<PracticeProblem>
): Promise<void> {
  const prob = await db.practiceProblems.where('uuid').equals(uuid).first();
  if (prob && prob.id) {
    await db.practiceProblems.update(prob.id, {
      ...updates,
      updatedAt: Date.now()
    });
  }
}

export async function deletePracticeProblem(uuid: string): Promise<void> {
  const prob = await db.practiceProblems.where('uuid').equals(uuid).first();
  if (prob && prob.id) {
    // Delete associated practice attempts for this practice problem (Section 8)
    await db.practiceAttempts.where('practiceProblemUuid').equals(uuid).delete();
    // Delete ONLY the practice problem record. Linked program remains untouched!
    await db.practiceProblems.delete(prob.id);
  }
}

// ─── Practice Attempt CRUD Operations ─────────────────────────

export async function getPracticeAttempts(practiceProblemUuid: string): Promise<PracticeAttempt[]> {
  return await db.practiceAttempts
    .where('practiceProblemUuid')
    .equals(practiceProblemUuid)
    .sortBy('attemptNumber');
}

export async function getNextAttemptNumber(practiceProblemUuid: string): Promise<number> {
  const attempts = await db.practiceAttempts
    .where('practiceProblemUuid')
    .equals(practiceProblemUuid)
    .toArray();

  if (attempts.length === 0) return 1;
  const maxAttempt = attempts.reduce((max, a) => Math.max(max, a.attemptNumber), 0);
  return maxAttempt + 1;
}

export async function createPracticeAttempt(
  attemptData: Omit<PracticeAttempt, 'id' | 'uuid' | 'attemptNumber' | 'createdAt'>
): Promise<PracticeAttempt> {
  const nextNumber = await getNextAttemptNumber(attemptData.practiceProblemUuid);
  const now = Date.now();
  const newAttempt: Omit<PracticeAttempt, 'id'> = {
    ...attemptData,
    uuid: crypto.randomUUID(),
    attemptNumber: nextNumber,
    createdAt: now,
  };
  const id = await db.practiceAttempts.add(newAttempt as PracticeAttempt);
  return { ...newAttempt, id } as PracticeAttempt;
}

export async function deletePracticeAttempt(uuid: string): Promise<void> {
  const attempt = await db.practiceAttempts.where('uuid').equals(uuid).first();
  if (attempt && attempt.id) {
    await db.practiceAttempts.delete(attempt.id);
  }
}

export async function clearPracticeAttempts(practiceProblemUuid: string): Promise<void> {
  await db.practiceAttempts.where('practiceProblemUuid').equals(practiceProblemUuid).delete();
}
