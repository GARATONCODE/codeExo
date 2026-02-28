import { Router, Request, Response } from "express";
import { eq, ilike, sql, and, SQL } from "drizzle-orm";
import { exerciseFilterSchema } from "@site-exo/shared";
import { db } from "../db/index.js";
import { exercises } from "../db/schema.js";
import { validate } from "../middleware/validate.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// GET /exercises
router.get("/", authMiddleware, validate(exerciseFilterSchema, "query"), async (req: Request, res: Response) => {
  try {
    const { page, pageSize, difficulty, search, tag } = req.query as any;

    const conditions: SQL[] = [];
    if (difficulty) conditions.push(eq(exercises.difficulty, difficulty));
    if (search) conditions.push(ilike(exercises.title, `%${search}%`));
    if (tag) conditions.push(sql`${exercises.tags} @> ${JSON.stringify([tag])}::jsonb`);

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(exercises)
      .where(where);

    const total = countResult.count;
    const offset = (page - 1) * pageSize;

    const data = await db
      .select({
        id: exercises.id,
        slug: exercises.slug,
        title: exercises.title,
        difficulty: exercises.difficulty,
        orderIndex: exercises.orderIndex,
        tags: exercises.tags,
      })
      .from(exercises)
      .where(where)
      .orderBy(exercises.orderIndex)
      .limit(pageSize)
      .offset(offset);

    res.json({
      success: true,
      data: {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// GET /exercises/:id
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: "ID invalide" });
      return;
    }

    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, id))
      .limit(1);

    if (!exercise) {
      res.status(404).json({ success: false, error: "Exercice non trouvé" });
      return;
    }

    res.json({ success: true, data: exercise });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// GET /exercises/:id/template/:lang
router.get("/:id/template/:lang", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const lang = req.params.lang;

    if (isNaN(id)) {
      res.status(400).json({ success: false, error: "ID invalide" });
      return;
    }

    if (!["c", "python", "typescript"].includes(lang)) {
      res.status(400).json({ success: false, error: "Langage invalide" });
      return;
    }

    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, id))
      .limit(1);

    if (!exercise) {
      res.status(404).json({ success: false, error: "Exercice non trouvé" });
      return;
    }

    const templateMap: Record<string, string> = {
      c: exercise.templateC,
      python: exercise.templatePython,
      typescript: exercise.templateTypescript,
    };

    res.json({
      success: true,
      data: { template: templateMap[lang], language: lang },
    });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

export default router;
