/**
 * Dify API client
 *
 * All Dify calls are proxied through Next.js API routes so that API keys
 * never reach the browser.
 *
 * Client code calls:
 *   uploadResume()             → POST /api/upload
 *   runAnalysis()              → POST /api/analyze
 *   runInterview(jd, fileId)   → POST /api/interview
 */

// ─── Shared output types ──────────────────────────────────────────────────────

/** One spoke in the matching radar chart */
export interface RadarPoint {
  subject: string;
  score: number;
  fullMark: 100;
}

/** One row in the skill comparison bar chart */
export interface SkillItem {
  skill: string;
  resume: number;
  required: number;
}

/** One tag in the word cloud */
export interface WordCloudItem {
  value: string;
  count: number;
}

/** The canonical shape returned by the analysis workflow's structured_output */
export interface StructuredOutput {
  overall_score?: number;
  summary?: string;
  strengths?: string[];
  missing_skills?: string[];
  matching_radar: RadarPoint[];
  skill_analysis: SkillItem[];
  word_cloud: WordCloudItem[];
  resume_advice?: string;
  learning_plan?: string;
  interview_tips?: string;
}

/** Interview question */
export interface InterviewQuestion {
  category: string;
  question: string;
  hint?: string;
}

export interface InterviewOutput {
  questions: InterviewQuestion[];
  summary?: string;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadResume(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file, file.name);

  const res = await fetch("/api/upload", { method: "POST", body: form });
  const json = await res.json();

  if (!res.ok) {
    throw new DifyError(json.error ?? "文件上传失败", res.status, json.code);
  }
  return json.file_id as string;
}

// ─── Analysis workflow ────────────────────────────────────────────────────────

export async function runAnalysis(
  jdText: string,
  fileId: string
): Promise<StructuredOutput> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jd: jdText, file_id: fileId }),
  });
  const json = await res.json();

  if (!res.ok) {
    throw new DifyError(json.error ?? "分析失败", res.status, json.code);
  }
  return json.output as StructuredOutput;
}

// ─── Interview workflow ───────────────────────────────────────────────────────

export async function runInterview(
  jdText: string,
  fileId: string
): Promise<InterviewOutput> {
  const res = await fetch("/api/interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jd: jdText, file_id: fileId }),
  });
  const json = await res.json();

  if (!res.ok) {
    throw new DifyError(json.error ?? "面试题生成失败", res.status, json.code);
  }
  return json.output as InterviewOutput;
}

// ─── Error class ──────────────────────────────────────────────────────────────

export class DifyError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "DifyError";
  }
}
