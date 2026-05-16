export interface ExecutionResult {
    stdout:         string | null;
    stderr:         string | null;
    compile_output: string | null;
    message:        string | null;
    status: {
      id:          number;
      description: string;
    };
    time:   string | null;
    memory: number | null;
  }
  
  // Judge0 status IDs
  export const STATUS = {
    ACCEPTED:        3,
    WRONG_ANSWER:    4,
    TIME_LIMIT:      5,
    COMPILE_ERROR:   6,
    RUNTIME_ERROR_SIGSEGV: 7,
    RUNTIME_ERROR_SIGXFSZ: 8,
    RUNTIME_ERROR_SIGFPE:  9,
    RUNTIME_ERROR_SIGABRT: 10,
    RUNTIME_ERROR_NZEC:    11,
    RUNTIME_ERROR_OTHER:   12,
    INTERNAL_ERROR:  13,
    EXEC_FORMAT:     14,
  } as const;
  
  export function isSuccess(result: ExecutionResult) {
    return result.status.id === STATUS.ACCEPTED;
  }
  
  export function getOutput(result: ExecutionResult): string {
    return result.stdout
      ?? result.compile_output
      ?? result.stderr
      ?? result.message
      ?? "No output";
  }