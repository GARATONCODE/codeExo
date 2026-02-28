import type { Language, Difficulty, SubmissionStatus } from "./constants.js";

export interface User {
  id: number;
  email: string;
  username: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  orderIndex: number;
  tags: string[];
  templateC: string;
  templatePython: string;
  templateTypescript: string;
  testsC: string;
  testsPython: string;
  testsTypescript: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseListItem {
  id: number;
  slug: string;
  title: string;
  difficulty: Difficulty;
  orderIndex: number;
  tags: string[];
}

export interface Submission {
  id: number;
  userId: number;
  exerciseId: number;
  language: Language;
  code: string;
  status: SubmissionStatus;
  output: string | null;
  passed: boolean;
  createdAt: string;
}

export interface UserProgress {
  id: number;
  userId: number;
  exerciseId: number;
  language: Language;
  completed: boolean;
  attempts: number;
  bestTimeMs: number | null;
}

export interface DailyExercise {
  id: number;
  exerciseId: number;
  date: string;
  exercise?: Exercise;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ProgressOverview {
  totalExercises: number;
  completedByLanguage: Record<Language, number>;
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
}

export interface ProgressStats {
  totalSubmissions: number;
  successRate: number;
  byDifficulty: Record<Difficulty, { completed: number; total: number }>;
  recentActivity: { date: string; count: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
