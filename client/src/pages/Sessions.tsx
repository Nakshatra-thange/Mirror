import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

interface Session {
  id: string;
  startedAt: string;
  endedAt: string | null;
  verdict: string | null;
  rating: number | null;
  feedbackLockedAt: string | null;
  user: { name: string; email: string };
  room: { title: string; code: string };
}

const verdictColor: Record<string, string> = {
  STRONG_HIRE:    "text-green-400 bg-green-400/10 border-green-400/20",
  HIRE:           "text-blue-400  bg-blue-400/10  border-blue-400/20",
  NO_HIRE:        "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  STRONG_NO_HIRE: "text-red-400   bg-red-400/10   border-red-400/20",
};

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/sessions").then(r => setSessions(r.data));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="border-b border-zinc-800 px-8 py-4 flex items-center justify-between">
        <span className="font-bold tracking-tight text-sm">mirror</span>
        <button onClick={() => navigate("/dashboard")}
          className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Dashboard
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-10">
        <h1 className="text-xl font-bold mb-6">Past Sessions</h1>

        {sessions.length === 0 ? (
          <p className="text-zinc-600 text-sm">No sessions yet.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id}
                className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl
                           hover:border-zinc-700 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{s.room.title}</p>
                    <p className="text-zinc-400 text-sm mt-0.5">
                      {s.user.name}
                      <span className="text-zinc-600 ml-2 text-xs">{s.user.email}</span>
                    </p>
                    <p className="text-zinc-600 text-xs font-mono mt-1">
                      {new Date(s.startedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {s.verdict ? (
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium
                        ${verdictColor[s.verdict] ?? "text-zinc-400 bg-zinc-800 border-zinc-700"}`}>
                        {s.verdict.replace("_", " ")}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">No verdict</span>
                    )}
                    {s.rating && (
                      <span className="text-yellow-400 text-xs">
                        {"★".repeat(s.rating)}{"☆".repeat(5 - s.rating)}
                      </span>
                    )}
                    <button
                      onClick={() => navigate(`/feedback/${s.id}`)}
                      className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700
                                 rounded-md transition-colors text-zinc-300">
                      {s.feedbackLockedAt ? "View Report" : "Add Feedback"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}