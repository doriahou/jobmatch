"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  /** Use stronger blur/opacity variant */
  strong?: boolean;
  /** Animate in on mount */
  animate?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  strong = false,
  animate = true,
  ...motionProps
}: GlassCardProps) {
  const baseClass = strong ? "glass-strong" : "glass";

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 16 } : false}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`${baseClass} rounded-2xl ${className}`}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
