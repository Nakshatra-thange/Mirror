import { create } from "zustand";
import type { ExecutionResult } from "../types/execution";

interface ExecutionState {
  result:  ExecutionResult | null;
  running: boolean;
  error:   string | null;
  setRunning: () => void;
  setResult:  (r: ExecutionResult) => void;
  setError:   (e: string) => void;
  reset:      () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  result:  null,
  running: false,
  error:   null,
  setRunning: () => set({ running: true, result: null, error: null }),
  setResult:  (result)  => set({ result, running: false, error: null }),
  setError:   (error)   => set({ error, running: false, result: null }),
  reset:      () => set({ result: null, running: false, error: null }),
}));