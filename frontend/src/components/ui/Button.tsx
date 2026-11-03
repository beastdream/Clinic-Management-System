import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background select-none cursor-pointer';

    const variants = {
      default: 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-sm',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm',
      outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
      ghost: 'hover:bg-slate-100 text-slate-700',
      link: 'text-teal-600 underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizes = {
      default: 'h-10 py-2 px-4',
      sm: 'h-8 px-3 text-xs rounded-md',
      lg: 'h-11 px-6 rounded-md text-base',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
