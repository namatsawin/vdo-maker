import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background active:scale-95';
    
    const variants = {
      default: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-soft-md hover:shadow-soft-lg hover:from-blue-700 hover:to-blue-800 hover:-translate-y-0.5',
      destructive: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-soft-md hover:shadow-soft-lg hover:from-red-600 hover:to-red-700 hover:-translate-y-0.5',
      outline: 'border border-slate-300 bg-white/80 backdrop-blur-sm hover:bg-slate-50 hover:border-slate-400 shadow-soft hover:shadow-soft-md',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-soft hover:shadow-soft-md',
      ghost: 'hover:bg-slate-100 hover:text-slate-900 transition-colors',
      link: 'underline-offset-4 hover:underline text-blue-600 hover:text-blue-700',
    };

    const sizes = {
      default: 'h-11 px-6 py-2',
      sm: 'h-9 px-4 rounded-lg text-xs',
      lg: 'h-12 px-8 rounded-xl text-base',
      icon: 'h-11 w-11',
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
