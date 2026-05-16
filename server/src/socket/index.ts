import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { prisma } from "../lib/prisma.js";

interface RoomPresence {
  [roomCode: string]: {
    [socketId: string]: { userId: string; name: string; role: string };
  };
}

const presence: RoomPresence = {};

// Autosave buffer — flush to DB every 5s
const codeBuffer: { [roomCode: string]: { code: string; language: string; dirty: boolean } } = {};

export function initSocket(httpServer: HttpServer) {
  const clientUrl = process.env.CLIENT_URL as string;

  const io = new Server(httpServer, {
    cors: { origin: clientUrl, methods: ["GET", "POST"] },
  });

  // Autosave interval
  setInterval(async () => {
    for (const roomCode in codeBuffer) {
      const buf = codeBuffer[roomCode];
      if (!buf.dirty) continue;
      try {
        await prisma.room.update({
          where: { code: roomCode },
          data: { currentCode: buf.code, currentLanguage: buf.language },
        });
        buf.dirty = false;
      } catch {
        // room may have ended, ignore
      }
    }
  }, 5000);

  io.on("connection", (socket) => {

    // ── Presence ──────────────────────────────────────────
    socket.on("room:join", ({ roomCode, userId, name, role }) => {
      socket.join(roomCode);
      if (!presence[roomCode]) presence[roomCode] = {};
      presence[roomCode][socket.id] = { userId, name, role };
      io.to(roomCode).emit("room:presence", Object.values(presence[roomCode]));
    });

    socket.on("room:problem_set", ({ roomCode, problem }) => {
      // Broadcast to everyone including sender's other tab,
      // but skip candidate seeing interviewer-only events
      socket.to(roomCode).emit("room:problem_set", { problem });
    });

    socket.on("notepad:save", async ({ roomCode, userId, notes }) => {
      try {
        await prisma.session.updateMany({
          where: { room: { code: roomCode }, userId },
          data: { interviewerNotes: notes },
        });
      } catch {
        // session may not exist yet
      }
    });

    

    socket.on("room:ping", ({ roomCode }) => {
      socket.to(roomCode).emit("room:pong", { from: socket.id });
    });

    // ── Editor sync ───────────────────────────────────────
    // Send current code to newly joined user
    socket.on("editor:request_sync", ({ roomCode }) => {
      if (codeBuffer[roomCode]) {
        socket.emit("editor:full_sync", {
          code: codeBuffer[roomCode].code,
          language: codeBuffer[roomCode].language,
        });
      }
    });

    // Broadcast code change to everyone else in room
    socket.on("editor:change", ({ roomCode, code, language }) => {
      if (!codeBuffer[roomCode]) {
        codeBuffer[roomCode] = { code, language, dirty: true };
      } else {
        codeBuffer[roomCode].code = code;
        codeBuffer[roomCode].language = language;
        codeBuffer[roomCode].dirty = true;
      }
      // Broadcast to everyone except sender
      socket.to(roomCode).emit("editor:change", { code, language });
    });

    // Language change
    socket.on("editor:language_change", ({ roomCode, language }) => {
      if (codeBuffer[roomCode]) codeBuffer[roomCode].language = language;
      socket.to(roomCode).emit("editor:language_change", { language });
    });

    // ── Cursor positions ──────────────────────────────────
    socket.on("editor:cursor", ({ roomCode, cursor, userId, name }) => {
      socket.to(roomCode).emit("editor:cursor", { cursor, userId, name, socketId: socket.id });
    });

    // ── Disconnect ────────────────────────────────────────
    socket.on("disconnect", () => {
      for (const roomCode in presence) {
        if (presence[roomCode][socket.id]) {
          const user = presence[roomCode][socket.id];
          delete presence[roomCode][socket.id];
          io.to(roomCode).emit("room:presence", Object.values(presence[roomCode]));
          io.to(roomCode).emit("room:user_left", { userId: user.userId, name: user.name });
          // Remove cursor decoration for this socket
          io.to(roomCode).emit("editor:cursor_remove", { socketId: socket.id });
        }
      }
    });
  });

  return io;
}