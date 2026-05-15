import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/rooms.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok", app: "mirror" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Mirror server running on :${PORT}`));