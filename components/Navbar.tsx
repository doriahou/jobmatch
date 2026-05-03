"use client";

import { motion } from "framer-motion";
import { useJobMatch } from "@/context/JobMatchContext";

export default function Navbar() {
  const { state, dispatch } = useJobMatch();
  const isDone = state.analysisStatus === "done";

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="h-14 flex items-center px-8 shrink-0"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.8)",
        boxShadow: "0 1px 24px rgba(147,197,253,0.12)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 select-none">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #60a5fa, #34d399)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <span className="font-black text-lg tracking-tight gradient-text">
          Job Match
        </span>
      </div>

      {/* Center: status breadcrumb */}
      <div className="flex-1 flex items-center justify-center gap-3 text-xs text-slate-400">
        <Step active={state.analysisStatus !== "idle" || !state.jdText} done={!!state.jdText} label="输入 JD" n={1} />
        <Chevron />
        <Step active={!!state.jdText} done={!!state.resumeFile} label="上传简历" n={2} />
        <Chevron />
        <Step active={!!state.resumeFile} done={isDone} label="AI 分析" n={3} />
        <Chevron />
        <Step active={false} done={false} label="面试模拟" n={4} disabled />
      </div>

      {/* Right: reset */}
      {(state.jdText || state.resumeFile || isDone) && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => dispatch({ type: "RESET" })}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100/60"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-3.46" />
          </svg>
          重置
        </motion.button>
      )}
    </motion.header>
  );
}

function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function Step({ active, done, label, n, disabled }: { active: boolean; done: boolean; label: string; n: number; disabled?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 transition-colors duration-300 ${disabled ? "text-slate-200 cursor-default" : done ? "text-emerald-500" : active ? "text-blue-400" : "text-slate-300"}`}>
      <div
        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
        style={{
          background: disabled
            ? "rgba(203,213,225,0.25)"
            : done
            ? "linear-gradient(135deg, #6EE7B7, #34d399)"
            : active
            ? "linear-gradient(135deg, #93C5FD, #60a5fa)"
            : "rgba(203,213,225,0.5)",
          color: !disabled && (done || active) ? "white" : "#cbd5e1",
        }}
      >
        {done ? (
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : n}
      </div>
      <span>{label}</span>
    </div>
  );
}
