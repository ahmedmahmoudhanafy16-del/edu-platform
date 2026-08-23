import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; href: string }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <Icon
        className="h-10 w-10 text-n-300 dark:text-n-400 mb-4"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <p className="text-base font-semibold text-n-700 dark:text-n-600">{title}</p>
      <p className="text-sm text-n-400 dark:text-n-500 mt-1 max-w-xs">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border border-n-200 dark:border-n-300 text-n-600 dark:text-n-400 hover:bg-n-100 dark:hover:bg-n-200 hover:text-n-800 transition-colors duration-[140ms]"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
