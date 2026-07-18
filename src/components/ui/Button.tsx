import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary:
        "bg-bear-brown hover:bg-bear-brown/90 text-white shadow-lg shadow-bear-brown/20",
      secondary:
        "bg-[var(--surface-background)] hover:opacity-90 text-[var(--text-primary)] border border-[var(--border-default)]",
      ghost:
        "hover:bg-[var(--surface-background)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      danger: "bg-red-600 hover:bg-red-700 text-white",
      gold: "bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-semibold shadow-lg",
    };

    const sizes = {
      sm: "px-3 text-sm rounded-lg",
      md: "px-5 text-sm rounded-xl",
      lg: "px-8 text-base rounded-xl",
      xl: "px-12 text-lg rounded-2xl",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium app-control-btn",
          "transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
          "duration-[var(--animation-duration-fast)]",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" data-decorative-motion>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
