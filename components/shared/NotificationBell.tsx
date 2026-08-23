'use client'
import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, FileText, Video, GraduationCap } from 'lucide-react'

interface Notification {
  id: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([
    {
      id: '1',
      title: 'تم تصحيح الواجب',
      body: 'قام المعلم بتصحيح واجب الرياضيات للأسبوع الأول.',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ])
  const ref = useRef<HTMLDivElement>(null)
  const unread = items.filter(n => !n.isRead).length

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function markAllRead() {
    setItems(p => p.map(n => ({ ...n, isRead: true })))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        aria-label="الإشعارات"
        aria-expanded={open}
        className="relative flex items-center justify-center w-8 h-8 rounded-md text-n-500 hover:text-n-800 hover:bg-n-100 dark:hover:bg-n-200 transition-colors duration-[140ms]"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute top-1 end-1 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full mt-2 end-0 z-50 w-80 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 shadow-dropdown overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-n-200 dark:border-n-300">
            <p className="text-sm font-semibold text-n-800 dark:text-n-700">الإشعارات</p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-n-500 hover:text-accent transition-colors duration-[140ms]"
              >
                <CheckCheck className="h-3 w-3" strokeWidth={2} />
                تعليم الكل كمقروء
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-n-100 dark:divide-n-200">
            {items.map(n => (
              <div
                key={n.id}
                className="flex items-start gap-3 px-4 py-3 text-n-800 dark:text-n-700 hover:bg-n-50 dark:hover:bg-n-200 transition-colors duration-[140ms]"
              >
                <GraduationCap className="h-4 w-4 flex-shrink-0 mt-0.5 text-accent" strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{n.title}</p>
                  <p className="text-xs text-n-500 dark:text-n-400 mt-0.5">{n.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
