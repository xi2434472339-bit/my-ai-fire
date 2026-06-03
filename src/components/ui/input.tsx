import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm',
        'placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'dark:border-slate-600 dark:bg-slate-800 dark:placeholder:text-slate-500',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
