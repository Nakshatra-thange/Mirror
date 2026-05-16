import {  isSuccess, getOutput } from "../../types/execution";
import type  {ExecutionResult } from "../../types/execution";

interface Props {
  result:  ExecutionResult | null;
  running: boolean;
  error:   string | null;
}

export default function OutputPanel({ result, running, error }: Props) {
  if (running) return (
    <div className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-400">
      <span className="w-3 h-3 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      Running...
    </div>
  );

  if (error) return (
    <div className="px-4 py-3">
      <p className="text-xs font-semibold text-red-400 mb-1">Error</p>
      <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono">{error}</pre>
    </div>
  );

  if (!result) return (
    <div className="px-4 py-3 text-zinc-600 text-xs">
      Hit Run to execute code
    </div>
  );

  const success = isSuccess(result);
  const output  = getOutput(result);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Status bar */}
      <div className={`shrink-0 flex items-center justify-between px-4 py-2 border-b border-zinc-800
        ${success ? "bg-green-950/40" : "bg-red-950/40"}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${success ? "bg-green-400" : "bg-red-400"}`} />
          <span className={`text-xs font-semibold ${success ? "text-green-400" : "text-red-400"}`}>
            {result.status.description}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {result.time   && <span>⏱ {result.time}s</span>}
          {result.memory && <span>💾 {(result.memory / 1024).toFixed(1)} MB</span>}
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {result.stdout && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-widest">stdout</p>
            <pre className="text-xs text-zinc-200 whitespace-pre-wrap font-mono bg-zinc-900 rounded-lg p-3 border border-zinc-800">
              {result.stdout}
            </pre>
          </div>
        )}
        {result.stderr && (
          <div>
            <p className="text-xs font-semibold text-red-500 mb-1 uppercase tracking-widest">stderr</p>
            <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono bg-zinc-900 rounded-lg p-3 border border-red-900/30">
              {result.stderr}
            </pre>
          </div>
        )}
        {result.compile_output && (
          <div>
            <p className="text-xs font-semibold text-yellow-500 mb-1 uppercase tracking-widest">compile output</p>
            <pre className="text-xs text-yellow-300 whitespace-pre-wrap font-mono bg-zinc-900 rounded-lg p-3 border border-yellow-900/30">
              {result.compile_output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}