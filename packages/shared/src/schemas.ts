import { z } from "zod";
import { LANGUAGES, DIFFICULTIES } from "./constants.js";

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  username: z
    .string()
    .min(3, "Minimum 3 caractères")
    .max(30, "Maximum 30 caractères")
    .regex(/^[a-zA-Z0-9_-]+$/, "Lettres, chiffres, - et _ uniquement"),
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .max(128, "Maximum 128 caractères"),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Token requis"),
});

// Exercise schemas
export const exerciseFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  difficulty: z.enum(DIFFICULTIES).optional(),
  language: z.enum(LANGUAGES).optional(),
  search: z.string().max(100).optional(),
  tag: z.string().max(50).optional(),
});

// Submission schemas
export const submitCodeSchema = z.object({
  exerciseId: z.number().int().positive(),
  language: z.enum(LANGUAGES),
  code: z.string().min(1, "Code requis").max(50_000, "Code trop long"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ExerciseFilterInput = z.infer<typeof exerciseFilterSchema>;
export type SubmitCodeInput = z.infer<typeof submitCodeSchema>;
