import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'ok' | 'warn' | 'bad' | 'muted' | 'secondary' | 'outline';

const variants: Record<BadgeVariant, string> = {
  default: 'border-slate-200 text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  secondary: 'border-accent/20 text-accent-text bg-accent-light dark:bg-accent/20 dark:text-accent-text',
  outline: 'border-slate-200 text-slate-600 bg-transparent dark:border-slate-700 dark:text-slate-300',
  ok: 'border-emerald-500/30 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
  warn: 'border-amber-500/30 text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
  bad: 'border-rose-500/30 text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
  muted: 'border-slate-200 text-slate-400 bg-slate-50 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  const variantClass = variants[variant] || variants.default;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border',
        variantClass,
        className
      )}
      {...props}
    />
  );
}
