import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

export default function Join() {
  const { code } = useParams<{ code: string }>();
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [room, setRoom] = useState<{ title: string; status: string } | null>(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!token) {
      // Save intended destination, redirect to login
      sessionStorage.setItem("mirror_redirect", `/join/${code}`);
      navigate("/login");
      return;
    }
    api.get(`/rooms/${code}`).then(r => setRoom(r.data)).catch(() => setError("Room not found"));
  }, [code, token]);

  async function handleJoin() {
    setJoining(true);
    try {
      await api.post(`/rooms/${code}/join`);
      navigate(`/room/${code}`);
    } catch (e: any) {
      setError(e.response?.data?.error || "Could not join");
      setJoining(false);
    }
  }

  if (error) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
      <div className="text-center">
        <p className="text-red-400 text-lg">{error}</p>
        <button onClick={() => navigate("/dashboard")} className="mt-4 text-zinc-400 hover:text-white text-sm">
          Go to dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-full max-w-sm p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-white">
        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">You're invited to</p>
        <h1 className="text-2xl font-bold mb-1">{room?.title ?? "Loading..."}</h1>
        <p className="text-zinc-500 text-sm font-mono mb-6">{code}</p>
        {room?.status === "ENDED" ? (
          <p className="text-red-400 text-sm">This room has ended.</p>
        ) : (
          <button onClick={handleJoin} disabled={joining || !room}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg font-medium transition-colors">
            {joining ? "Joining..." : `Join as ${user?.role === "INTERVIEWER" ? "Interviewer" : "Candidate"}`}
          </button>
        )}
      </div>
    </div>
  );
}