"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useJobMatch } from "@/context/JobMatchContext";
import type { InterviewQuestion } from "@/lib/difyApi";
import Navbar from "@/components/Navbar";
import LoadingAnimation from "@/components/ui/LoadingAnimation";

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  技术: { label: "技术", bg: "rgba(147,197,253,0.2)", text: "#3b82f6", dot: "#60a5fa" },
  行为: { label: "行为", bg: "rgba(110,231,183,0.2)", text: "#059669", dot: "#34d399" },
  项目: { label: "项目", bg: "rgba(196,181,253,0.2)", text: "#7c3aed", dot: "#a78bfa" },
  情景: { label: "情景", bg: "rgba(253,230,138,0.2)", text: "#b45309", dot: "#fbbf24" },
};

function categoryStyle(cat: string) {
  return (
    CATEGORY_STYLE[cat] ?? {
      label: cat,
      bg: "rgba(203,213,225,0.2)",
      text: "#475569",
      dot: "#94a3b8",
    }
  );
}

// ─── Question card ────────────────────────────────────────────────────────────

function QuestionCard({ q, index }: { q: InterviewQuestion; index: number }) {
  const style = categoryStyle(q.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.88)",
        boxShadow: "0 4px 20px rgba(147,197,253,0.1)",
      }}
    >
      <div className="flex items-center gap-2">
        {/* Number badge */}
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: style.dot }}
        >
          {index + 1}
        </span>

        {/* Category pill */}
        <span
          className="text-xs font-medium px-2.5 py-0.5 rounded-full"
          style={{ background: style.bg, color: style.text }}
        >
          {style.label}
        </span>
      </div>

      {/* Question */}
      <p className="text-slate-700 text-sm font-medium leading-relaxed">{q.question}</p>

      {/* Hint */}
      {q.hint && (
        <details className="group">
          <summary className="text-xs text-slate-400 cursor-pointer select-none hover:text-slate-500 transition-colors flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-open:rotate-90 transition-transform">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            查看答题提示
          </summary>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed pl-4 border-l-2" style={{ borderColor: style.dot }}>
            {q.hint}
          </p>
        </details>
      )}
    </motion.div>
  );
}

// ─── Interview page ───────────────────────────────────────────────────────────

export default function InterviewPage() {
  const router = useRouter();
  const { state } = useJobMatch();
  const { interviewStatus, interviewOutput } = state;

  useEffect(() => {
    if (interviewStatus === "idle") router.replace("/");
  }, [interviewStatus, router]);

  // Group questions by category
  const questions = interviewOutput?.questions ?? [];
  const grouped = questions.reduce<Record<string, InterviewQuestion[]>>(
    (acc, q) => {
      (acc[q.category ?? "其他"] ??= []).push(q);
      return acc;
    },
    {}
  );

  const totalCount = questions.length;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #6EE7B7 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #93C5FD 0%, transparent 65%)" }} />
      </div>

      <Navbar />

      <AnimatePresence mode="wait">
        {/* Loading */}
        {interviewStatus === "loading" && (
          <motion.div
            key="loading"
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingAnimation label="正在生成面试题..." />
          </motion.div>
        )}

        {/* Results */}
        {interviewStatus === "done" && interviewOutput && (
          <motion.div
            key="results"
            className="flex-1 overflow-y-auto px-6 pb-6 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <motion.div
              className="flex items-baseline gap-3 mb-5"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-2xl font-black tracking-tight gradient-text">面试题库</h1>
              <p className="text-slate-400 text-sm">共 {totalCount} 道题，按分类整理</p>
              <button
                onClick={() => router.push("/detail")}
                className="ml-auto flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-500 transition-colors px-3 py-1.5 rounded-xl hover:bg-blue-50/60"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 hover:bg-blue-100 transition-colors">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </span>
                返回分析报告
              </button>
            </motion.div>

            {/* Summary card */}
            {interviewOutput.summary && (
              <motion.div
                className="mb-4 rounded-2xl p-4 text-sm text-slate-600 leading-relaxed"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.88)",
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
              >
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">面试准备建议</p>
                {interviewOutput.summary}
              </motion.div>
            )}

            {/* Category statistics row */}
            <div className="flex gap-3 mb-5 flex-wrap">
              {Object.entries(grouped ?? {}).map(([cat, qs]) => {
                const style = categoryStyle(cat);
                return (
                  <motion.div
                    key={cat}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: style.bg, color: style.text }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.dot }} />
                    {cat} · {qs.length} 题
                  </motion.div>
                );
              })}
            </div>

            {/* Questions grid — multi-column */}
            <div className="columns-2 xl:columns-3 gap-4 space-y-4">
              {questions.map((q, i) => (
                <div key={i} className="break-inside-avoid">
                  <QuestionCard q={q} index={i} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
