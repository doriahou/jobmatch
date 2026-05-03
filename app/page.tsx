"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useJobMatch } from "@/context/JobMatchContext";
import { uploadResume, runAnalysis } from "@/lib/difyApi";
import Navbar from "@/components/Navbar";
import LoadingAnimation from "@/components/ui/LoadingAnimation";
import ErrorModal from "@/components/ui/ErrorModal";
import JDInput from "@/components/JDInput";
import ResumeUpload from "@/components/ResumeUpload";

// ─── Background blobs ─────────────────────────────────────────────────────────

function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, #93C5FD 0%, transparent 65%)" }} />
      <div className="absolute bottom-0 -right-48 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #6EE7B7 0%, transparent 65%)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(ellipse, #a5b4fc 0%, transparent 70%)" }} />
    </div>
  );
}

// ─── Analyse button ───────────────────────────────────────────────────────────

function AnalyzeButton({ onClick, disabled, loading }: { onClick: () => void; disabled: boolean; loading: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.04, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="relative overflow-hidden h-11 px-8 rounded-xl font-semibold text-white text-sm tracking-wide shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: "linear-gradient(135deg, #60a5fa 0%, #34d399 100%)",
        boxShadow: disabled ? "none" : "0 4px 20px rgba(96,165,250,0.45), 0 2px 8px rgba(52,211,153,0.3)",
      }}
    >
      {!disabled && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)" }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.2 }}
        />
      )}
      <span className="relative flex items-center gap-2">
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-30" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
              <path className="opacity-90" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            分析中...
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            开始分析
          </>
        )}
      </span>
    </motion.button>
  );
}

// ─── Home page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const { state, dispatch } = useJobMatch();
  const { analysisStatus, jdText, resumeFile, errorMessage } = state;

  const isLoading = analysisStatus === "uploading" || analysisStatus === "analyzing";
  const canAnalyze = jdText.trim().length > 10 && resumeFile !== null && !isLoading;

  const loadingLabel =
    analysisStatus === "uploading" ? "上传简历中..." : "AI 分析中...";

  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze || !resumeFile) return;

    try {
      // Step 1: upload
      dispatch({ type: "SET_ANALYSIS_STATUS", payload: "uploading" });
      const fileId = await uploadResume(resumeFile);
      dispatch({ type: "SET_RESUME_FILE_ID", payload: fileId });

      // Step 2: analyse
      dispatch({ type: "SET_ANALYSIS_STATUS", payload: "analyzing" });
      const output = await runAnalysis(jdText, fileId);

      dispatch({ type: "SET_ANALYSIS_OUTPUT", payload: output });
      router.push("/detail");
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: err instanceof Error ? err.message : "分析失败，请稍后重试",
      });
    }
  }, [canAnalyze, resumeFile, jdText, dispatch, router]);

  // ⌘/Ctrl + Enter shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canAnalyze) {
        e.preventDefault();
        handleAnalyze();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canAnalyze, handleAnalyze]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <BackgroundBlobs />
      <Navbar />

      <ErrorModal
        message={errorMessage}
        onClose={() => dispatch({ type: "CLEAR_ERROR" })}
      />

      <div className="flex-1 flex overflow-hidden px-6 pb-5 pt-4 gap-5">
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Compact heading */}
          <motion.div
            className="flex items-baseline gap-3"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-2xl font-black tracking-tight gradient-text">简历匹配分析</h1>
            <p className="text-slate-400 text-sm">粘贴 JD 并上传简历，AI 秒级完成匹配评估</p>
            <kbd className="ml-auto text-[10px] text-slate-400 px-2 py-0.5 rounded border border-slate-200 bg-white/60 font-mono shrink-0" title="快捷键">
              ⌘ Enter
            </kbd>
          </motion.div>

          {/* Workspace */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                className="flex-1 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 8px 32px rgba(147,197,253,0.15)" }}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <LoadingAnimation label={loadingLabel} />
              </motion.div>
            ) : (
              <motion.div
                key="workspace"
                className="flex-1 rounded-2xl overflow-hidden flex flex-col"
                style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 8px 32px rgba(147,197,253,0.15)" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Two-column inputs */}
                <div className="flex-1 grid grid-cols-2 divide-x divide-white/60 overflow-hidden">
                  <div className="flex flex-col p-5 overflow-hidden">
                    <JDInput />
                  </div>
                  <div className="flex flex-col p-5 overflow-hidden">
                    <ResumeUpload />
                  </div>
                </div>

                {/* Action bar */}
                <div
                  className="flex items-center justify-between px-5 py-3 shrink-0"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.4)" }}
                >
                  <motion.p
                    className="text-xs text-slate-400"
                    key={`tip-${!jdText.trim()}-${!resumeFile}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {!jdText.trim()
                      ? "① 粘贴职位描述"
                      : !resumeFile
                      ? "② 上传简历文件"
                      : "就绪 — 点击分析或按 ⌘ Enter"}
                  </motion.p>

                  <AnalyzeButton onClick={handleAnalyze} disabled={!canAnalyze} loading={isLoading} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
