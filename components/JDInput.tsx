"use client";

import { useJobMatch } from "@/context/JobMatchContext";
import { motion } from "framer-motion";

export default function JDInput() {
  const { state, dispatch } = useJobMatch();
  const isDisabled = state.analysisStatus === "uploading" || state.analysisStatus === "analyzing";

  return (
    <div className="flex flex-col h-full gap-3 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
          style={{ background: "linear-gradient(135deg, #93C5FD, #60a5fa)" }}
        >
          JD
        </div>
        <h2 className="font-semibold text-slate-700 text-sm tracking-wide uppercase">
          职位描述 Job Description
        </h2>
      </div>

      {/* Textarea */}
      <div className="relative flex-1 min-h-0 group">
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
          style={{
            background:
              "linear-gradient(135deg, rgba(147,197,253,0.15), rgba(110,231,183,0.15))",
            boxShadow: "0 0 0 2px rgba(147,197,253,0.5)",
          }}
        />
        <textarea
          value={state.jdText}
          onChange={(e) =>
            dispatch({ type: "SET_JD_TEXT", payload: e.target.value })
          }
          disabled={isDisabled}
          placeholder="将职位描述粘贴到这里...&#10;&#10;例如：我们正在寻找一名前端工程师，需要熟悉 React、TypeScript..."
          className="w-full h-full resize-none rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 bg-white/50 border border-white/70 outline-none transition-all duration-200 leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        />

        {/* Character count */}
        {state.jdText.length > 0 && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-3 right-3 text-xs text-slate-400 select-none pointer-events-none"
          >
            {state.jdText.length} 字
          </motion.span>
        )}
      </div>
    </div>
  );
}
