"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useMotionConfig } from "@/hooks/useMotionConfig";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const width =
    size === "xl" ? "max-w-4xl" : size === "lg" ? "max-w-2xl" : "max-w-md";
  const motionConfig = useMotionConfig();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={motionConfig.fade.initial}
          animate={motionConfig.fade.animate}
          exit={motionConfig.fade.exit}
          transition={motionConfig.transition}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={motionConfig.scale.initial}
            animate={motionConfig.scale.animate}
            exit={motionConfig.scale.exit}
            transition={motionConfig.transition}
            role="dialog"
            aria-modal="true"
            className={`relative w-full ${width} app-card shadow-2xl`}
          >
            <div className="flex items-center justify-between mb-4">
              {title && (
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
              )}
              <button
                onClick={onClose}
                className="ml-auto p-1 rounded-lg hover:bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-token border border-transparent hover:border-[var(--border-color)]"
                aria-label="Close"
              >
                <X size={20} className="text-current" aria-hidden="true" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
