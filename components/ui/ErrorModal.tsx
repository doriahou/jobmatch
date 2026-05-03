"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ErrorModalProps {
  message: string | null;
  onClose: () => void;
}

const FRIENDLY: Record<string, string> = {
  "Token 过期": "API Token 已过期，请联系管理员更新配置。",
  "unsupported": "文件格式不支持，请上传 PDF、Word 或 TXT 格式的简历。",
  "file size": "文件过大，请压缩后重新上传（建议 10MB 以内）。",
  "rate limit": "请求过于频繁，请稍等片刻后再试。",
  "401": "API 认证失败，请检查 API Key 配置。",
};

function friendlyMessage(raw: string): string {
  for (const [key, msg] of Object.entries(FRIENDLY)) {
    if (raw.toLowerCase().includes(key.toLowerCase())) return msg;
  }
  return raw;
}

export default function ErrorModal({ message, onClose }: ErrorModalProps) {
  return (
    <AnimatePresence>
      {message && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40"
            style={{ background: "rgba(15,23,42,0.25)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            initial={{ opacity: 0, scale: 0.93, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="pointer-events-auto w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.9)",
                boxShadow:
                  "0 20px 60px rgba(15,23,42,0.12), 0 4px 16px rgba(252,165,165,0.2)",
              }}
            >
              {/* Icon */}
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(254,202,202,0.6)" }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-700 text-sm">出现了一点问题</h3>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Message */}
              <p className="text-slate-600 text-sm leading-relaxed">
                {friendlyMessage(message)}
              </p>

              {/* Raw error (collapsed) */}
              <details className="group">
                <summary className="text-xs text-slate-400 cursor-pointer select-none hover:text-slate-500 transition-colors">
                  查看详细错误信息
                </summary>
                <p className="mt-2 text-xs text-slate-500 font-mono bg-slate-50 rounded-lg px-3 py-2 break-all leading-relaxed">
                  {message}
                </p>
              </details>

              {/* Action */}
              <button
                onClick={onClose}
                className="w-full h-10 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #60a5fa, #34d399)",
                }}
              >
                我知道了
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
