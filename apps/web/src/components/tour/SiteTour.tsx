import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, MapPin, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useCitizenAuth } from '../../context/CitizenAuthContext.js';
import { Button } from '../ui/Button.js';
import { NECESSARY_TOUR_STEPS, TourPageId } from './tourSteps.js';

function isElementVisible(element: HTMLElement | null): element is HTMLElement {
  if (!element || !element.isConnected) return false;
  if (element.getClientRects().length === 0) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function findVisibleTarget(targetId?: string, fallbackTargetId?: string): HTMLElement | null {
  if (targetId) {
    const primary = document.getElementById(targetId);
    if (isElementVisible(primary)) return primary;
  }
  if (fallbackTargetId) {
    const fallback = document.getElementById(fallbackTargetId);
    if (isElementVisible(fallback)) return fallback;
  }
  return null;
}

export function SiteTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { citizen } = useCitizenAuth();

  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [transitionBanner, setTransitionBanner] = useState<string | null>(null);

  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const hasNavigatedRef = useRef(false);
  const previousPageIdRef = useRef<TourPageId | null>(null);

  const langKey = language === 'gu' ? 'gu' : 'en';

  const visibleSteps = useMemo(() => {
    const ctx = { isCitizenAuthenticated: Boolean(citizen) };
    return NECESSARY_TOUR_STEPS.filter((step) => !step.when || step.when(ctx));
  }, [citizen]);

  const currentStep = visibleSteps[stepIndex] || visibleSteps[0];

  const clearHighlight = useCallback(() => {
    document.querySelectorAll('.site-tour-highlight').forEach((el) => {
      el.classList.remove('site-tour-highlight');
    });
  }, []);

  const closeTour = useCallback(() => {
    setOpen(false);
    setStepIndex(0);
    setTransitionBanner(null);
    hasNavigatedRef.current = false;
    previousPageIdRef.current = null;
    clearHighlight();

    const elementToRestore = returnFocusRef.current;
    const openerIsVisible =
      elementToRestore?.isConnected &&
      elementToRestore.offsetParent !== null &&
      !elementToRestore.hasAttribute('disabled');

    const visibleReplacement = Array.from(
      document.querySelectorAll<HTMLElement>(
        '#site-tour-launcher, [aria-label="Open navigation menu"]'
      )
    ).find((element) => element.offsetParent !== null && !element.hasAttribute('disabled'));

    const focusTarget = openerIsVisible ? elementToRestore : visibleReplacement;
    if (focusTarget) {
      window.requestAnimationFrame(() => focusTarget.focus());
    }
  }, [clearHighlight]);

  useEffect(() => {
    const startTour = () => {
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      hasNavigatedRef.current = false;
      previousPageIdRef.current = null;
      setTransitionBanner(null);
      setStepIndex(0);
      setOpen(true);
    };
    window.addEventListener('jandastavej:start-tour', startTour);
    return () => window.removeEventListener('jandastavej:start-tour', startTour);
  }, []);

  useEffect(() => {
    if (!open || visibleSteps.length === 0) return;
    if (stepIndex >= visibleSteps.length) {
      setStepIndex(visibleSteps.length - 1);
    }
  }, [open, stepIndex, visibleSteps.length]);

  useEffect(() => {
    if (!open || !currentStep) return;

    const prevPageId = previousPageIdRef.current;
    if (prevPageId && prevPageId !== currentStep.pageId && currentStep.transitionMessage) {
      setTransitionBanner(currentStep.transitionMessage[langKey]);
    } else if (prevPageId === currentStep.pageId) {
      setTransitionBanner(null);
    }
    previousPageIdRef.current = currentStep.pageId;
  }, [open, currentStep, langKey]);

  useEffect(() => {
    if (!open || !currentStep) return;

    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route, { replace: hasNavigatedRef.current });
      hasNavigatedRef.current = true;
    }

    let attempts = 0;
    clearHighlight();

    const applyHighlight = (): boolean => {
      clearHighlight();
      if (!currentStep.targetId && !currentStep.fallbackTargetId) return true;

      const target = findVisibleTarget(currentStep.targetId, currentStep.fallbackTargetId);
      if (target) {
        target.classList.add('site-tour-highlight');
        const largeTarget =
          currentStep.targetId === 'tour-services' ||
          currentStep.targetId === 'tour-my-documents' ||
          target.getBoundingClientRect().height > window.innerHeight * 0.55;
        target.scrollIntoView({
          behavior: 'smooth',
          block: largeTarget ? 'start' : 'center',
        });
        return true;
      }
      return false;
    };

    if (applyHighlight()) return;

    const timer = window.setInterval(() => {
      attempts += 1;
      if (applyHighlight() || attempts >= 20) {
        window.clearInterval(timer);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [open, currentStep, navigate, location.pathname, clearHighlight]);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.querySelector('[data-citizen-auth-dialog="true"]')) return;

      if (event.key === 'Escape') closeTour();
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.offsetParent !== null);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      } else if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, closeTour]);

  if (!open || !currentStep) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex >= visibleSteps.length - 1;

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none">
      <div className="absolute inset-0 bg-slate-950/25 pointer-events-auto" onClick={closeTour} />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-tour-title"
        aria-describedby="site-tour-description"
        tabIndex={-1}
        className="pointer-events-auto fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 w-auto sm:w-[395px] max-h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border-2 border-accent ring-4 ring-accent/25 bg-card shadow-2xl"
      >
        {/* Top Golden Tour Accent Header */}
        <div className="flex items-start justify-between gap-3 border-b border-accent/40 bg-accent/10 p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-xs">
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {currentStep.pageTitle[langKey]} ·{' '}
                {language === 'gu'
                  ? `પગલું ${stepIndex + 1} / ${visibleSteps.length}`
                  : `Step ${stepIndex + 1} of ${visibleSteps.length}`}
              </p>
              <h2 id="site-tour-title" className="text-base font-bold text-primary leading-snug">
                {currentStep.title[langKey]}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={closeTour}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            aria-label={language === 'gu' ? 'માર્ગદર્શન બંધ કરો' : 'Close tour'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {transitionBanner && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg border border-accent/60 bg-warning-bg px-3 py-1.5 text-xs font-semibold text-accent-foreground"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-warning" />
              <span>{transitionBanner}</span>
            </div>
          )}

          <p id="site-tour-description" className="text-sm leading-relaxed text-muted-foreground">
            {currentStep.description[langKey]}
          </p>

          <div className="flex items-center gap-1" aria-label="Tour progress">
            {visibleSteps.map((step, index) => (
              <span
                key={step.id}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  index <= stepIndex ? 'bg-accent' : 'bg-border'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStepIndex((curr) => Math.max(0, curr - 1))}
              disabled={isFirst}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{language === 'gu' ? 'પાછળ' : 'Previous'}</span>
            </Button>

            <div className="flex items-center gap-1.5">
              {!isLast && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeTour}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {language === 'gu' ? 'છોડો' : 'Skip'}
                </Button>
              )}

              {isLast ? (
                <Button size="sm" onClick={closeTour} className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{language === 'gu' ? 'પૂર્ણ' : 'Finish'}</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setStepIndex((curr) => Math.min(visibleSteps.length - 1, curr + 1))}
                  className="gap-1.5"
                >
                  <span>{language === 'gu' ? 'આગળ' : 'Next'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
