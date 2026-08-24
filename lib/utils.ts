import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Returns a percentage rounded to 0 decimal places, clamped 0–100 */
export function calculatePercentage(score: number, max: number): number {
  if (!max || max <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((score / max) * 100)));
}

/** Relative time label in Arabic for a due date */
export function relativeTimeAr(date: Date | string): { label: string; late: boolean } {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) return { label: 'متأخر', late: true };
  if (diffDays === 0) return { label: 'اليوم', late: false };
  if (diffDays === 1) return { label: 'غداً', late: false };
  if (diffDays <= 7) return { label: `${diffDays} أيام`, late: false };
  return { label: `${diffDays} يوم`, late: false };
}
