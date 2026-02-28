import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { registerSchema, loginSchema, refreshSchema } from "@site-exo/shared";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../lib/jwt.js";
import { validate } from "../middleware/validate.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// POST /auth/register
router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ success: false, error: "Email déjà utilisé" });
      return;
    }

    const existingUsername = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUsername.length > 0) {
      res.status(409).json({ success: false, error: "Nom d'utilisateur déjà pris" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({ email, username, passwordHash })
      .returning({ id: users.id, email: users.email, username: users.username });

    const payload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, username: user.username },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// POST /auth/login
router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      res.status(401).json({ success: false, error: "Identifiants invalides" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, error: "Compte désactivé" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: "Identifiants invalides" });
      return;
    }

    const payload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, username: user.username },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// POST /auth/refresh
router.post("/refresh", validate(refreshSchema), async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const payload = verifyToken(refreshToken);

    const [user] = await db
      .select({ id: users.id, email: users.email, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: "Token invalide" });
      return;
    }

    const newPayload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch {
    res.status(401).json({ success: false, error: "Token invalide ou expiré" });
  }
});

// GET /auth/me
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ success: false, error: "Utilisateur non trouvé" });
      return;
    }

    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

export default router;
