import React, { useState } from 'react';
import { X, Check, Eye, EyeOff, AlertCircle, FileText, CheckCircle2, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { Input } from '../ui/Input.js';
import { Checkbox } from '../ui/Checkbox.js';
import { Alert } from '../ui/Alert.js';

export interface ExtractedFieldItem {
  fieldKey: string;
  value: string;
  confidence: number;
  sourcePage?: number;
  isSensitive?: boolean;
}

interface ExtractionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData: any;
  extractionItems: ExtractedFieldItem[];
  onConfirm: (confirmedItems: Array<{ fieldKey: string; value: string }>, keepInVault: boolean) => void;
}

export function ExtractionReviewModal({
  isOpen,
  onClose,
  documentData,
  extractionItems,
  onConfirm,
}: ExtractionReviewModalProps) {
  const { language } = useLanguage();

  // State per field: accepted, editable value, unmasked toggle
  const [fieldStates, setFieldStates] = useState<
    Record<string, { accepted: boolean; value: string; unmasked: boolean }>
  >(() => {
    const initial: Record<string, { accepted: boolean; value: string; unmasked: boolean }> = {};
    for (const item of extractionItems) {
      initial[item.fieldKey] = {
        accepted: true, // Selected by default for citizen to confirm/edit/discard
        value: item.value,
        unmasked: false,
      };
    }
    return initial;
  });

  const [keepInVault, setKeepInVault] = useState(false);

  if (!isOpen) return null;

  const handleToggleAccept = (fieldKey: string) => {
    setFieldStates((prev) => ({
      ...prev,
      [fieldKey]: { ...prev[fieldKey], accepted: !prev[fieldKey]?.accepted },
    }));
  };

  const handleValueChange = (fieldKey: string, val: string) => {
    setFieldStates((prev) => ({
      ...prev,
      [fieldKey]: { ...prev[fieldKey], value: val },
    }));
  };

  const handleToggleMask = (fieldKey: string) => {
    setFieldStates((prev) => ({
      ...prev,
      [fieldKey]: { ...prev[fieldKey], unmasked: !prev[fieldKey]?.unmasked },
    }));
  };

  const handleApply = () => {
    const confirmed: Array<{ fieldKey: string; value: string }> = [];
    for (const [key, state] of Object.entries(fieldStates)) {
      if (state.accepted && state.value.trim()) {
        confirmed.push({ fieldKey: key, value: state.value.trim() });
      }
    }
    onConfirm(confirmed, keepInVault);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {language === 'gu'
                  ? 'દસ્તાવેજમાંથી મેળવેલી વિગતોની ચકાસણી'
                  : 'Review & Confirm Extracted Details'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {language === 'gu'
                  ? 'કોઈપણ વિગત આપોઆપ લાગુ થતી નથી. કૃપા કરીને દરેક વિગત ચકાસો અથવા સુધારો.'
                  : 'No values are auto-applied. Review, edit, or discard each item before pre-filling.'}
              </p>
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

        {/* Notice for sensitive numbers */}
        <div className="p-3 bg-warning-bg border border-warning/40 rounded-lg text-xs text-[#7A4510] flex items-center gap-2 shrink-0">
          <Shield className="h-4 w-4 shrink-0 text-[#7A4510]" />
          <span>
            {language === 'gu'
              ? 'સંવેદનશીલ ઓળખકર્તાઓ (આધાર, પાન) માસ્ક કરેલા છે. જો ફોર્મેટમાં જરૂરી હોય તો જ તેને ઉમેરો.'
              : 'Some documents contain sensitive numbers. Only add them if your affidavit specifically requires them.'}
          </span>
        </div>

        {/* Scrollable list of fields */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {extractionItems.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {language === 'gu'
                ? 'કોઈ સ્પષ્ટ વિગતો ઓળખાઈ શકી નથી. તમે ફોર્મમાં જાતે વિગતો ભરી શકો છો.'
                : 'No recognizable fields detected. You can always type the details manually in the form.'}
            </div>
          ) : (
            extractionItems.map((item) => {
              const state = fieldStates[item.fieldKey] || {
                accepted: true,
                value: item.value,
                unmasked: false,
              };

              const isSensitive =
                item.fieldKey.toLowerCase().includes('aadhaar') ||
                item.fieldKey.toLowerCase().includes('pan') ||
                item.fieldKey.toLowerCase().includes('passport') ||
                item.fieldKey.toLowerCase().includes('bank');

              return (
                <div
                  key={item.fieldKey}
                  className={`p-3.5 rounded-lg border transition-all ${
                    state.accepted
                      ? 'border-primary/40 bg-card shadow-xs'
                      : 'border-border bg-muted/20 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={state.accepted}
                        onChange={() => handleToggleAccept(item.fieldKey)}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                      />
                      <span className="font-semibold text-xs sm:text-sm text-foreground">
                        {item.fieldKey}
                      </span>
                    </label>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={item.confidence >= 0.8 ? 'success' : 'warning'}
                        className="text-[10px] px-1.5 py-0.5"
                      >
                        {item.confidence >= 0.8
                          ? `${Math.round(item.confidence * 100)}% match`
                          : `${Math.round(item.confidence * 100)}% check`}
                      </Badge>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAccept(item.fieldKey)}
                        className="text-xs h-7 px-2"
                      >
                        {state.accepted
                          ? language === 'gu'
                            ? 'બાકાત રાખો'
                            : 'Discard'
                          : language === 'gu'
                          ? 'સ્વીકારો'
                          : 'Accept'}
                      </Button>
                    </div>
                  </div>

                  {state.accepted && (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={state.value}
                        type={isSensitive && !state.unmasked ? 'password' : 'text'}
                        onChange={(e) => handleValueChange(item.fieldKey, e.target.value)}
                        className="text-sm h-9 font-medium"
                      />

                      {isSensitive && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleMask(item.fieldKey)}
                          className="h-9 px-2.5 shrink-0"
                          title={state.unmasked ? 'Hide' : 'Show'}
                        >
                          {state.unmasked ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Keep in My Documents opt-in (UD-06, UD-07) */}
        <div className="pt-3 border-t border-border shrink-0 space-y-3">
          <Checkbox
            id="keepInVaultCheck"
            checked={keepInVault}
            onChange={(e) => setKeepInVault(e.target.checked)}
            label={
              <span className="text-xs text-foreground font-medium">
                {language === 'gu'
                  ? 'આ ફાઇલને "My Documents" માં ૩૦ દિવસ માટે સાચવી રાખો (અન્ય દસ્તાવેજોમાં જોડાણ કરવા માટે)'
                  : 'Keep this document in private "My Documents" for 30 days (for annexure reuse)'}
              </span>
            }
          />

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>
              {language === 'gu' ? 'રદ કરો / જાતે ભરો' : 'Skip & Type Manually'}
            </Button>

            <Button
              size="sm"
              onClick={handleApply}
              disabled={extractionItems.length === 0}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{language === 'gu' ? 'ચકાસેલ વિગતો ફોર્મમાં ભરો' : 'Confirm & Pre-fill Form'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
