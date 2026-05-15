import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { socket } from "../lib/socket";
import { useAuthStore } from "../store/auth";
import { useRoomStore } from "../store/room";
import { useEditorStore } from "../store/editor";
import CollabEditor from "../components/editor/CollabEditor";
import LanguageSelector from "../components/editor/LanguageSelector";
import type { LanguageValue } from "../constants/languages";

export default function Room() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuthStore();
  const { sessionRole, participants, setRoom, setParticipants, clearRoom } = useRoomStore();
  const { code: editorCode, language, setCode, setLanguage } = useEditorStore();
  const navigate = useNavigate();
  const [roomTitle, setRoomTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code || !user) return;

    api.post(`/rooms/${code}/join`)
      .then(({ data }) => {
        setRoom(code, data.room.title, data.sessionRole);
        setRoomTitle(data.room.title);
        // Load persisted code if any
        if (data.room.currentCode) setCode(data.room.currentCode);
        if (data.room.currentLanguage) setLanguage(data.room.currentLanguage as LanguageValue);

        socket.connect();
        socket.emit("room:join", {
          roomCode: code,
          userId: user.id,
          name: user.name,
          role: data.sessionRole,
        });
        setLoading(false);
      })
      .catch(() => navigate("/dashboard"));

    socket.on("room:presence", setParticipants);
    socket.on("editor:language_change", ({ language: lang }) => {
      setLanguage(lang as LanguageValue);
    });

    return () => {
      socket.off("room:presence");
      socket.off("editor:language_change");
      socket.disconnect();
      clearRoom();
    };
  }, [code, user]);

  function handleLanguageChange(lang: LanguageValue) {
    setLanguage(lang);
    socket.emit("editor:language_change", { roomCode: code, language: lang });
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
      Connecting to room...
    </div>
  );

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">

      {/* Top nav */}
      <nav className="shrink-0 border-b border-zinc-800 px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-tight text-sm">mirror</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-300 text-sm">{roomTitle}</span>
          <span className="font-mono text-xs text-zinc-600">{code}</span>
        </div>
        <div className="flex items-center gap-3">
          {participants.map(p => (
            <div key={p.userId} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-xs text-zinc-400">{p.name}</span>
            </div>
          ))}
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900/60 text-violet-300 border border-violet-800">
            {sessionRole}
          </span>
        </div>
      </nav>

      {/* Main split panel */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left — Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor toolbar */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
            <LanguageSelector value={language} onChange={handleLanguageChange} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600">autosaved</span>
              {/* Code execution button — Day 5 */}
              <button className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 transition-colors">
                Run ▶ (Day 5)
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <CollabEditor
              roomCode={code!}
              userId={user!.id}
              userName={user!.name}
              language={language}
              value={editorCode}
              onChange={setCode}
              onLanguageChange={handleLanguageChange}
            />
          </div>
        </div>

        {/* Right panel */}
        <div className="w-80 shrink-0 flex flex-col border-l border-zinc-800 overflow-hidden">

          {/* Problem panel — Day 4 */}
          <div className="flex-1 overflow-y-auto p-4 border-b border-zinc-800">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Problem</p>
            <div className="text-zinc-600 text-sm">Problem panel — Day 4</div>
          </div>

          {/* Private notepad — INTERVIEWER only, Day 4 */}
          {sessionRole === "INTERVIEWER" && (
            <div className="h-52 flex flex-col p-4">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                Private Notes <span className="text-violet-500">· only you</span>
              </p>
              <div className="flex-1 text-zinc-600 text-sm flex items-center justify-center border border-dashed border-zinc-800 rounded-lg">
                Notepad — Day 4
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}