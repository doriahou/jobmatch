"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useJobMatch } from "@/context/JobMatchContext";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.txt";
const MAX_SIZE_MB = 10;

function FileIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#uploadGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="uploadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>
      </defs>
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function ResumeUpload() {
  const { state, dispatch } = useJobMatch();
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const isDisabled = state.analysisStatus === "uploading" || state.analysisStatus === "analyzing";

  const validateAndSetFile = useCallback(
    (file: File) => {
      setFileError(null);
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
        setFileError("仅支持 PDF、Word (.doc/.docx) 或 TXT 文件");
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setFileError(`文件大小不能超过 ${MAX_SIZE_MB}MB`);
        return;
      }
      dispatch({ type: "SET_RESUME_FILE", payload: file });
    },
    [dispatch]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSetFile(file);
    },
    [validateAndSetFile]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSetFile(file);
    },
    [validateAndSetFile]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full gap-3 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
          style={{ background: "linear-gradient(135deg, #6EE7B7, #34d399)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h2 className="font-semibold text-slate-700 text-sm tracking-wide uppercase">
          上传简历 Resume Upload
        </h2>
      </div>

      {/* Drop zone */}
      <div
        className="flex-1 relative min-h-0"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <AnimatePresence mode="wait">
          {state.resumeFile ? (
            /* File selected state */
            <motion.div
              key="file-selected"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-full h-full rounded-xl border flex flex-col items-center justify-center gap-4 p-6"
              style={{
                background: "linear-gradient(135deg, rgba(110,231,183,0.1), rgba(147,197,253,0.1))",
                borderColor: "rgba(110,231,183,0.5)",
              }}
            >
              {/* File icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(110,231,183,0.2), rgba(147,197,253,0.2))" }}
              >
                <div className="text-emerald-500">
                  <FileIcon />
                </div>
              </div>

              {/* File info */}
              <div className="text-center">
                <p className="font-medium text-slate-700 text-sm truncate max-w-[200px]">
                  {state.resumeFile.name}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  {formatFileSize(state.resumeFile.size)}
                </p>
              </div>

              {/* Success badge */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-600"
                style={{ background: "rgba(110,231,183,0.2)" }}
              >
                <CheckIcon />
                文件已就绪
              </div>

              {/* Replace button */}
              {!isDisabled && (
                <label className="cursor-pointer text-xs text-slate-400 hover:text-blue-500 transition-colors underline underline-offset-2">
                  更换文件
                  <input
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    onChange={onFileInput}
                    className="hidden"
                  />
                </label>
              )}
            </motion.div>
          ) : (
            /* Empty / drag state */
            <motion.label
              key="drop-zone"
              htmlFor="resume-file-input"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={isDragging ? { opacity: 1, scale: 1.02 } : { opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-full h-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-4 p-6 cursor-pointer transition-all duration-200"
              style={{
                borderColor: isDragging ? "#6EE7B7" : "rgba(147,197,253,0.5)",
                background: isDragging
                  ? "linear-gradient(135deg, rgba(110,231,183,0.12), rgba(147,197,253,0.12))"
                  : "rgba(255,255,255,0.3)",
              }}
            >
              <motion.div
                animate={isDragging ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <UploadIcon />
              </motion.div>

              <div className="text-center">
                <p className="font-medium text-slate-600 text-sm">
                  {isDragging ? "松开上传文件" : "拖拽简历到此处"}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  或 <span className="text-blue-400 font-medium">点击选择文件</span>
                </p>
                <p className="text-slate-300 text-xs mt-2">
                  支持 PDF · Word · TXT &nbsp;|&nbsp; 最大 {MAX_SIZE_MB}MB
                </p>
              </div>

              <input
                id="resume-file-input"
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={onFileInput}
                disabled={isDisabled}
                className="hidden"
              />
            </motion.label>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {fileError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2 text-xs text-red-400 text-center"
            >
              {fileError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
