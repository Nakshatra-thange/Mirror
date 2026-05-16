import axios from "axios";
import { JUDGE0_BASE_URL, JUDGE0_LANGUAGE_IDS } from "../constants/judge0.js";

interface SubmissionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
}

export async function runCode(
  code: string,
  language: string,
  stdin: string = ""
): Promise<SubmissionResult> {
  const languageId = JUDGE0_LANGUAGE_IDS[language];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  const headers = {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": process.env.JUDGE0_API_KEY!,
    "X-RapidAPI-Host": process.env.JUDGE0_API_HOST!,
  };

  // Step 1 — submit
  const { data: submission } = await axios.post(
    `${JUDGE0_BASE_URL}/submissions?base64_encoded=true&wait=false`,
    {
      source_code: Buffer.from(code).toString("base64"),
      language_id: languageId,
      stdin: Buffer.from(stdin).toString("base64"),
    },
    { headers }
  );

  const token = submission.token;

  // Step 2 — poll until done (max 10s)
  let result: SubmissionResult | null = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));

    const { data } = await axios.get(
      `${JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=true`,
      { headers }
    );

    // Status IDs 1 = In Queue, 2 = Processing
    if (data.status.id <= 2) continue;

    result = {
      stdout:         data.stdout         ? Buffer.from(data.stdout,         "base64").toString() : null,
      stderr:         data.stderr         ? Buffer.from(data.stderr,         "base64").toString() : null,
      compile_output: data.compile_output ? Buffer.from(data.compile_output, "base64").toString() : null,
      message:        data.message        ? Buffer.from(data.message,        "base64").toString() : null,
      status:  data.status,
      time:    data.time,
      memory:  data.memory,
    };
    break;
  }

  if (!result) throw new Error("Execution timed out");
  return result;
}