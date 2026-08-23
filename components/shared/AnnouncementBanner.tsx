'use client'
import { useState } from 'react'
import { X, Megaphone } from 'lucide-react'

interface Announcement {
  id: string
  message: string
}

export function AnnouncementBanner() {
  const [items] = useState<Announcement[]>([
    { id: '1', message: 'مرحباً بكم في الفصل الدراسي الجديد! مواعيد الحصص المباشرة منشورة في جدول الحصص.' }
  ])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = items.filter(a => !dismissed.has(a.id))
  if (visible.length === 0) return null

  const current = visible[0]

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full border-b border-n-200 dark:border-n-300 bg-n-100 dark:bg-n-200 overflow-hidden"
    >
      <div className="max-w-full px-4 py-2 flex items-center gap-2.5 text-xs text-n-700 dark:text-n-600" dir="rtl">
        <Megaphone className="h-3.5 w-3.5 flex-shrink-0 text-accent" strokeWidth={1.75} aria-hidden="true" />
        <p className="flex-1 min-w-0 truncate leading-5">{current.message}</p>
        <button
          onClick={() => setDismissed(p => new Set([...p, current.id]))}
          aria-label="إغلاق الإعلان"
          className="flex-shrink-0 text-n-400 hover:text-n-700 dark:hover:text-n-500 transition-colors duration-[140ms] p-0.5 rounded"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
