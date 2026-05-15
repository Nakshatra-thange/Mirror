import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import cors from "cors";
interface RoomPresence {
    [roomCode: string]: {
      [socketId: string]: { 
        userId: string;
         name: string; 
         role: string };
    };
  }

  const presence : RoomPresence= {};
  export function initSocket(httpServer : HttpServer, clientUrl: String){
    const io = new Server(httpServer, {
        cors: { origin: clientUrl, methods: ["GET", "POST"] },
      })

      io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("room:join", ({ roomCode, userId, name, role }) => {
            socket.join(roomCode);
      
        if (!presence[roomCode]) presence[roomCode] = {};
            presence[roomCode][socket.id] = { userId, name, role };
      
            // Broadcast updated presence to everyone in room
        io.to(roomCode).emit("room:presence", Object.values(presence[roomCode]));
      
        console.log(`${name} (${role}) joined room ${roomCode}`);
    });

    socket.on("room:ping", ({ roomCode }) => {
        socket.to(roomCode).emit("room:pong", { from: socket.id });
      });

      socket.on("disconnect", () => {
        for (const roomCode in presence) {
          if (presence[roomCode][socket.id]) {
            const user = presence[roomCode][socket.id];
            delete presence[roomCode][socket.id];
            io.to(roomCode).emit("room:presence", Object.values(presence[roomCode]));
            io.to(roomCode).emit("room:user_left", { userId: user.userId, name: user.name });
            console.log(`${user.name} left room ${roomCode}`);
          }
        }
      });
    });
    return io;
  }