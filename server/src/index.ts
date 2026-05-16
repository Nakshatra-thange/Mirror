import "dotenv/config";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/rooms.js";
import { initSocket } from "./socket/index.js";
import problemRoutes from "./routes/problems.js";
const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/problems", problemRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok", app: "mirror" }));
initSocket(httpServer, process.env.CLIENT_URL!);
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Mirror server running on :${PORT}`));