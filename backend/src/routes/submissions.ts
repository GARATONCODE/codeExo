import { Router, Request, Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { submitCodeSchema } from "@site-exo/shared";
import { db } from "../db/index.js";
import { submissions, exercises, userProgress } from "../db/schema.js";
import { runCode } from "../lib/runner.js";
import { validate } from "../middleware/validate.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// POST /submissions
router.post("/", authMiddleware, validate(submitCodeSchema), async (req: Request, res: Response) => {
  try {
    const { exerciseId, language, code } = req.body;
    const userId = req.user!.userId;

    // Fetch exercise + tests
    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, exerciseId))
      .limit(1);

    if (!exercise) {
      res.status(404).json({ success: false, error: "Exercice non trouvé" });
      return;
    }

    const testsMap: Record<string, string> = {
      c: exercise.testsC,
      python: exercise.testsPython,
      typescript: exercise.testsTypescript,
    };

    const tests = testsMap[language];
    if (!tests) {
      res.status(400).json({ success: false, error: "Pas de tests pour ce langage" });
      return;
    }

    // Create submission record
    const [submission] = await db
      .insert(submissions)
      .values({ userId, exerciseId, language, code, status: "running" })
      .returning();

    // Run code
    const result = await runCode(language as any, code, tests);

    // Update submission
    await db
      .update(submissions)
      .set({ status: result.status, output: result.output, passed: result.passed })
      .where(eq(submissions.id, submission.id));

    // Update progress
    const [existing] = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.exerciseId, exerciseId),
          eq(userProgress.language, language)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(userProgress)
        .set({
          attempts: existing.attempts + 1,
          completed: existing.completed || result.passed,
        })
        .where(eq(userProgress.id, existing.id));
    } else {
      await db.insert(userProgress).values({
        userId,
        exerciseId,
        language,
        completed: result.passed,
        attempts: 1,
      });
    }

    res.json({
      success: true,
      data: {
        id: submission.id,
        status: result.status,
        output: result.output,
        passed: result.passed,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// GET /submissions
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(submissions)
      .where(eq(submissions.userId, userId));

    const data = await db
      .select()
      .from(submissions)
      .where(eq(submissions.userId, userId))
      .orderBy(desc(submissions.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    res.json({
      success: true,
      data: {
        data,
        total: countResult.count,
        page,
        pageSize,
        totalPages: Math.ceil(countResult.count / pageSize),
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// GET /submissions/:id
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: "ID invalide" });
      return;
    }

    const [submission] = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.id, id), eq(submissions.userId, req.user!.userId)))
      .limit(1);

    if (!submission) {
      res.status(404).json({ success: false, error: "Soumission non trouvée" });
      return;
    }

    res.json({ success: true, data: submission });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

export default router;
