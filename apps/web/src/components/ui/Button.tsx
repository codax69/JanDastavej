import React from 'react';
import { cn } from '../../lib/utils.js';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-[#17304F] shadow-sm',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-[#D8DFE8]',
      outline: 'border border-border bg-card text-foreground hover:bg-muted',
      destructive: 'bg-destructive text-white hover:bg-[#962018]',
      ghost: 'text-foreground hover:bg-muted',
    };

    const sizes = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-11 px-4 py-2 text-sm min-h-[44px]',
      lg: 'h-12 px-6 text-base min-h-[48px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
