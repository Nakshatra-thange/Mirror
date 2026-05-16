import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

interface Room {
  id: string;
  code: string;
  title: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (user?.role === "INTERVIEWER") {
      api.get("/rooms").then(r => setRooms(r.data));
    }
  }, [user]);

  async function createRoom() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post("/rooms", { title });
      setRooms(prev => [data, ...prev]);
      setTitle("");
    } finally {
      setCreating(false);
    }
  }

  async function joinRoom() {
    if (!joinCode.trim()) return;
    try {
      await api.post(`/rooms/${joinCode.trim().toUpperCase()}/join`);
      navigate(`/room/${joinCode.trim().toUpperCase()}`);
    } catch (e: any) {
      alert(e.response?.data?.error || "Could not join room");
    }
  }

  function copyLink(code: string) {
    navigator.clipboard.writeText(`${window.location.origin}/join/${code}`);
  }

  const statusColor = (s: string) =>
    s === "ACTIVE" ? "text-green-400" : s === "ENDED" ? "text-zinc-500" : "text-yellow-400";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="border-b border-zinc-800 px-8 py-4 flex justify-between items-center">
        <span className="text-xl font-bold tracking-tight">mirror</span>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">{user?.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900 text-violet-300">{user?.role}</span>
          <button onClick={logout} className="text-zinc-500 hover:text-white text-sm transition-colors">Sign out</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12 space-y-10">

        {/* Join a room — available to everyone */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">Join a Room</h2>
          <div className="flex gap-3">
            <input
              placeholder="Enter room code (e.g. MX7K9P2Q)"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && joinRoom()}
              className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
            />
            <button onClick={joinRoom}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium transition-colors">
              Join
            </button>
          </div>
        </section>

        {/* Create room — interviewers only */}
        {user?.role === "INTERVIEWER" && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">Create a Room</h2>
            <div className="flex gap-3">
              <input
                placeholder="Interview title (e.g. Frontend Engineer Round 2)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createRoom()}
                className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
              />
              <button onClick={createRoom} disabled={creating}
                className="px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors disabled:opacity-50">
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </section>
        )}
        <div className="flex items-center gap-4">
  <span className="text-zinc-400 text-sm">{user?.name}</span>
  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900 text-violet-300">{user?.role}</span>
  {user?.role === "INTERVIEWER" && (
    <button onClick={() => navigate("/sessions")}
      className="text-zinc-400 hover:text-white text-sm transition-colors">
      Sessions
    </button>
  )}
  <button onClick={logout} className="text-zinc-500 hover:text-white text-sm transition-colors">
    Sign out
  </button>
</div>

        {/* Room list — interviewers only */}
        {user?.role === "INTERVIEWER" && rooms.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">Your Rooms</h2>
            <div className="space-y-2">
              {rooms.map(room => (
                <div key={room.id}
                  className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                  <div>
                    <p className="font-medium text-white">{room.title}</p>
                    <p className="text-zinc-500 text-sm font-mono mt-0.5">{room.code}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${statusColor(room.status)}`}>{room.status}</span>
                    <button onClick={() => copyLink(room.code)}
                      className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors">
                      Copy link
                    </button>
                    <button onClick={() => navigate(`/room/${room.code}`)}
                      className="text-xs px-3 py-1 bg-violet-700 hover:bg-violet-600 rounded-md transition-colors">
                      Enter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}