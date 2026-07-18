"use client";

import { useMemo } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { resolveAnimationLevel } from "@/lib/appearance";

/** Framer Motion-friendly transition values driven by appearance settings */
export function useMotionConfig() {
  const { settings } = useSettings();
  const level = resolveAnimationLevel(settings.animationLevel);

  return useMemo(() => {
    if (level === "none") {
      return {
        level,
        duration: 0,
        distance: 0,
        transition: { duration: 0 },
        fade: { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } },
        scale: { initial: { opacity: 1, scale: 1 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 1, scale: 1 } },
      };
    }
    if (level === "reduced") {
      return {
        level,
        duration: 0.12,
        distance: 2,
        transition: { duration: 0.12 },
        fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
        scale: {
          initial: { opacity: 0, scale: 0.99 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.99 },
        },
      };
    }
    return {
      level,
      duration: 0.25,
      distance: 8,
      transition: { duration: 0.25 },
      fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
      scale: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
      },
    };
  }, [level]);
}
