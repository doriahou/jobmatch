"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TagCloud } from "react-tagcloud";
import { useJobMatch } from "@/context/JobMatchContext";
import { runInterview } from "@/lib/difyApi";
import Navbar from "@/components/Navbar";
import LoadingAnimation from "@/components/ui/LoadingAnimation";
import ErrorModal from "@/components/ui/ErrorModal";

// ─── Glass panel ──────────────────────────────────────────────────────────────

function Panel({
  title,
  children,
  className = "",
  delay = 0,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      className={`rounded-2xl p-5 flex flex-col gap-4 ${className}`}
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.88)",
        boxShadow: "0 8px 32px rgba(147,197,253,0.13)",
      }}
    >
      {title && (
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          {title}
        </h3>
      )}
      {children}
    </motion.section>
  );
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="124" height="124" viewBox="0 0 124 124">
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <circle cx="62" cy="62" r={r} fill="none" stroke="rgba(203,213,225,0.35)" strokeWidth="11" />
        <circle
          cx="62" cy="62" r={r}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="11"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 62 62)"
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
        <text x="62" y="57" textAnchor="middle" style={{ fontSize: 28, fontWeight: 900, fill: "url(#scoreGrad)" }}>
          {score}
        </text>
        <text x="62" y="73" textAnchor="middle" style={{ fontSize: 11, fill: "#94a3b8" }}>
          / 100
        </text>
      </svg>
      <p className="text-xs text-slate-400 tracking-wide">综合匹配分</p>
    </div>
  );
}

// ─── Radar tick ───────────────────────────────────────────────────────────────

function RadarTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  return (
    <text x={x} y={y} textAnchor="middle" fill="#64748b" fontSize={11}>
      {payload?.value}
    </text>
  );
}

// ─── Glass tooltip ────────────────────────────────────────────────────────────

function GlassTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { color: string; name: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.9)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      }}
    >
      <p className="font-medium text-slate-600 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={`tooltip-${i}`} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Word cloud ───────────────────────────────────────────────────────────────

function sanitizeWordCloud(raw: Record<string, unknown>[]): { value: string; count: number }[] {
  const seen = new Set<string>();
  return raw
    .map((item) => {
      const label = String(item.text ?? item.word ?? item.name ?? item.label ?? item.value ?? "").trim();
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
}

const tagRenderer = (tag: { value: string; count: number }, size: number, color: string) => (
  <motion.span
    key={`tag-${tag.value}-${tag.count}`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3, delay: Math.random() * 0.4 }}
    className="inline-block m-1 px-2.5 py-1 rounded-full cursor-default select-none font-medium"
    style={{
      fontSize: size,
      color,
      background: `${color}18`,
      border: `1px solid ${color}30`,
    }}
    title={`${tag.value}: ${tag.count}`}
  >
    {tag.value}
  </motion.span>
);

// ─── Detail page ──────────────────────────────────────────────────────────────

export default function DetailPage() {
  const router = useRouter();
  const { state, dispatch } = useJobMatch();
  const { analysisOutput, analysisStatus, interviewStatus, resumeFileId, jdText, errorMessage } = state;

  useEffect(() => {
    if (analysisStatus === "idle") router.replace("/");
  }, [analysisStatus, router]);

  const handleGenerateInterview = useCallback(async () => {
    if (!resumeFileId || !jdText || interviewStatus === "loading") return;
    dispatch({ type: "SET_INTERVIEW_STATUS", payload: "loading" });
    try {
      const output = await runInterview(jdText, resumeFileId);
      dispatch({ type: "SET_INTERVIEW_OUTPUT", payload: output });
      router.push("/interview");
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err instanceof Error ? err.message : "面试题生成失败" });
      dispatch({ type: "SET_INTERVIEW_STATUS", payload: "error" });
    }
  }, [resumeFileId, jdText, interviewStatus, dispatch, router]);

  const isInterviewLoading = interviewStatus === "loading";

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #93C5FD 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #6EE7B7 0%, transparent 65%)" }} />
      </div>

      <Navbar />
      <ErrorModal message={errorMessage} onClose={() => dispatch({ type: "CLEAR_ERROR" })} />

      <AnimatePresence mode="wait">
        {/* ── Loading ── */}
        {analysisStatus !== "done" && (
          <motion.div key="loading" className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingAnimation label="正在生成分析报告..." />
          </motion.div>
        )}

        {/* ── Results ── */}
        {analysisStatus === "done" && analysisOutput && (
          <motion.div key="results" className="flex-1 overflow-y-auto px-6 pb-4 pt-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}>

            {/* Page heading */}
            <motion.div className="flex items-baseline gap-3 mb-4"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}>
              <h1 className="text-2xl font-black tracking-tight gradient-text">分析报告</h1>
              <p className="text-slate-400 text-sm">基于 JD 与简历的 AI 匹配评估</p>
            </motion.div>

            {/* ── 3-column grid ── */}
            <div className="grid grid-cols-12 gap-4">

              {/* ══ LEFT (col 1-3): 匹配总结 + 优势亮点 + 技能缺口 ══ */}
              <div className="col-span-3 flex flex-col gap-4">

                {/* 匹配总结：评分环 + AI 综合评价合并 */}
                <Panel delay={0.05}>
                  {/* 顶部标签 */}
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">匹配总结</p>

                  {/* 评分环 */}
                  <div className="flex justify-center pt-1 pb-2">
                    <ScoreRing score={analysisOutput.overall_score ?? 0} />
                  </div>

                  {/* AI 综合评价 */}
                  {analysisOutput.summary && (
                    <>
                      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(147,197,253,0.4), rgba(110,231,183,0.4), transparent)" }} />
                      <p className="text-xs text-slate-500 leading-relaxed">{analysisOutput.summary}</p>
                    </>
                  )}
                </Panel>

                {/* 优势亮点 */}
                {analysisOutput.strengths && analysisOutput.strengths.length > 0 && (
                  <Panel title="优势亮点" delay={0.1}>
                    <ul className="flex flex-col gap-2">
                      {analysisOutput.strengths.map((s, i) => (
                        <li key={`strength-${i}`} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="mt-0.5 shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(110,231,183,0.3)" }}>
                            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </Panel>
                )}

                {/* 技能缺口 */}
                {analysisOutput.missing_skills && analysisOutput.missing_skills.length > 0 && (
                  <Panel title="技能缺口" delay={0.15}>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisOutput.missing_skills.map((s, i) => (
                        <span key={`missing-${i}`}
                          className="px-2 py-0.5 rounded-lg text-xs font-medium text-red-400"
                          style={{ background: "rgba(254,202,202,0.4)", border: "1px solid rgba(252,165,165,0.4)" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </Panel>
                )}
              </div>

              {/* ══ MIDDLE (col 4-8): 雷达图 + 技能对比 ══ */}
              <div className="col-span-5 flex flex-col gap-4">

                {/* 能力雷达图 */}
                <Panel title="能力雷达图" delay={0.1}>
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={analysisOutput.matching_radar}>
                      <PolarGrid stroke="rgba(147,197,253,0.3)" />
                      <PolarAngleAxis dataKey="subject" tick={<RadarTick />} />
                      <Radar name="匹配度" dataKey="score"
                        stroke="#60a5fa" fill="#93C5FD" fillOpacity={0.35} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Panel>

                {/* 技能对比（从右侧移至此） */}
                <Panel title="技能对比" delay={0.15}>
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart
                      data={analysisOutput.skill_analysis}
                      layout="vertical"
                      margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
                      barSize={8}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(203,213,225,0.4)" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <YAxis type="category" dataKey="skill" tick={{ fontSize: 10, fill: "#64748b" }} width={68} />
                      <Tooltip content={<GlassTooltip />} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="resume" name="我的水平" fill="#93C5FD" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="required" name="JD 要求" fill="#6EE7B7" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>
              </div>

              {/* ══ RIGHT (col 9-12): 关键词云 + 查看面试题 CTA ══ */}
              <div className="col-span-4 flex flex-col gap-4">
                {analysisOutput.word_cloud && analysisOutput.word_cloud.length > 0 && (() => {
                  const cloudTags = sanitizeWordCloud(
                    analysisOutput.word_cloud as unknown as Record<string, unknown>[]
                  );
                  return cloudTags.length > 0 ? (
                    <Panel title="关键词云" delay={0.1}>
                      <TagCloud
                        minSize={12}
                        maxSize={28}
                        tags={cloudTags}
                        renderer={tagRenderer}
                        colorOptions={{ luminosity: "light", hue: "blue" }}
                        className="text-center leading-loose"
                      />
                    </Panel>
                  ) : null;
                })()}

                {/* 查看面试题 CTA — 词云正下方 */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                >
                  <motion.button
                    onClick={handleGenerateInterview}
                    disabled={isInterviewLoading}
                    whileHover={isInterviewLoading ? {} : { scale: 1.03, y: -2 }}
                    whileTap={isInterviewLoading ? {} : { scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="relative overflow-hidden w-full h-14 rounded-2xl font-bold text-white text-base tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #3b82f6 0%, #10b981 100%)",
                      boxShadow: isInterviewLoading
                        ? "none"
                        : "0 8px 30px rgba(59,130,246,0.4), 0 4px 12px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.25)",
                    }}
                  >
                    {!isInterviewLoading && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: "linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.28) 50%, transparent 62%)" }}
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.5 }}
                      />
                    )}
                    <span className="relative flex items-center justify-center gap-2.5">
                      {isInterviewLoading ? (
                        <>
                          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-30" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                            <path className="opacity-90" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          生成中...
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          查看面试题
                        </>
                      )}
                    </span>
                  </motion.button>
                </motion.div>
              </div>

            </div>

            {/* ── Bottom: 重新分析 ── */}
            <motion.div
              className="mt-4 flex items-center justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors px-4 py-2 rounded-xl hover:bg-white/50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.46" />
                </svg>
                重新分析
              </button>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
