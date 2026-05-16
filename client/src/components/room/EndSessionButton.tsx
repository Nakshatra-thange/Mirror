import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { socket } from "../../lib/socket";

interface Props {
  roomCode: string;
  sessionId: string | null;
}

export default function EndSessionButton({ roomCode, sessionId }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [ending, setEnding]         = useState(false);
  const navigate = useNavigate();

  async function handleEnd() {
    setEnding(true);
    try {
      await api.patch(`/rooms/${roomCode}/end`);
      socket.emit("room:end", { roomCode });
      navigate(`/feedback/${sessionId}`);
    } catch {
      setEnding(false);
      setConfirming(false);
    }
  }

  if (!confirming) return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30
                 border border-red-600/40 text-red-400 rounded-md transition-colors">
      End Session
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-400">End for everyone?</span>
      <button onClick={handleEnd} disabled={ending}
        className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-500
                   text-white rounded-md transition-colors disabled:opacity-50">
        {ending ? "Ending..." : "Confirm"}
      </button>
      <button onClick={() => setConfirming(false)}
        className="text-xs text-zinc-500 hover:text-zinc-300">
        Cancel
      </button>
    </div>
  );
}