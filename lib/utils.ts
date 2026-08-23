import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date)
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDateShort(date: Date | string | number): string {
  const d = new Date(date)
  return d.toLocaleDateString("ar-EG", {
    month: "short",
    day: "numeric",
  })
}

export function calculatePercentage(score: number, maxScore: number): number {
  if (!maxScore || maxScore <= 0) return 0
  return Math.round((score / maxScore) * 100)
}

/**
 * Returns a compact Arabic relative-time label for a future/past due date.
 * e.g.  "متبقي 3 أيام"  |  "متبقي 48 ساعة"  |  "اليوم"  |  "متأخر 2 أيام"
 */
export function relativeTimeAr(date: Date | string | number): { label: string; late: boolean } {
  const now = Date.now()
  const target = new Date(date).getTime()
  const diffMs = target - now
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffMs < 0) {
    // past
    const pastDays = Math.abs(diffDays)
    return { label: pastDays <= 0 ? 'متأخر اليوم' : `متأخر ${pastDays} ${pastDays === 1 ? 'يوم' : 'أيام'}`, late: true }
  }
  if (diffHours < 24) {
    if (diffHours <= 1) return { label: 'اليوم', late: false }
    return { label: `متبقي ${diffHours} ساعة`, late: false }
  }
  return { label: `متبقي ${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'}`, late: false }
}
