"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "gold";
  className?: string;
}

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default:
      "bg-[var(--surface-bg)] text-[var(--text-secondary)] border border-[var(--border-color)]",
    success: "bg-green-900/40 text-green-200 border border-green-500/60",
    warning: "bg-yellow-900/40 text-yellow-100 border border-yellow-500/60",
    danger: "bg-red-900/40 text-red-100 border border-red-500/60",
    gold: "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)] border border-[var(--accent)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
