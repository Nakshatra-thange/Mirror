import { Router } from "express";
import rateLimit from "express-rate-limit";
import { runCode } from "../lib/judge0.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

// Rate limit — 10 runs per user per minute
// Stays well within Judge0 free tier (50/day)
const executeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req: any) => req.user?.id ?? req.ip,
  handler: (_, res) => res.status(429).json({ error: "Too many runs. Wait a moment." }),
});

router.post("/", authenticate, executeLimiter, async (req: AuthRequest, res) => {
  const { code, language, stdin, roomCode } = req.body;
  if (!code || !language) return res.status(400).json({ error: "code and language required" });

  try {
    const result = await runCode(code, language, stdin ?? "");

    // Persist final code to session if roomCode provided
    if (roomCode) {
      await prisma.session.updateMany({
        where: { room: { code: roomCode }, userId: req.user!.id },
        data: { finalCode: code },
      });
    }

    return res.json(result);
  } catch (err: any) {
    console.error("Judge0 error:", err.message);
    return res.status(500).json({ error: err.message ?? "Execution failed" });
  }
});

export default router;