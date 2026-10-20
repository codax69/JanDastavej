import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'destructive' | 'success';
  title?: string;
}

export function Alert({ className, variant = 'info', title, children, ...props }: AlertProps) {
  const icons = {
    info: <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />,
    destructive: <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />,
  };

  const styles = {
    info: 'bg-secondary/60 text-foreground border-secondary-foreground/20',
    warning: 'bg-warning-bg text-[#7A4510] border-warning/40',
    destructive: 'bg-destructive/10 text-destructive border-destructive/30',
    success: 'bg-success/10 text-success border-success/30',
  };

  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 p-4 rounded-md border text-sm', styles[variant], className)}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-semibold leading-none tracking-tight">{title}</h5>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}
