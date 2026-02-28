import { Router, Request, Response } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { dailyExercises, exercises } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// GET /daily/today
router.get("/today", authMiddleware, async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Check if daily exercise exists for today
    let [daily] = await db
      .select()
      .from(dailyExercises)
      .where(eq(dailyExercises.date, today))
      .limit(1);

    // If not, select one deterministically
    if (!daily) {
      const allExercises = await db
        .select({ id: exercises.id })
        .from(exercises)
        .orderBy(exercises.orderIndex);

      if (allExercises.length === 0) {
        res.status(404).json({ success: false, error: "Aucun exercice disponible" });
        return;
      }

      // Deterministic selection based on date
      const daysSinceEpoch = Math.floor(Date.now() / 86400000);
      const index = daysSinceEpoch % allExercises.length;
      const selectedId = allExercises[index].id;

      [daily] = await db
        .insert(dailyExercises)
        .values({ exerciseId: selectedId, date: today })
        .onConflictDoNothing()
        .returning();

      // Re-fetch if conflict
      if (!daily) {
        [daily] = await db
          .select()
          .from(dailyExercises)
          .where(eq(dailyExercises.date, today))
          .limit(1);
      }
    }

    // Fetch full exercise
    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, daily.exerciseId))
      .limit(1);

    res.json({
      success: true,
      data: { ...daily, exercise },
    });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// GET /daily/history
router.get("/history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 30;

    const history = await db
      .select({
        id: dailyExercises.id,
        exerciseId: dailyExercises.exerciseId,
        date: dailyExercises.date,
        exerciseTitle: exercises.title,
        exerciseDifficulty: exercises.difficulty,
        exerciseSlug: exercises.slug,
      })
      .from(dailyExercises)
      .innerJoin(exercises, eq(dailyExercises.exerciseId, exercises.id))
      .orderBy(desc(dailyExercises.date))
      .limit(limit);

    res.json({ success: true, data: history });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

export default router;
