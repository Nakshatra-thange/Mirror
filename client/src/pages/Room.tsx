import OutputPanel from "../components/room/OutputPanel";
import { useExecution } from "../hooks/useExecution";
import { useExecutionStore } from "../store/execution";
import VideoPanel from "../components/room/VideoPanel";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { socket } from "../lib/socket";
import { useAuthStore } from "../store/auth";
import { useRoomStore } from "../store/room";
import { useEditorStore } from "../store/editor";
import { useRole } from "../hooks/useRole";
import CollabEditor from "../components/editor/CollabEditor";
import LanguageSelector from "../components/editor/LanguageSelector";
import ProblemPanel from "../components/room/ProblemPanel";
import ProblemPicker from "../components/room/ProblemPicker";
import PrivateNotepad from "../components/room/PrivateNotepad";
import type { LanguageValue } from "../constants/languages";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
  starterCode: string;
}

export default function Room() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuthStore();
  const { participants, setRoom, setParticipants, clearRoom } = useRoomStore();
  const { code: editorCode, language, setCode, setLanguage } = useEditorStore();
  const { isInterviewer } = useRole();
  const navigate = useNavigate();
  

  const [roomTitle, setRoomTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [rightTab, setRightTab] = useState<"problem" | "notes">("problem");

  const { result, running, error } = useExecutionStore();
const { run } = useExecution(code!);
const [outputOpen, setOutputOpen] = useState(false);

  useEffect(() => {
    if (!code || !user) return;

    api.post(`/rooms/${code}/join`)
      .then(({ data }) => {
        setRoom(code, data.room.title, data.sessionRole);
        setRoomTitle(data.room.title);
        if (data.room.currentCode) setCode(data.room.currentCode);
        if (data.room.currentLanguage) setLanguage(data.room.currentLanguage as LanguageValue);
        if (data.room.activeProblem) setActiveProblem(data.room.activeProblem);

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

    // Candidate receives problem swap
    socket.on("room:problem_set", ({ problem }) => {
      setActiveProblem(problem);
    });
    socket.on("execution:start", () => {
      useExecutionStore.getState().setRunning();
      setOutputOpen(true);
    });
    
    socket.on("execution:result", ({ result }) => {
      useExecutionStore.getState().setResult(result);
      setOutputOpen(true);
    });
    
    socket.on("execution:error", ({ error }) => {
      useExecutionStore.getState().setError(error);
      setOutputOpen(true);
    });

    return () => {
      socket.off("room:presence");
      socket.off("editor:language_change");
      socket.off("room:problem_set");
      socket.off("execution:start");
socket.off("execution:result");
socket.off("execution:error");
      socket.disconnect();
      clearRoom();
    };
  }, [code, user]);

  function handleLanguageChange(lang: LanguageValue) {
    setLanguage(lang);
    socket.emit("editor:language_change", { roomCode: code, language: lang });
  }

  function handleProblemSelect(problem: Problem) {
    setActiveProblem(problem);
    // Load starter code into editor
    if (problem.starterCode) {
      setCode(problem.starterCode);
      socket.emit("editor:change", { roomCode: code, code: problem.starterCode, language });
    }
    // Broadcast problem to candidate
    socket.emit("room:problem_set", { roomCode: code, problem });
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">
      Connecting to room...
    </div>
  );

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">

      {/* Top nav */}
      <nav className="shrink-0 border-b border-zinc-800 px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-tight text-sm">mirror</span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-300 text-sm truncate max-w-xs">{roomTitle}</span>
          <span className="font-mono text-xs text-zinc-700">{code}</span>
        </div>
        <div className="flex items-center gap-3">
          {participants.map(p => (
            <div key={p.userId} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-xs text-zinc-400">{p.name}</span>
            </div>
          ))}
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900/60 text-violet-300 border border-violet-800">
            {isInterviewer ? "INTERVIEWER" : "CANDIDATE"}
          </span>
        </div>
      </nav>

      {/* Main split panel */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left — Code Editor */}
        {/* Left — Code Editor */}
<div className="flex-1 flex flex-col overflow-hidden">
  {/* Editor toolbar */}
  <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
    <LanguageSelector value={language} onChange={handleLanguageChange} />
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-600">autosaved</span>
      <button
        onClick={() => { run(); setOutputOpen(true); }}
        disabled={running}
        className="text-xs px-4 py-1.5 bg-violet-600 hover:bg-violet-500
                   disabled:opacity-50 disabled:cursor-not-allowed
                   rounded font-medium text-white transition-colors flex items-center gap-1.5">
        {running
          ? <><span className="w-2.5 h-2.5 rounded-full border border-white border-t-transparent animate-spin" /> Running</>
          : <>▶ Run</>}
      </button>
    </div>
  </div>

  {/* Editor + Output stacked */}
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Editor takes remaining space */}
    <div className={`overflow-hidden transition-all ${outputOpen ? "flex-1" : "flex-1"}`}>
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

    {/* Output drawer — slides up from bottom */}
    {outputOpen && (
      <div className="h-52 shrink-0 border-t border-zinc-800 flex flex-col bg-zinc-950">
        <div className="shrink-0 flex items-center justify-between px-4 py-1.5 border-b border-zinc-800">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Output</span>
          <button onClick={() => setOutputOpen(false)} className="text-zinc-600 hover:text-zinc-400 text-xs">✕</button>
        </div>
        <div className="flex-1 overflow-hidden">
          <OutputPanel result={result} running={running} error={error} />
        </div>
      </div>
    )}
  </div>
</div>

        {/* Right panel */}
<div className="w-80 shrink-0 flex flex-col border-l border-zinc-800 overflow-hidden">

{/* Video — always visible at top of right panel */}
<div className="shrink-0 border-b border-zinc-800">
  <VideoPanel roomCode={code!} userName={user!.name} />
</div>

{/* Tab bar */}
<div className="shrink-0 flex border-b border-zinc-800">
  <button
    onClick={() => setRightTab("problem")}
    className={`flex-1 text-xs py-2.5 font-medium transition-colors
      ${rightTab === "problem"
        ? "text-white border-b-2 border-violet-500"
        : "text-zinc-500 hover:text-zinc-300"}`}>
    Problem
  </button>
  {isInterviewer && (
    <button
      onClick={() => setRightTab("notes")}
      className={`flex-1 text-xs py-2.5 font-medium transition-colors
        ${rightTab === "notes"
          ? "text-white border-b-2 border-violet-500"
          : "text-zinc-500 hover:text-zinc-300"}`}>
      My Notes
    </button>
  )}
</div>

{/* Problem picker */}
{isInterviewer && rightTab === "problem" && (
  <div className="shrink-0 px-3 py-2 border-b border-zinc-800 flex justify-end">
    <ProblemPicker roomCode={code!} onSelect={handleProblemSelect} />
  </div>
)}

{/* Panel content */}
<div className="flex-1 overflow-hidden flex flex-col">
  {rightTab === "problem" && <ProblemPanel problem={activeProblem} />}
  {rightTab === "notes" && isInterviewer && (
    <PrivateNotepad roomCode={code!} userId={user!.id} />
  )}
</div>
</div>

          {/* Tab bar — interviewer gets both tabs */}
          <div className="shrink-0 flex border-b border-zinc-800">
            <button
              onClick={() => setRightTab("problem")}
              className={`flex-1 text-xs py-2.5 font-medium transition-colors
                ${rightTab === "problem"
                  ? "text-white border-b-2 border-violet-500"
                  : "text-zinc-500 hover:text-zinc-300"}`}>
              Problem
            </button>
            {isInterviewer && (
              <button
                onClick={() => setRightTab("notes")}
                className={`flex-1 text-xs py-2.5 font-medium transition-colors
                  ${rightTab === "notes"
                    ? "text-white border-b-2 border-violet-500"
                    : "text-zinc-500 hover:text-zinc-300"}`}>
                My Notes
              </button>
            )}
          </div>

          {/* Problem picker — interviewer only, shown above problem */}
          {isInterviewer && rightTab === "problem" && (
            <div className="shrink-0 px-3 py-2 border-b border-zinc-800 flex justify-end">
              <ProblemPicker roomCode={code!} onSelect={handleProblemSelect} />
            </div>
          )}

          {/* Panel content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {rightTab === "problem" && (
              <ProblemPanel problem={activeProblem} />
            )}
            {rightTab === "notes" && isInterviewer && (
              <PrivateNotepad roomCode={code!} userId={user!.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}