import React from 'react';
import { cn } from '../../lib/utils.js';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground border border-amber-300/60 font-semibold',
    success: 'bg-success/15 text-success border border-success/30 font-medium',
    warning: 'bg-warning-bg text-warning border border-warning/40 font-medium',
    destructive: 'bg-destructive/15 text-destructive border border-destructive/30 font-medium',
    outline: 'border border-border text-foreground',
  };

  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
