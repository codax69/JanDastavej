import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  requiredText?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, required, requiredText, error, id, ...props }, ref) => {
    const checkboxId = id || props.name || Math.random().toString(36).substring(2, 9);
    const errorId = error ? `${checkboxId}-error` : undefined;

    return (
      <div className="space-y-1">
        <label htmlFor={checkboxId} className="flex items-start gap-3 cursor-pointer select-none">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            required={required}
            aria-invalid={!!error}
            aria-describedby={errorId}
            className={cn(
              'h-5 w-5 mt-0.5 rounded border border-input text-primary focus:ring-ring focus:ring-2 focus:ring-offset-2 cursor-pointer shrink-0',
              error && 'border-destructive',
              className
            )}
            {...props}
          />
          <span className="text-sm font-medium text-foreground leading-snug">
            {label}{' '}
            {required && (
              <span className="text-destructive font-semibold text-xs ml-1">
                {requiredText || '(આવશ્યક)'}
              </span>
            )}
          </span>
        </label>
        {error && (
          <div id={errorId} className="flex items-center gap-1.5 text-xs font-medium text-destructive ml-8" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
