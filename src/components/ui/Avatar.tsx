"use client";

import { cn, getInitials } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
};

export default function Avatar({ src, name, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name || "Avatar"}
        width={80}
        height={80}
        className={cn("rounded-full object-cover", sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-[var(--surface-bg)] border-2 border-[var(--accent)]",
        "flex items-center justify-center font-semibold text-[var(--accent)]",
        sizes[size],
        className
      )}
      aria-label={name ? `Avatar for ${name}` : "Avatar"}
    >
      {getInitials(name)}
    </div>
  );
}
