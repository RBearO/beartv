import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glass?: boolean;
}

export default function Card({ children, className, glass = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "app-card rounded-token shadow-xl",
        glass ? "glass" : "bg-[var(--card-bg)] border border-[var(--border-color)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
