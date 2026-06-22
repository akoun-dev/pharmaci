"use client";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-7 w-7 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-14 w-14 text-lg",
  };
  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm",
          sizeClasses[size]
        )}
      >
        {/* Cross/plus pharmacy symbol */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-[60%] w-[60%]"
          aria-hidden="true"
        >
          <path
            d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4z"
            fill="currentColor"
          />
        </svg>
      </div>
      <span
        className={cn(
          "font-bold tracking-tight text-primary",
          textSizes[size]
        )}
      >
        Pharmaci
      </span>
    </div>
  );
}
