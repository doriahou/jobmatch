"use client";

import { motion } from "framer-motion";

interface LoadingAnimationProps {
  label?: string;
}

export default function LoadingAnimation({
  label = "AI 分析中...",
}: LoadingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      {/* Spinning gradient ring */}
      <div className="relative w-24 h-24">
        {/* Outer rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, #93C5FD, #6EE7B7, #93C5FD)",
            padding: "3px",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
        >
          <div className="w-full h-full rounded-full bg-white/80 backdrop-blur-sm" />
        </motion.div>

        {/* Inner pulsing dot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
        >
          <div
            className="w-8 h-8 rounded-full"
            style={{
              background: "linear-gradient(135deg, #93C5FD, #6EE7B7)",
              boxShadow: "0 0 20px rgba(147, 197, 253, 0.6)",
            }}
          />
        </motion.div>
      </div>

      {/* Animated dots label */}
      <div className="flex items-center gap-1.5">
        <span className="text-slate-600 text-sm font-medium">{label}</span>
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "linear-gradient(135deg, #93C5FD, #6EE7B7)" }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{
              duration: 0.9,
              ease: "easeInOut",
              repeat: Infinity,
              delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}
