import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
  language?: 'gu' | 'en';
}

export function StepIndicator({ currentStep, language = 'gu' }: StepIndicatorProps) {
  const steps = [
    { number: 1, title: language === 'gu' ? 'દસ્તાવેજ પસંદગી' : 'Select document' },
    { number: 2, title: language === 'gu' ? 'વિગતો ભરો' : 'Enter details' },
    { number: 3, title: language === 'gu' ? 'પૂર્વાવલોકન' : 'Preview' },
    { number: 4, title: language === 'gu' ? 'ડાઉનલોડ / પ્રિન્ટ' : 'Download' },
  ];

  return (
    <div className="w-full py-4 mb-6 border-b border-border">
      {/* Mobile view: concise badge */}
      <div className="flex sm:hidden items-center justify-between px-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {language === 'gu' ? 'તબક્કો' : 'Step'} {currentStep} / 4
        </span>
        <span className="text-sm font-bold text-primary">
          {steps[currentStep - 1]?.title}
        </span>
      </div>

      {/* Desktop view: multi-step breadcrumb bar */}
      <ol className="hidden sm:flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((step, idx) => {
          const isDone = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isUpcoming = step.number > currentStep;

          return (
            <li key={step.number} className="flex-1 flex items-center">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shrink-0',
                    isDone && 'bg-success text-white',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-accent shadow-sm',
                    isUpcoming && 'bg-muted text-muted-foreground border border-border'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isDone ? <Check className="h-4 w-4" /> : step.number}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    isCurrent && 'font-bold text-primary',
                    isDone && 'text-foreground',
                    isUpcoming && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-3 sm:mx-4 transition-colors',
                    isDone ? 'bg-success' : 'bg-border'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
