import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Antalgiques: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  Antibiotiques: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  Antipaludéens: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  Vitamines: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  Pansements: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  Antihistaminiques: { bg: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500" },
  "Gastro-entérologie": { bg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500" },
}

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] || { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" }
}
