"use client";

import { cn } from "@/lib/utils";

interface ConnectionIndicatorProps {
  status: "connected" | "connecting" | "disconnected" | "searching" | "error";
  className?: string;
}

const statusConfig = {
  connected: {
    color: "bg-green-600 border-green-300",
    label: "Connected",
    symbol: "●",
  },
  connecting: {
    color: "bg-yellow-600 border-yellow-300",
    label: "Connecting",
    symbol: "◐",
  },
  searching: {
    color: "bg-[var(--accent)] border-[var(--accent-text)]",
    label: "Searching",
    symbol: "◎",
  },
  disconnected: {
    color: "bg-neutral-600 border-neutral-300",
    label: "Disconnected",
    symbol: "○",
  },
  error: {
    color: "bg-red-600 border-red-300",
    label: "Error",
    symbol: "!",
  },
} as const;

export default function ConnectionIndicator({ status, className }: ConnectionIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="status"
      aria-label={config.label}
    >
      <span
        className={cn(
          "inline-flex h-2.5 w-2.5 items-center justify-center rounded-full border text-[8px] leading-none text-white",
          config.color
        )}
        aria-hidden="true"
      >
        <span className="sr-only">{config.symbol}</span>
      </span>
      <span className="text-xs video-panel-muted">{config.label}</span>
    </div>
  );
}
