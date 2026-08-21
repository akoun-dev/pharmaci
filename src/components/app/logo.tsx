"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({
  className,
  size = "md",
  showText = true,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}) {
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };
  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/logo.svg"
        alt="Pharmaci"
        width={56}
        height={56}
        className={cn(sizeClasses[size], "rounded-xl object-contain")}
        priority
      />
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight text-primary",
            textSizes[size]
          )}
        >
          Pharmaci
        </span>
      )}
    </div>
  );
}
