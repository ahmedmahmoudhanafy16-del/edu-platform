import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-lg border border-n-200 dark:border-n-300 bg-white dark:bg-n-200',
        'px-3 text-sm text-n-800 dark:text-n-700 placeholder:text-n-400',
        'transition-colors duration-[140ms]',
        'focus:border-accent focus:outline-none',
        'disabled:bg-n-100 disabled:cursor-not-allowed disabled:text-n-400',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
