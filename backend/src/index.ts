import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { logger } from "./lib/logger.js";
import authRouter from "./routes/auth.js";
import exercisesRouter from "./routes/exercises.js";
import submissionsRouter from "./routes/submissions.js";
import progressRouter from "./routes/progress.js";
import dailyRouter from "./routes/daily.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "1mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/v1/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use("/api/v1", limiter);

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/exercises", exercisesRouter);
app.use("/api/v1/submissions", submissionsRouter);
app.use("/api/v1/progress", progressRouter);
app.use("/api/v1/daily", dailyRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err);
  res.status(500).json({ success: false, error: "Erreur interne du serveur" });
});

app.listen(PORT, () => {
  logger.info(`Backend running on http://localhost:${PORT}`);
});

export default app;
