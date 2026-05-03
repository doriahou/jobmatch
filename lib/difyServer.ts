/**
 * Server-only Dify helpers — only imported by /app/api/* route handlers.
 * API keys are read from server-side env vars and never sent to the browser.
 */

import type { StructuredOutput, InterviewOutput, InterviewQuestion } from "@/lib/difyApi";

const BASE_URL =
  (process.env.NEXT_PUBLIC_DIFY_BASE_URL ?? "https://api.dify.ai/v1").replace(/\/$/, "");

const ANALYSIS_KEY = process.env.DIFY_ANALYSIS_API_KEY ?? "";
const INTERVIEW_KEY = process.env.DIFY_INTERVIEW_API_KEY ?? "";

const USER_ID = "job-match-user";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireKey(key: string, name: string): string {
  if (!key) throw new Error(`${name} is not configured in .env.local`);
  return key;
}

/** Parse structured_output — Dify may return it as a JSON string or already-parsed object */
function parseStructured(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      throw new Error("structured_output is not valid JSON");
    }
  }
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  throw new Error("工作流未返回结构化数据，请检查 Dify 输出配置");
}

/**
 * Normalise Dify's raw structured_output into the shape the frontend expects.
 *
 * Handles common field-name variations produced by different LLM outputs:
 *   overall_score : "score" | "match_score" | "total_score" | "overall_score"
 *   matching_radar item : { subject|name|dimension, score|A|value|B }
 *   skill_analysis item : { skill|name, resume|candidate|you|mine|actual, required|job|demand|target }
 *   word_cloud item     : { value|text|word|name, count|weight|size|frequency }
 */
function normalizeOutput(raw: Record<string, unknown>): StructuredOutput {
  // ── overall_score ──
  const overall_score = Number(
    raw.overall_score ?? raw.score ?? raw.match_score ?? raw.total_score ?? 0
  ) || 0;

  // ── summary ──
  const summary = typeof (raw.summary ?? raw.match_reason ?? raw.reason) === "string"
    ? String(raw.summary ?? raw.match_reason ?? raw.reason)
    : undefined;

  // ── strengths ──
  const strengthsRaw = raw.strengths ?? raw.matched_skills ?? raw.advantages ?? raw.highlights;
  const strengths = Array.isArray(strengthsRaw)
    ? (strengthsRaw as unknown[]).map(String)
    : [];

  // ── missing_skills ──
  const missingRaw = raw.missing_skills ?? raw.gaps ?? raw.lacking;
  const missing_skills = Array.isArray(missingRaw)
    ? (missingRaw as unknown[]).map(String)
    : [];

  // ── matching_radar ──
  const radarRaw = (Array.isArray(raw.matching_radar) ? raw.matching_radar : []) as Record<string, unknown>[];
  const matching_radar = radarRaw
    .map((item) => ({
      subject: String(item.subject ?? item.dimension ?? item.name ?? item.skill ?? ""),
      score: Math.max(0, Math.min(100,
        Number(item.score ?? item.value ?? item.A ?? item.B ?? 0) || 0
      )),
      fullMark: 100 as const,
    }))
    .filter((item) => item.subject);

  // ── skill_analysis ──
  const skillRaw = (Array.isArray(raw.skill_analysis) ? raw.skill_analysis : []) as Record<string, unknown>[];
  const skill_analysis = skillRaw
    .map((item) => ({
      skill: String(item.skill ?? item.skill_name ?? item.name ?? item.label ?? ""),
      resume: Math.max(0, Math.min(100,
        Number(item.resume ?? item.candidate_level ?? item.candidate ?? item.actual ?? 0) || 0
      )),
      required: Math.max(0, Math.min(100,
        Number(item.required ?? item.required_level ?? item.job ?? item.demand ?? 0) || 0
      )),
    }))
    .filter((item) => item.skill);

  // ── word_cloud ──
  const cloudRaw = (Array.isArray(raw.word_cloud) ? raw.word_cloud : []) as Record<string, unknown>[];
  const seen = new Set<string>();
  const word_cloud = cloudRaw
    .map((item) => {
      const label = String(
        item.text ?? item.word ?? item.name ?? item.label ?? item.value ?? ""
      ).trim();
      const weight = Math.max(1, Math.floor(
        Number(item.count ?? item.weight ?? item.frequency ??
          (typeof item.value === "number" ? item.value : 1)) || 1
      ));
      return { value: label, count: weight };
    })
    .filter((item) => {
      if (!item.value || seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });

  return { overall_score, summary, strengths, missing_skills, matching_radar, skill_analysis, word_cloud };
}

// ─── Core workflow helper ─────────────────────────────────────────────────────

async function runWorkflow(
  apiKey: string,
  inputs: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const body = {
    inputs,
    response_mode: "blocking",
    user: USER_ID,
  };

  console.log(`\n========== [Dify Workflow] REQUEST ==========`);
  console.log(JSON.stringify(body, null, 2));
  console.log(`=============================================\n`);

  const res = await fetch(`${BASE_URL}/workflows/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const rawText = await res.text();
  console.log(`\n========== [Dify Workflow] RESPONSE status=${res.status} ==========`);
  console.log(rawText);
  console.log(`====================================================================\n`);

  if (!res.ok) {
    throw new DifyServerError(res.status, `工作流请求失败 (${res.status}): ${rawText}`);
  }

  const data = JSON.parse(rawText) as { data?: { status?: string; error?: string; outputs?: Record<string, unknown> } };

  if (data.data?.status === "failed") {
    throw new DifyServerError(500, `工作流执行失败: ${data.data.error ?? "未知错误"}`);
  }

  return data.data?.outputs ?? {};
}

// ─── File upload ──────────────────────────────────────────────────────────────

export async function serverUploadFile(file: File): Promise<string> {
  const key = requireKey(ANALYSIS_KEY, "DIFY_ANALYSIS_API_KEY");

  const form = new FormData();
  form.append("file", file, file.name);
  form.append("user", USER_ID);

  const res = await fetch(`${BASE_URL}/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new DifyServerError(res.status, `文件上传失败 (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.id as string;
}

// ─── Analysis workflow ────────────────────────────────────────────────────────

export async function serverRunAnalysis(
  jdText: string,
  fileId: string
): Promise<StructuredOutput> {
  const key = requireKey(ANALYSIS_KEY, "DIFY_ANALYSIS_API_KEY");

  const outputs = await runWorkflow(key, {
    jd: jdText,
    resume: {
      transfer_method: "local_file",
      upload_file_id: fileId,
      type: "document",
    },
  });

  const raw = outputs.structured_output;
  const parsed = parseStructured(raw);
  return normalizeOutput(parsed);
}

// ─── Interview workflow ───────────────────────────────────────────────────────

export async function serverRunInterview(
  jdText: string,
  fileId: string
): Promise<InterviewOutput> {
  const key = requireKey(INTERVIEW_KEY, "DIFY_INTERVIEW_API_KEY");

  const outputs = await runWorkflow(key, {
    jd: jdText,
    resume: {
      transfer_method: "local_file",
      upload_file_id: fileId,
      type: "document",
    },
  });

  console.log(`\n========== [Interview] outputs keys ==========`);
  console.log(JSON.stringify(outputs, null, 2));
  console.log(`==============================================\n`);

  // Try common output variable names from Dify end-node
  const raw =
    outputs.structured_output ??
    outputs.text ??
    outputs.result ??
    outputs.answer ??
    outputs.interview ??
    outputs.output ??
    Object.values(outputs)[0];

  if (!raw) {
    throw new DifyServerError(
      500,
      `面试题 Workflow 未返回数据。outputs 字段：${JSON.stringify(outputs)}`
    );
  }

  // Parse if string, otherwise use as-is
  let parsed: Record<string, unknown>;
  try {
    parsed = parseStructured(raw);
  } catch {
    throw new DifyServerError(500, `面试题数据解析失败，原始内容：${String(raw).slice(0, 200)}`);
  }

  // Normalise into InterviewOutput shape
  // Support: { questions: [...] } or flat array or { interview_questions: [...] }
  let questions: InterviewQuestion[];
  if (Array.isArray(parsed)) {
    questions = parsed as unknown as InterviewQuestion[];
  } else if (Array.isArray(parsed.questions)) {
    questions = parsed.questions as unknown as InterviewQuestion[];
  } else if (Array.isArray(parsed.interview_questions)) {
    questions = parsed.interview_questions as unknown as InterviewQuestion[];
  } else {
    // Last resort: collect all array values
    const firstArray = Object.values(parsed).find(Array.isArray);
    questions = (firstArray as unknown as InterviewQuestion[]) ?? [];
  }

  // Ensure each question has required fields
  const normalizedQuestions: InterviewQuestion[] = questions.map((q) => {
    const item = q as Record<string, unknown>;
    return {
      category: String(item.category ?? item.type ?? item.kind ?? "其他"),
      question: String(item.question ?? item.content ?? item.text ?? item.q ?? ""),
      hint: item.hint != null ? String(item.hint) : undefined,
    };
  }).filter((q) => q.question);

  return {
    questions: normalizedQuestions,
    summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
  };
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class DifyServerError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "DifyServerError";
  }
}
