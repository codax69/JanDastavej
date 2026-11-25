import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useCitizenAuth } from '../../context/CitizenAuthContext.js';
import { Button } from '../ui/Button.js';

interface TourStep {
  route: string;
  targetId?: string;
  requiresAuth?: boolean;
  title: { en: string; gu: string };
  description: { en: string; gu: string };
}

const TOUR_STEPS: TourStep[] = [
  {
    route: '/',
    targetId: 'tour-search',
    title: { en: 'Welcome to JanDastavej', gu: 'JanDastavej માં આપનું સ્વાગત છે' },
    description: {
      en: 'Start here. Search for a government service or an affidavit, declaration, undertaking, or letter.',
      gu: 'અહીંથી શરૂ કરો. સરકારી સેવા અથવા સોગંદનામું, ઘોષણા, બાંહેધરીપત્ર અથવા પત્ર માટે શોધો.',
    },
  },
  {
    route: '/services',
    targetId: 'tour-services',
    title: { en: 'Choose a citizen service', gu: 'નાગરિક સેવા પસંદ કરો' },
    description: {
      en: 'Browse services by department or category. Open a service to see every document it requires.',
      gu: 'વિભાગ અથવા શ્રેણી મુજબ સેવાઓ જુઓ. જરૂરી દરેક દસ્તાવેજની યાદી જોવા સેવા ખોલો.',
    },
  },
  {
    route: '/documents',
    targetId: 'tour-template-library',
    title: { en: 'Search or filter formats', gu: 'ફોર્મેટ શોધો અથવા ફિલ્ટર કરો' },
    description: {
      en: 'Use search and category filters to find a specific template, then choose “Select Format”.',
      gu: 'ચોક્કસ ફોર્મેટ શોધવા માટે સર્ચ અથવા ફિલ્ટર વાપરો, પછી “Select Format” પસંદ કરો.',
    },
  },
  {
    route: '/documents',
    targetId: 'tour-template-library',
    title: { en: 'Review the document requirements', gu: 'દસ્તાવેજની જરૂરિયાતો ચકાસો' },
    description: {
      en: 'Open the format to review its purpose, required information, supporting documents, and next steps.',
      gu: 'હેતુ, જરૂરી માહિતી, સહાયક પુરાવા અને આગળના પગલાં જાણવા ફોર્મેટ ખોલો.',
    },
  },
  {
    route: '/documents',
    targetId: 'tour-template-library',
    title: { en: 'Enter details once', gu: 'વિગતો એકવાર ભરો' },
    description: {
      en: 'Select “Create Document” and complete the form. You can optionally scan a supporting document, but every extracted value must be reviewed.',
      gu: '“Create Document” પસંદ કરો અને ફોર્મ ભરો. વૈકલ્પિક રીતે સહાયક દસ્તાવેજ અપલોડ કરી શકો છો, પણ કાઢેલી દરેક વિગત તમે ચકાસવી જરૂરી છે.',
    },
  },
  {
    route: '/documents',
    targetId: 'tour-template-library',
    title: { en: 'Preview and edit', gu: 'પ્રિવ્યૂ કરો અને સુધારો કરો' },
    description: {
      en: 'After submission, inspect the A4 preview. Use “Edit Answers” if any detail or wording needs correction.',
      gu: 'સબમિટ કર્યા બાદ A4 પ્રિવ્યૂ તપાસો. કોઈ માહિતી અથવા લખાણ સુધારવું હોય તો “Edit Answers” વાપરો.',
    },
  },
  {
    route: '/documents',
    targetId: 'tour-template-library',
    title: { en: 'Accept the notice and export', gu: 'સૂચન સ્વીકારી ફાઈલ તૈયાર કરો' },
    description: {
      en: 'Accept the legal disclaimer, then download PDF or DOCX. Print it for the required signature, stamp, notarization, or submission process.',
      gu: 'કાનૂની સૂચન સ્વીકારો, પછી PDF અથવા DOCX ડાઉનલોડ કરો. સહી, સ્ટેમ્પ, નોટરી અથવા રજૂઆત માટે પ્રિન્ટ કરો.',
    },
  },
  {
    route: '/my-documents',
    targetId: 'tour-my-documents',
    requiresAuth: true,
    title: { en: 'Manage saved documents', gu: 'સાચવેલા દસ્તાવેજો મેનેજ કરો' },
    description: {
      en: 'Citizens with sign-in can upload supporting documents, keep documents in My Documents, refresh the vault, or remove them.',
      gu: 'પ્રવેશ કરેલ નાગરિકો સહાયક દસ્તાવેજો અપલોડ, My Documents માં રાખી, રિફ્રેશ અથવા દૂર કરી શકે છે.',
    },
  },
];

export function SiteTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { citizen } = useCitizenAuth();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const hasNavigatedRef = useRef(false);

  const visibleSteps = useMemo(
    () => citizen ? TOUR_STEPS : TOUR_STEPS.filter((step) => !step.requiresAuth),
    [citizen]
  );

  const closeTour = useCallback(() => {
    setOpen(false);
    setStepIndex(0);
    hasNavigatedRef.current = false;
    document.querySelector('.site-tour-highlight')?.classList.remove('site-tour-highlight');

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
  }, []);

  useEffect(() => {
    const startTour = () => {
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      hasNavigatedRef.current = false;
      setStepIndex(0);
      setOpen(true);
    };
    window.addEventListener('jandastavej:start-tour', startTour);
    return () => window.removeEventListener('jandastavej:start-tour', startTour);
  }, []);

  useEffect(() => {
    if (!open) return;

    const step = visibleSteps[stepIndex];
    if (!step) return;

    if (location.pathname !== step.route) {
      navigate(step.route, { replace: hasNavigatedRef.current });
      hasNavigatedRef.current = true;
    }

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      document.querySelector('.site-tour-highlight')?.classList.remove('site-tour-highlight');
      if (step.targetId) {
        const target = document.getElementById(step.targetId);
        if (target) {
          target.classList.add('site-tour-highlight');
          const largeTarget =
            step.targetId === 'tour-services' ||
            step.targetId === 'tour-my-documents' ||
            target.getBoundingClientRect().height > window.innerHeight * 0.6;
          target.scrollIntoView({
            behavior: 'smooth',
            block: largeTarget ? 'start' : 'center',
          });
          window.clearInterval(timer);
        }
      } else {
        window.clearInterval(timer);
      }
      if (attempts >= 20) window.clearInterval(timer);
    }, 100);

    return () => window.clearInterval(timer);
  }, [open, stepIndex, navigate, location.pathname, visibleSteps]);

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

  if (!open) return null;

  const step = visibleSteps[stepIndex];
  if (!step) return null;
  const isLast = stepIndex === visibleSteps.length - 1;

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
        className="pointer-events-auto absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 w-auto sm:w-[390px] max-h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border border-primary/20 bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {language === 'gu' ? `પગલું ${stepIndex + 1} / ${visibleSteps.length}` : `Step ${stepIndex + 1} of ${visibleSteps.length}`}
              </p>
              <h2 id="site-tour-title" className="text-base font-bold text-primary">
                {step.title[language === 'gu' ? 'gu' : 'en']}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={closeTour}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={language === 'gu' ? 'માર્ગદર્શન બંધ કરો' : 'Close tour'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p id="site-tour-description" className="text-sm leading-relaxed text-muted-foreground">
            {step.description[language === 'gu' ? 'gu' : 'en']}
          </p>
          <div className="flex items-center gap-1" aria-label="Tour progress">
            {visibleSteps.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              disabled={stepIndex === 0}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              {language === 'gu' ? 'પાછળ' : 'Back'}
            </Button>
            {isLast ? (
              <Button size="sm" onClick={closeTour} className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {language === 'gu' ? 'પૂર્ણ' : 'Finish'}
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStepIndex((current) => current + 1)} className="gap-1.5">
                {language === 'gu' ? 'આગળ' : 'Next'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
