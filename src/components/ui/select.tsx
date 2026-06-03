import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'dark:border-slate-600 dark:bg-slate-800',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';
