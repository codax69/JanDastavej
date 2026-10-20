import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  requiredText?: string;
  error?: string;
  helpText?: string;
  options: SelectOption[];
  placeholderOption?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, required, requiredText, error, helpText, options, placeholderOption, id, ...props }, ref) => {
    const selectId = id || props.name || Math.random().toString(36).substring(2, 9);
    const errorId = error ? `${selectId}-error` : undefined;
    const helpId = helpText ? `${selectId}-help` : undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-foreground">
            {label}{' '}
            {required && (
              <span className="text-destructive font-semibold text-xs ml-1">
                {requiredText || '(આવશ્યક / required)'}
              </span>
            )}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          required={required}
          aria-invalid={!!error}
          aria-describedby={errorId || helpId}
          className={cn(
            'flex h-11 w-full rounded-md border border-input bg-card px-3.5 py-2 text-base text-foreground transition-colors min-h-[44px]',
            'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
            error && 'border-destructive focus-visible:outline-destructive',
            className
          )}
          {...props}
        >
          {placeholderOption && (
            <option value="" disabled>
              {placeholderOption}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {helpText && !error && (
          <p id={helpId} className="text-xs text-muted-foreground">{helpText}</p>
        )}
        {error && (
          <div id={errorId} className="flex items-center gap-1.5 text-xs font-medium text-destructive mt-1" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
