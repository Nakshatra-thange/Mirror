import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /sessions — list all sessions for current user's hosted rooms
router.get("/", authenticate, async (req: AuthRequest, res) => {
  const sessions = await prisma.session.findMany({
    where: { room: { hostId: req.user!.id } },
    include: {
      room: { select: { code: true, title: true, activeProblem: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { startedAt: "desc" },
  });
  return res.json(sessions);
});

// GET /sessions/:id — single session
router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  const session = await prisma.session.findUnique({
    where: { id: req.params.id as string },
    include: {
      room: { select: { code: true, title: true, activeProblem: true } },
      user: { select: { name: true, email: true } },
    },
  });
  if (!session) return res.status(404).json({ error: "Session not found" });
  return res.json(session);
});

// PATCH /sessions/:id/feedback — save feedback form
router.patch("/:id/feedback", authenticate, async (req: AuthRequest, res) => {
  const {
    verdict,
    rating,
    communicationScore,
    problemSolvingScore,
    codeQualityScore,
    feedbackSummary,
    strengths,
    improvements,
  } = req.body;

  const session = await prisma.session.update({
    where: { id: req.params.id as string},
    data: {
      verdict,
      rating,
      communicationScore,
      problemSolvingScore,
      codeQualityScore,
      feedbackSummary,
      strengths,
      improvements,
      feedbackLockedAt: new Date(),
    },
    include: {
      room: { select: { code: true, title: true, activeProblem: true } },
      user: { select: { name: true, email: true } },
    },
  });

  return res.json(session);
});

export default router;