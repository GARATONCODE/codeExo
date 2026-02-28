import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 30 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  difficulty: varchar("difficulty", { length: 10 }).notNull(), // easy, medium, hard
  orderIndex: integer("order_index").notNull().default(0),
  tags: jsonb("tags").notNull().default([]),
  templateC: text("template_c").notNull().default(""),
  templatePython: text("template_python").notNull().default(""),
  templateTypescript: text("template_typescript").notNull().default(""),
  testsC: text("tests_c").notNull().default(""),
  testsPython: text("tests_python").notNull().default(""),
  testsTypescript: text("tests_typescript").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  language: varchar("language", { length: 20 }).notNull(),
  code: text("code").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  output: text("output"),
  passed: boolean("passed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userProgress = pgTable(
  "user_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    language: varchar("language", { length: 20 }).notNull(),
    completed: boolean("completed").notNull().default(false),
    attempts: integer("attempts").notNull().default(0),
    bestTimeMs: integer("best_time_ms"),
  },
  (table) => ({
    uniqueUserExerciseLang: uniqueIndex("uq_user_exercise_lang").on(
      table.userId,
      table.exerciseId,
      table.language
    ),
  })
);

export const dailyExercises = pgTable("daily_exercises", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  date: date("date").notNull().unique(),
});
