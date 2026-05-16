import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type Verdict = "STRONG_HIRE" | "HIRE" | "NO_HIRE" | "STRONG_NO_HIRE";

interface Session {
  id: string;
  user: { name: string; email: string };
  room: { title: string; code: string };
  finalCode: string;
  language: string;
  interviewerNotes: string;
  verdict: Verdict | null;
  feedbackSummary: string;
  strengths: string;
  improvements: string;
  rating: number | null;
  communicationScore: number | null;
  problemSolvingScore: number | null;
  codeQualityScore: number | null;
  feedbackLockedAt: string | null;
}

const VERDICTS: { value: Verdict; label: string; color: string }[] = [
  { value: "STRONG_HIRE",    label: "Strong Hire",    color: "bg-green-600"  },
  { value: "HIRE",           label: "Hire",           color: "bg-blue-600"   },
  { value: "NO_HIRE",        label: "No Hire",        color: "bg-yellow-600" },
  { value: "STRONG_NO_HIRE", label: "Strong No Hire", color: "bg-red-600"    },
];

function StarRating({ value, onChange, label }: {
  value: number | null; onChange: (v: number) => void; label: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-400 w-40">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`text-lg transition-colors ${n <= (value ?? 0) ? "text-yellow-400" : "text-zinc-700 hover:text-zinc-500"}`}>
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Feedback() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const [form, setForm] = useState({
    verdict:            null as Verdict | null,
    rating:             null as number | null,
    communicationScore: null as number | null,
    problemSolvingScore:null as number | null,
    codeQualityScore:   null as number | null,
    feedbackSummary: "",
    strengths:       "",
    improvements:    "",
  });

  useEffect(() => {
    api.get(`/sessions/${sessionId}`).then(({ data }) => {
      setSession(data);
      // Pre-fill if already saved
      if (data.feedbackLockedAt) {
        setForm({
          verdict:             data.verdict,
          rating:              data.rating,
          communicationScore:  data.communicationScore,
          problemSolvingScore: data.problemSolvingScore,
          codeQualityScore:    data.codeQualityScore,
          feedbackSummary:     data.feedbackSummary,
          strengths:           data.strengths,
          improvements:        data.improvements,
        });
        setSaved(true);
      }
    });
  }, [sessionId]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch(`/sessions/${sessionId}/feedback`, form);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/reports/${sessionId}/pdf`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("mirror-auth") ? JSON.parse(localStorage.getItem("mirror-auth")!).state.token : ""}` } }
    );
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `mirror-report-${sessionId?.slice(0, 8)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!session) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">
      Loading session...
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="border-b border-zinc-800 px-8 py-4 flex items-center justify-between">
        <div>
          <span className="font-bold tracking-tight text-sm mr-3">mirror</span>
          <span className="text-zinc-600 text-sm">Feedback Report</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")}
            className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Dashboard
          </button>
          {saved && (
            <button onClick={handleDownload}
              className="text-xs px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium transition-colors">
              ↓ Download PDF
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10 space-y-8">

        {/* Session meta */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h1 className="text-lg font-bold mb-1">{session.room.title}</h1>
          <p className="text-zinc-400 text-sm">
            Candidate: <span className="text-white">{session.user.name}</span>
            <span className="text-zinc-600 ml-2">{session.user.email}</span>
          </p>
          <p className="text-zinc-600 text-xs font-mono mt-1">{session.room.code}</p>
        </div>

        {/* Verdict */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">Verdict</h2>
          <div className="grid grid-cols-2 gap-2">
            {VERDICTS.map(v => (
              <button key={v.value}
                onClick={() => setForm(f => ({ ...f, verdict: v.value }))}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-all border
                  ${form.verdict === v.value
                    ? `${v.color} border-transparent text-white`
                    : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600"}`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scores */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">Scores</h2>
          <div className="space-y-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <StarRating label="Overall"           value={form.rating}             onChange={v => setForm(f => ({ ...f, rating: v }))} />
            <StarRating label="Communication"     value={form.communicationScore} onChange={v => setForm(f => ({ ...f, communicationScore: v }))} />
            <StarRating label="Problem Solving"   value={form.problemSolvingScore}onChange={v => setForm(f => ({ ...f, problemSolvingScore: v }))} />
            <StarRating label="Code Quality"      value={form.codeQualityScore}   onChange={v => setForm(f => ({ ...f, codeQualityScore: v }))} />
          </div>
        </div>

        {/* Written feedback */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">Written Feedback</h2>
          <div className="space-y-3">
            {(["feedbackSummary", "strengths", "improvements"] as const).map(field => (
              <div key={field}>
                <label className="text-xs text-zinc-500 capitalize mb-1 block">
                  {field === "feedbackSummary" ? "Summary" : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <textarea
                  rows={3}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={
                    field === "feedbackSummary" ? "Overall impression of the candidate..." :
                    field === "strengths"        ? "What the candidate did well..." :
                                                  "Areas to improve..."
                  }
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl
                             text-zinc-300 text-sm placeholder-zinc-700 focus:outline-none
                             focus:border-violet-500/50 resize-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Interviewer notes (read-only reference) */}
        {session.interviewerNotes && (
          <div>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">
              Your Private Notes <span className="text-zinc-600 normal-case font-normal">(reference)</span>
            </h2>
            <pre className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl
                            text-zinc-500 text-xs whitespace-pre-wrap font-mono leading-relaxed">
              {session.interviewerNotes}
            </pre>
          </div>
        )}

        {/* Final code snapshot */}
        {session.finalCode && (
          <div>
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">
              Final Code <span className="text-zinc-600 font-normal normal-case">({session.language})</span>
            </h2>
            <pre className="w-full px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-xl
                            text-zinc-300 text-xs whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto max-h-72">
              {session.finalCode}
            </pre>
          </div>
        )}

        {/* Save + download */}
        <div className="flex items-center justify-between pt-2 pb-10">
          <span className={`text-xs transition-colors ${saved ? "text-green-400" : "text-zinc-600"}`}>
            {saved ? "✓ Feedback saved" : "Unsaved changes"}
          </span>
          <div className="flex gap-3">
            {saved && (
              <button onClick={handleDownload}
                className="text-sm px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700
                           rounded-lg font-medium transition-colors">
                ↓ Download PDF
              </button>
            )}
            <button onClick={handleSave} disabled={saving || !form.verdict}
              className="text-sm px-5 py-2.5 bg-violet-600 hover:bg-violet-500
                         disabled:opacity-40 rounded-lg font-medium transition-colors">
              {saving ? "Saving..." : "Save Feedback"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}