import { useState, useEffect, useRef } from "react";
import { socket } from "../../lib/socket";
import { api } from "../../lib/api";

interface Props {
  roomCode: string;
  userId: string;
  sessionId?: string;
}

export default function PrivateNotepad({ roomCode, userId }: Props) {
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load existing notes on mount
  useEffect(() => {
    api.get(`/rooms/${roomCode}`)
      .then(({ data }) => {
        const session = data.sessions?.find((s: any) => s.userId === userId);
        if (session?.interviewerNotes) setNotes(session.interviewerNotes);
      })
      .catch(() => {});
  }, [roomCode, userId]);

  function handleChange(value: string) {
    setNotes(value);
    setSaved(false);

    // Debounce save — 1.5s after last keystroke
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      socket.emit("notepad:save", { roomCode, userId, notes: value });
      setSaved(true);
    }, 1500);
  }

  return (
    <div className="h-full flex flex-col p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
          Private Notes
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-violet-500 font-medium">· only you</span>
          <span className={`text-xs transition-colors ${saved ? "text-zinc-600" : "text-yellow-500"}`}>
            {saved ? "saved" : "saving..."}
          </span>
        </div>
      </div>
      <textarea
        value={notes}
        onChange={e => handleChange(e.target.value)}
        placeholder={`Notes visible only to you...\n\n• Communication skills\n• Problem approach\n• Code quality\n• Follow-up questions`}
        className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3
                   text-zinc-300 text-xs leading-relaxed placeholder-zinc-700
                   focus:outline-none focus:border-violet-500/50 resize-none
                   font-mono"
      />
    </div>
  );
}