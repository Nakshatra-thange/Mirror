import { useCallback } from "react";
import { api } from "../lib/api";
import { socket } from "../lib/socket";
import { useExecutionStore } from "../store/execution";
import { useEditorStore } from "../store/editor";

export function useExecution(roomCode: string) {
  const { setRunning, setResult, setError } = useExecutionStore();
  const { code, language } = useEditorStore();

  const run = useCallback(async () => {
    setRunning();
    socket.emit("execution:start", { roomCode });

    try {
      const { data } = await api.post("/execute", {
        code,
        language,
        roomCode,
      });

      setResult(data);
      socket.emit("execution:result", { roomCode, result: data });
    } catch (err: any) {
      const msg = err.response?.data?.error ?? "Execution failed";
      setError(msg);
      socket.emit("execution:error", { roomCode, error: msg });
    }
  }, [code, language, roomCode, setRunning, setResult, setError]);

  return { run };
}