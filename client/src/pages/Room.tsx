import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { socket } from "../lib/socket";
import { useAuthStore } from "../store/auth";
import { useRoomStore } from "../store/room";

export default function Room() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuthStore();
  const { sessionRole, participants, setRoom, setParticipants, clearRoom } = useRoomStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!code || !user) return;

    // Join via REST first (idempotent)
    api.post(`/rooms/${code}/join`)
      .then(({ data }) => {
        setRoom(code, data.room.title, data.sessionRole);

        // Then connect socket
        socket.connect();
        socket.emit("room:join", {
          roomCode: code,
          userId: user.id,
          name: user.name,
          role: data.sessionRole,
        });
      })
      .catch(() => navigate("/dashboard"));

    socket.on("room:presence", setParticipants);
    socket.on("room:user_left", ({ name }) => {
      console.log(`${name} left`);
    });

    return () => {
      socket.off("room:presence");
      socket.off("room:user_left");
      socket.disconnect();
      clearRoom();
    };
  }, [code, user]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <nav className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <span className="font-bold tracking-tight">mirror</span>
        <div className="flex items-center gap-3">
          {participants.map(p => (
            <div key={p.userId} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              <span className="text-sm text-zinc-300">{p.name}</span>
              <span className="text-xs text-zinc-500">({p.role})</span>
            </div>
          ))}
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900 text-violet-300 ml-2">
            {sessionRole}
          </span>
        </div>
      </nav>

      {/* Placeholder panels — Day 3 fills these */}
      <div className="flex-1 flex">
        <div className="flex-1 border-r border-zinc-800 flex items-center justify-center text-zinc-700">
          Code Editor — Day 3
        </div>
        <div className="w-80 flex flex-col">
          <div className="flex-1 border-b border-zinc-800 flex items-center justify-center text-zinc-700">
            Problem Panel — Day 3
          </div>
          {sessionRole === "INTERVIEWER" && (
            <div className="h-48 flex items-center justify-center text-zinc-700">
              Private Notepad — Day 4
            </div>
          )}
        </div>
      </div>
    </div>
  );
}