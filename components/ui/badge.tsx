import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'ok' | 'warn' | 'bad' | 'muted'

const variants: Record<BadgeVariant, string> = {
  default: 'border-n-300 text-n-600 bg-n-100 dark:bg-n-200 dark:text-n-400 dark:border-n-400',
  ok: 'border-ok/30 text-ok bg-ok-light dark:bg-ok-light/30',
  warn: 'border-warn/30 text-warn bg-warn-light dark:bg-warn-light/30',
  bad: 'border-bad/30 text-bad bg-bad-light dark:bg-bad-light/30',
  muted: 'border-n-200 text-n-400 bg-n-50 dark:bg-n-200 dark:border-n-300',
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
