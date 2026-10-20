import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  requiredText?: string;
  error?: string;
  helpText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, required, requiredText, error, helpText, id, rows = 3, ...props }, ref) => {
    const textareaId = id || props.name || Math.random().toString(36).substring(2, 9);
    const errorId = error ? `${textareaId}-error` : undefined;
    const helpId = helpText ? `${textareaId}-help` : undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-foreground">
            {label}{' '}
            {required && (
              <span className="text-destructive font-semibold text-xs ml-1">
                {requiredText || '(આવશ્યક / required)'}
              </span>
            )}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          required={required}
          aria-invalid={!!error}
          aria-describedby={errorId || helpId}
          className={cn(
            'flex w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground transition-colors min-h-[80px]',
            'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
            error && 'border-destructive focus-visible:outline-destructive',
            className
          )}
          {...props}
        />
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
Textarea.displayName = 'Textarea';
