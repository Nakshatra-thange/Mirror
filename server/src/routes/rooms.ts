import { Router } from "express";
import { nanoid } from "nanoid";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

// POST /rooms — create room (interviewer becomes host)
router.post("/", authenticate, async (req: AuthRequest, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });

  const room = await prisma.room.create({
    data: {
      title,
      code: nanoid(8).toUpperCase(),
      hostId: req.user!.id,
      interviewerId: req.user!.id,
      status: "WAITING",
    },
  });

  return res.status(201).json(room);
});

// GET /rooms — list rooms hosted by current user
router.get("/", authenticate, async (req: AuthRequest, res) => {
  const rooms = await prisma.room.findMany({
    where: { hostId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  return res.json(rooms);
});

// GET /rooms/:code — get room by code
router.get("/:code", authenticate, async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { code: req.params.code as string},
    include: {
      host: { select: { id: true, name: true } },
      problems: { include: { problem: true }, orderBy: { order: "asc" } },
      sessions: { select: { userId: true, interviewerNotes: true } },
      activeProblem: true,
    },
  });
  if (!room) return res.status(404).json({ error: "Room not found" });
  return res.json(room);
});

// POST /rooms/:code/join — candidate joins, assigns role
router.post("/:code/join", authenticate, async (req: AuthRequest, res) => {
  const room = await prisma.room.findUnique({ where: { code: req.params.code as string} });
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.status === "ENDED") return res.status(410).json({ error: "Room has ended" });

  const userId = req.user!.id;

  // Already the interviewer
  if (room.interviewerId === userId) {
    return res.json({ room, sessionRole: "INTERVIEWER" });
  }

  // Slot is free — assign as candidate
  if (!room.candidateId) {
    const updated = await prisma.room.update({
      where: { code: req.params.code as string},
      data: {
        candidateId: userId,
        status: "ACTIVE",
      },
    });

    // Create session record
    await prisma.session.upsert({
      where: { roomId_userId: { roomId: room.id, userId } },
      update: {},
      create: { roomId: room.id, userId },
    });

    return res.json({ room: updated, sessionRole: "CANDIDATE" });
  }

  // Already the candidate
  if (room.candidateId === userId) {
    return res.json({ room, sessionRole: "CANDIDATE" });
  }

  return res.status(409).json({ error: "Room is full" });
});

// PATCH /rooms/:code/end — interviewer ends session
router.patch("/:code/end", authenticate, async (req: AuthRequest, res) => {
  const room = await prisma.room.findUnique({
    where: { code: req.params.code as string},
    include: { sessions: true },
  });
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.interviewerId !== req.user!.id) {
    return res.status(403).json({ error: "Only interviewer can end" });
  }

  // Lock room + snapshot final state
  const updated = await prisma.room.update({
    where: { code: req.params.code as string},
    data: { status: "ENDED", isActive: false },
  });

  // Stamp endedAt on all sessions
  await prisma.session.updateMany({
    where: { roomId: room.id, endedAt: null },
    data: {
      endedAt: new Date(),
      finalCode: room.currentCode,
      language: room.currentLanguage,
    },
  });

  return res.json(updated);
});
export default router;