export const LANGUAGES = ["c", "python", "typescript"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const SUBMISSION_STATUSES = ["pending", "running", "success", "failure", "error", "timeout"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const LANGUAGE_EXTENSIONS: Record<Language, string> = {
  c: ".c",
  python: ".py",
  typescript: ".ts",
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  c: "C",
  python: "Python",
  typescript: "TypeScript",
};

export const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export const MAX_CODE_LENGTH = 50_000;
export const MAX_EXECUTION_TIME_MS = 10_000;
export const EXERCISES_PER_PAGE = 20;
