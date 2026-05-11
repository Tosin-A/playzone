"use client";

import { motion, useReducedMotion } from "framer-motion";

interface ReactBitsAmbientProps {
  className?: string;
}

export default function ReactBitsAmbient({ className = "" }: ReactBitsAmbientProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <motion.div
        className="absolute -left-16 top-8 h-56 w-56 rounded-full bg-accent/12 blur-3xl"
        animate={{
          x: [0, 46, -14, 0],
          y: [0, -24, 18, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 22.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-white/6 blur-3xl"
        animate={{
          x: [0, -40, 12, 0],
          y: [0, 26, -16, 0],
          scale: [1, 0.92, 1.05, 1],
        }}
        transition={{
          duration: 27.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.2,
        }}
      />

      <motion.div
        className="absolute bottom-0 left-1/4 h-52 w-52 rounded-full bg-accent/10 blur-3xl"
        animate={{
          x: [0, 24, -30, 0],
          y: [0, -32, 10, 0],
          scale: [1, 1.08, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.6,
        }}
      />

      <motion.div
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-accent/10 to-transparent"
        animate={{
          opacity: [0.25, 0.5, 0.25],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
