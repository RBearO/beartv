"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  /** Calm matchmaking ring — rotates without flash/pulse */
  matchmaking?: boolean;
}

const SIZE_PX = {
  sm: 24,
  md: 40,
  lg: 64,
} as const;

export default function LoadingSpinner({
  size = "md",
  text,
  matchmaking = false,
}: LoadingSpinnerProps) {
  const px = SIZE_PX[size];

  return (
    <div
      className="flex flex-col items-center gap-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={cn(matchmaking ? "matchmaking-spinner" : "beartv-spinner")}
        style={{ width: px, height: px }}
        aria-hidden="true"
      />
      {text && <p className="text-sm matchmaking-status-text">{text}</p>}
      <span className="sr-only">{text || "Loading"}</span>
    </div>
  );
}
