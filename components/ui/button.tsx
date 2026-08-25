import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'ok' | 'outline' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'default' | 'icon' | 'icon-sm';
  loading?: boolean;
}

const base = [
  'inline-flex items-center justify-center gap-2',
  'font-semibold rounded-lg',
  'border border-transparent',
  'transition-colors duration-[140ms]',
  'focus-visible:outline-2 focus-visible:outline-accent',
  'disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
].join(' ');

const variants = {
  primary: 'bg-accent text-white border-accent hover:bg-accent-mid hover:border-accent-mid shadow-sm',
  default: 'bg-accent text-white border-accent hover:bg-accent-mid hover:border-accent-mid shadow-sm',
  secondary: 'bg-n-100 dark:bg-n-200 text-n-700 dark:text-n-600 border-n-200 dark:border-n-300 hover:bg-n-200 dark:hover:bg-n-300',
  ghost: 'bg-transparent text-n-600 dark:text-n-400 hover:bg-n-100 dark:hover:bg-n-200 hover:text-n-800',
  outline: 'bg-transparent border border-n-200 dark:border-n-300 text-n-700 dark:text-n-600 hover:bg-n-100 dark:hover:bg-n-200',
  danger: 'bg-bad text-white border-bad hover:bg-[#6B1A1A] hover:border-[#6B1A1A]',
  ok: 'bg-ok text-white border-ok hover:bg-[#245A42] hover:border-[#245A42]',
};

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-base',
  default: 'h-9 px-4 text-sm',
  icon: 'h-9 w-9 p-0',
  'icon-sm': 'h-7 w-7 p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const variantKey = variants[variant] ? variant : 'primary';
    const sizeKey = sizes[size] ? size : 'md';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variantKey], sizes[sizeKey], className)}
        {...props}
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span>انتظر...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
