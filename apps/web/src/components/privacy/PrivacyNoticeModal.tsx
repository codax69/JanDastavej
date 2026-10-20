import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Check, AlertCircle, Info, Lock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { api } from '../../api/client.js';
import { Button } from '../ui/Button.js';
import { Checkbox } from '../ui/Checkbox.js';
import { Alert } from '../ui/Alert.js';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentSaved?: () => void;
  requireProcessScope?: boolean;
}

export function PrivacyNoticeModal({
  isOpen,
  onClose,
  onConsentSaved,
  requireProcessScope = true,
}: PrivacyNoticeModalProps) {
  const { language } = useLanguage();

  const [consentProcess, setConsentProcess] = useState(false);
  const [consentKeep, setConsentKeep] = useState(false);
  const [consentAi, setConsentAi] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing consents if any
  useEffect(() => {
    if (isOpen) {
      api.getConsents()
        .then((res) => {
          const consents = res?.data || [];
          const proc = consents.find((c: any) => c.scope === 'process' && c.granted && !c.revokedAt);
          const keep = consents.find((c: any) => c.scope === 'keep' && c.granted && !c.revokedAt);
          const ai = consents.find((c: any) => c.scope === 'ai_assist' && c.granted && !c.revokedAt);
          setConsentProcess(!!proc);
          setConsentKeep(!!keep);
          setConsentAi(!!ai);
        })
        .catch(() => {
          // ignore error if unauthenticated or new
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (requireProcessScope && !consentProcess) {
      setError(
        language === 'gu'
          ? 'દસ્તાવેજમાંથી વિગતો વાંચવા માટે પ્રથમ સંમતિ આપવી આવશ્યક છે.'
          : 'Consent to process your document is required to proceed with upload.'
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.updateConsents([
        { scope: 'process', granted: consentProcess },
        { scope: 'keep', granted: consentKeep },
        { scope: 'ai_assist', granted: consentAi },
      ], '2026.1-DPDPA');

      onConsentSaved?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save consent settings.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {language === 'gu'
                  ? 'ગોપનીયતા નોટિસ અને સંમતિ (DPDP Act, 2023)'
                  : 'Privacy Notice & Consent (DPDP Act, 2023)'}
              </h3>
              <span className="text-[11px] text-muted-foreground font-mono">Notice v2026.1-DPDPA</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <Alert variant="destructive" title={language === 'gu' ? 'સંમતિ ક્ષતિ' : 'Consent Notice'}>
            {error}
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-3 leading-relaxed bg-muted/40 p-3.5 rounded-lg border border-border">
          <p>
            {language === 'gu'
              ? 'ડિજિટલ પર્સનલ ડેટા પ્રોટેક્શન એક્ટ, 2023 હેઠળ, JanDastavej તમારા વ્યક્તિગત સહાયક દસ્તાવેજો (ID પુરાવો, સરનામા પુરાવો) માત્ર તમારા ફોર્મની વિગતો પૂર્વ-ભરવા માટે પ્રક્રિયા કરે છે.'
              : 'In accordance with the Digital Personal Data Protection Act, 2023, JanDastavej processes your supporting documents solely to assist you in pre-filling your affidavit/declaration.'}
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <span className="font-semibold text-foreground">
                {language === 'gu' ? 'ડિફૉલ્ટ કોઈ સંગ્રહ નહીં:' : 'Default No Storage:'}
              </span>{' '}
              {language === 'gu'
                ? 'સત્ર સમાપ્ત થતાં અપલોડ કરેલી ફાઇલો આપોઆપ નાશ પામે છે.'
                : 'Files and extracted data are automatically erased at session end unless explicitly kept.'}
            </li>
            <li>
              <span className="font-semibold text-foreground">
                {language === 'gu' ? 'માનવ સમીક્ષા:' : 'Human in the Loop:'}
              </span>{' '}
              {language === 'gu'
                ? 'કોઈપણ વિગત તમારી ચકાસણી અને મંજૂરી વગર સીધી લાગુ થતી નથી.'
                : 'No extracted value is applied to your document without your per-field confirmation.'}
            </li>
            <li>
              <span className="font-semibold text-foreground">
                {language === 'gu' ? 'ભૂંસી નાખવાનો અધિકાર (Right to Erasure):' : 'Right to Erasure:'}
              </span>{' '}
              {language === 'gu'
                ? 'તમે ગમે ત્યારે "Delete all my data" દ્વારા તમારો તમામ ડેટા કાયમી રીતે કાઢી શકો છો.'
                : 'You may immediately and permanently delete any document or all data via "Delete all my data".'}
            </li>
          </ul>
        </div>

        {/* Granular Consent Checkboxes */}
        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-lg border border-border bg-card space-y-2">
            <Checkbox
              id="consent-process"
              checked={consentProcess}
              onChange={(e) => {
                setConsentProcess(e.target.checked);
                setError(null);
              }}
              label={
                <span className="font-semibold text-foreground text-sm">
                  {language === 'gu'
                    ? '૧. ફોર્મ ભરવા માટે દસ્તાવેજ સ્કેન કરવાની સંમતિ (આવશ્યક)'
                    : '1. Consent to scan & extract details to pre-fill form (Required)'}
                </span>
              }
            />
            <p className="text-xs text-muted-foreground pl-8">
              {language === 'gu'
                ? 'સર્વર સુરક્ષિત સ્થાનિક OCR અને નિયમોથી તમારું દસ્તાવેજ સ્કેન કરશે. સત્ર પૂર્ણ થતાં ફાઇલ ડિલીટ થશે.'
                : 'Server-side OCR and rules scan your document locally. The file is deleted at session end by default.'}
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card space-y-2">
            <Checkbox
              id="consent-keep"
              checked={consentKeep}
              onChange={(e) => setConsentKeep(e.target.checked)}
              label={
                <span className="font-semibold text-foreground text-sm">
                  {language === 'gu'
                    ? '૨. ભવિષ્યના ઉપયોગ માટે "My Documents" માં સાચવવાની સંમતિ (વૈકલ્પિક)'
                    : '2. Keep file in private "My Documents" for reuse (Optional)'}
                </span>
              }
            />
            <p className="text-xs text-muted-foreground pl-8">
              {language === 'gu'
                ? 'દસ્તાવેજ વધુમાં વધુ ૩૦ દિવસ માટે એનક્રિપ્ટેડ સંગ્રહિત રહેશે. તમે ગમે ત્યારે તેને કાઢી શકો છો.'
                : 'Retains encrypted document up to 30 days for reuse as an annexure. Can be deleted at any time.'}
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card space-y-2">
            <Checkbox
              id="consent-ai"
              checked={consentAi}
              onChange={(e) => setConsentAi(e.target.checked)}
              label={
                <span className="font-semibold text-foreground text-sm">
                  {language === 'gu'
                    ? '૩. AI-આધારિત સહાયક ફીલ્ડ મેપિંગ (વૈકલ્પિક, ડિફૉલ્ટ બંધ)'
                    : '3. Allow AI-assisted field mapping (Optional, Default Off)'}
                </span>
              }
            />
            <p className="text-xs text-muted-foreground pl-8">
              {language === 'gu'
                ? 'ફક્ત માન્ય સરકારી પ્રોવાઇડર સાથે જ, માત્ર માસ્ક કરેલ લખાણ (ઇમેજ નહીં) સહાય માટે મોકલી શકાય.'
                : 'Only masked text snippets (never images or full ID numbers) sent to approved provider.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {language === 'gu' ? 'રદ કરો' : 'Cancel'}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading || (requireProcessScope && !consentProcess)}
            className="gap-1.5"
          >
            {isLoading ? (
              <span>{language === 'gu' ? 'સાચવી રહ્યું છે...' : 'Saving...'}</span>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>{language === 'gu' ? 'સંમતિ સ્વીકારો અને આગળ વધો' : 'Accept & Proceed'}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
