import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.get("/",authenticate, async (_, res)=>{
    const problems = await prisma.problem.findMany({
        orderBy : {createdAt : "desc"},
        select: { id: true, title: true, difficulty: true, tags: true },
    });
    return res.json(problems);
});

router.get("/:id",authenticate , async(req,res)=>{
    const problem = await prisma.problem.findUnique({ where: { id: req.params.id } });
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    return res.json(problem);
})

router.post("/",authenticate, async (req: AuthRequest, res)=>{
    if (req.user?.role !== "INTERVIEWER") {
        return res.status(403).json({ error: "Interviewers only" });
      }
      const { title, description, starterCode, difficulty, tags } = req.body;
      if (!title || !description) return res.status(400).json({ error: "Title and description required" });
    
      const problem = await prisma.problem.create({
        data: { title, description, starterCode: starterCode ?? "", difficulty, tags: tags ?? [] },
      });
      return res.status(201).json(problem);
});

router.patch("/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== "INTERVIEWER") return res.status(403).json({ error: "Interviewers only" });
    const problem = await prisma.problem.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.json(problem);
  });

  router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== "INTERVIEWER") return res.status(403).json({ error: "Interviewers only" });
    await prisma.problem.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  });
  
  // POST /problems/room/:code/assign — assign problem to room
  router.post("/room/:code/assign", authenticate, async (req: AuthRequest, res) => {
    if (req.user?.role !== "INTERVIEWER") return res.status(403).json({ error: "Interviewers only" });
    const { problemId } = req.body;
  
    const room = await prisma.room.findUnique({ where: { code: req.params.code } });
    if (!room) return res.status(404).json({ error: "Room not found" });
  
    // Set as active problem on room
    const updated = await prisma.room.update({
      where: { code: req.params.code },
      data: { activeProblemId: problemId },
    });
  
    return res.json(updated);
  });
  
  export default router;