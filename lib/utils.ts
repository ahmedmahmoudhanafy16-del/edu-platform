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
  return Math.min(100, Math.max(0, Math.round((score / maxScore) * 100)))
}

export function calcStudentAvg(results: {
  totalScore?: number | null
  autoScore?: number | null  
  maxScore?: number | null
}[]): number | null {
  if (!results?.length) return null
  const graded = results.filter(
    r => (r.totalScore != null) || (r.autoScore != null && r.autoScore > 0)
  )
  if (!graded.length) return null
  const earned = graded.reduce((a, r) => a + (r.totalScore ?? r.autoScore ?? 0), 0)
  const possible = graded.reduce((a, r) => a + (r.maxScore || 1), 0)
  return possible > 0 ? Math.round((earned / possible) * 100) : null
}

/**
 * Returns a compact Arabic relative-time label for a future/past due date.
 */
export function relativeTimeAr(date: Date | string | number): { label: string; late: boolean } {
  const now = Date.now()
  const target = new Date(date).getTime()
  const diffMs = target - now
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffMs < 0) {
    const pastDays = Math.abs(diffDays)
    return { label: pastDays <= 0 ? 'متأخر اليوم' : `متأخر ${pastDays} ${pastDays === 1 ? 'يوم' : 'أيام'}`, late: true }
  }
  if (diffHours < 24) {
    if (diffHours <= 1) return { label: 'اليوم', late: false }
    return { label: `متبقي ${diffHours} ساعة`, late: false }
  }
  return { label: `متبقي ${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'}`, late: false }
}

/**
 * Generate a random 4-digit PIN for NEW students only.
 * This is ONLY used in AddStudentModal as a suggestion.
 * The generated PIN is saved to the DB as defaultPassword — it is NEVER re-generated on display.
 */
export function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
