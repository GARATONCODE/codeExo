import { Router, Request, Response } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { userProgress, exercises, submissions } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// GET /progress/overview
router.get("/overview", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Total exercises
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(exercises);

    // Completed by language
    const completedRows = await db
      .select({
        language: userProgress.language,
        count: sql<number>`count(*)::int`,
      })
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.completed, true)))
      .groupBy(userProgress.language);

    const completedByLanguage: Record<string, number> = { c: 0, python: 0, typescript: 0 };
    for (const row of completedRows) {
      completedByLanguage[row.language] = row.count;
    }

    const totalCompleted = Object.values(completedByLanguage).reduce((a, b) => a + b, 0);

    // Streak calculation based on submission dates
    const streakRows = await db
      .select({ date: sql<string>`date(${submissions.createdAt} AT TIME ZONE 'UTC')` })
      .from(submissions)
      .where(and(eq(submissions.userId, userId), eq(submissions.passed, true)))
      .groupBy(sql`date(${submissions.createdAt} AT TIME ZONE 'UTC')`)
      .orderBy(desc(sql`date(${submissions.createdAt} AT TIME ZONE 'UTC')`));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < streakRows.length; i++) {
      const d = new Date(streakRows[i].date);
      d.setHours(0, 0, 0, 0);

      if (i === 0) {
        const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
        if (diffDays <= 1) {
          tempStreak = 1;
          currentStreak = 1;
        } else {
          tempStreak = 1;
        }
      } else {
        const prev = new Date(streakRows[i - 1].date);
        prev.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((prev.getTime() - d.getTime()) / 86400000);
        if (diffDays === 1) {
          tempStreak++;
          if (i <= currentStreak) currentStreak = tempStreak;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    res.json({
      success: true,
      data: {
        totalExercises: totalResult.count,
        completedByLanguage,
        totalCompleted,
        currentStreak,
        longestStreak,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// GET /progress/stats
router.get("/stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const [submissionCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(submissions)
      .where(eq(submissions.userId, userId));

    const [passedCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(submissions)
      .where(and(eq(submissions.userId, userId), eq(submissions.passed, true)));

    const successRate =
      submissionCount.count > 0
        ? Math.round((passedCount.count / submissionCount.count) * 100)
        : 0;

    // By difficulty
    const diffRows = await db
      .select({
        difficulty: exercises.difficulty,
        total: sql<number>`count(DISTINCT ${exercises.id})::int`,
        completed: sql<number>`count(DISTINCT CASE WHEN ${userProgress.completed} = true THEN ${exercises.id} END)::int`,
      })
      .from(exercises)
      .leftJoin(
        userProgress,
        and(eq(userProgress.exerciseId, exercises.id), eq(userProgress.userId, userId))
      )
      .groupBy(exercises.difficulty);

    const byDifficulty: Record<string, { completed: number; total: number }> = {
      easy: { completed: 0, total: 0 },
      medium: { completed: 0, total: 0 },
      hard: { completed: 0, total: 0 },
    };
    for (const row of diffRows) {
      byDifficulty[row.difficulty] = { completed: row.completed, total: row.total };
    }

    // Recent activity (last 30 days)
    const recentActivity = await db
      .select({
        date: sql<string>`date(${submissions.createdAt} AT TIME ZONE 'UTC')`,
        count: sql<number>`count(*)::int`,
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, userId),
          sql`${submissions.createdAt} >= now() - interval '30 days'`
        )
      )
      .groupBy(sql`date(${submissions.createdAt} AT TIME ZONE 'UTC')`)
      .orderBy(sql`date(${submissions.createdAt} AT TIME ZONE 'UTC')`);

    res.json({
      success: true,
      data: {
        totalSubmissions: submissionCount.count,
        successRate,
        byDifficulty,
        recentActivity,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// GET /progress/exercise/:exerciseId
router.get("/exercise/:exerciseId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const exerciseId = parseInt(req.params.exerciseId, 10);
    if (isNaN(exerciseId)) {
      res.status(400).json({ success: false, error: "ID invalide" });
      return;
    }

    const progress = await db
      .select()
      .from(userProgress)
      .where(
        and(eq(userProgress.userId, req.user!.userId), eq(userProgress.exerciseId, exerciseId))
      );

    res.json({ success: true, data: progress });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

export default router;
