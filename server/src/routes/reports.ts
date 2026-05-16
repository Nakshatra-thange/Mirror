import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { generatePDF } from "../lib/pdf.js";

const router = Router();

// GET /reports/:sessionId/pdf — stream PDF
router.get("/:sessionId/pdf", authenticate, async (req: AuthRequest, res) => {
  const session = await prisma.session.findUnique({
    where: { id: req.params.sessionId as string},
    include: {
      room: { select: { code: true, title: true, activeProblem: true } },
      user: { select: { name: true, email: true } },
    },
  });

  if (!session) return res.status(404).json({ error: "Session not found" });

  // Only the room host can download
  const room = await prisma.room.findUnique({ where: { id: session.roomId } });
  if (room?.hostId !== req.user!.id) {
    return res.status(403).json({ error: "Not authorized" });
  }

  generatePDF(session as any, res);
});

export default router;