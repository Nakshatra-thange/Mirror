import { Router } from "express";
import { nanoid } from "nanoid"; // npm install nanoid
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.post("/", authenticate, async (req: AuthRequest, res) => {
  const { title } = req.body;
  const room = await prisma.room.create({
    data: {
      title,
      code: nanoid(8).toUpperCase(),
      hostId: req.user!.id,
    },
  });
  return res.status(201).json(room);
});

router.get("/:code", authenticate, async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { code: req.params.code },
    include: { host: { select: { id: true, name: true } }, problems: { include: { problem: true } } },
  });
  if (!room) return res.status(404).json({ error: "Room not found" });
  return res.json(room);
});

// List rooms hosted by current user
router.get("/", authenticate, async (req: AuthRequest, res) => {
  const rooms = await prisma.room.findMany({
    where: { hostId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  return res.json(rooms);
});

export default router;