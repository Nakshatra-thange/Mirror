import { useState, useEffect } from "react";
import { api } from "../../lib/api";

interface ProblemSummary {
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
}

interface Props {
  roomCode: string;
  onSelect: (problem: any) => void;
}

const diffColor = { EASY: "text-green-400", MEDIUM: "text-yellow-400", HARD: "text-red-400" };

export default function ProblemPicker({ roomCode, onSelect }: Props) {
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/problems").then(r => setProblems(r.data));
  }, []);

  async function handleSelect(p: ProblemSummary) {
    setLoading(true);
    try {
      // Fetch full problem
      const { data: full } = await api.get(`/problems/${p.id}`);
      // Assign to room
      await api.post(`/problems/room/${roomCode}/assign`, { problemId: p.id });
      onSelect(full);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700
                   rounded-md text-zinc-300 transition-colors flex items-center gap-1.5">
        <span>Swap Problem</span>
        <span className="text-zinc-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-72 bg-zinc-900 border border-zinc-700 rounded-xl
                        shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-800">
            <p className="text-xs text-zinc-500 font-medium">Select a problem</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {problems.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                disabled={loading}
                className="w-full text-left px-3 py-2.5 hover:bg-zinc-800 transition-colors
                           border-b border-zinc-800/50 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-200">{p.title}</span>
                  <span className={`text-xs font-medium ${diffColor[p.difficulty]}`}>
                    {p.difficulty}
                  </span>
                </div>
                <div className="flex gap-1 mt-1">
                  {p.tags.slice(0, 3).map(t => (
                    <span key={t} className="text-xs text-zinc-600">{t}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}