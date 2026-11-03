import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'destructive';
  title?: string;
}

export function Alert({ className, variant = 'info', title, children, ...props }: AlertProps) {
  const styles = {
    info: 'bg-sky-50 border-sky-200 text-sky-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    destructive: 'bg-rose-50 border-rose-200 text-rose-800',
  };

  const icons = {
    info: <Info className="h-5 w-5 text-sky-600 shrink-0" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
    destructive: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-lg border p-4 text-sm flex items-start gap-3 shadow-sm',
        styles[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="space-y-1">
        {title && <h5 className="font-semibold leading-none tracking-tight">{title}</h5>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}
