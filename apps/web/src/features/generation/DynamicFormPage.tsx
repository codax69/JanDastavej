import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Trash2,
  Eye,
  ShieldCheck,
  AlertCircle,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  FileText,
  Lock,
} from 'lucide-react';
import { api, ApiClientError } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { useSessionReuse } from '../../context/SessionReuseContext.js';
import { useCitizenAuth } from '../../context/CitizenAuthContext.js';
import { StepIndicator } from '../../components/shared/StepIndicator.js';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { FormSkeleton } from '../../components/ui/Skeleton.js';
import { Select } from '../../components/ui/Select.js';
import { Checkbox } from '../../components/ui/Checkbox.js';
import { Alert } from '../../components/ui/Alert.js';
import { Badge } from '../../components/ui/Badge.js';
import { CitizenAuthModal } from '../../components/auth/CitizenAuthModal.js';
import { PrivacyNoticeModal } from '../../components/privacy/PrivacyNoticeModal.js';
import { ExtractionReviewModal, ExtractedFieldItem } from '../../components/documents/ExtractionReviewModal.js';
import { TemplateField } from '@jandastavej/shared';

export function DynamicFormPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { optInReuse, setOptInReuse, savedAnswers, saveAnswers, clearAllData } = useSessionReuse();
  const { citizen } = useCitizenAuth();

  // Load existing answers if passed from preview's "Edit" button
  const initialAnswersFromState = (location.state as any)?.answers;

  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    return initialAnswersFromState || savedAnswers || {};
  });

  const [filledFromDocKeys, setFilledFromDocKeys] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Upload & Extraction Modal States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('id_proof');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<{ document: any; extraction: any } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);


  const { data, isLoading, error } = useQuery({
    queryKey: ['template-detail', templateId, language],
    queryFn: () => api.getTemplateDetail(templateId!, language),
    enabled: !!templateId,
  });

  const template = data?.data?.template;
  const version = data?.data?.version;

  // When template fields load, merge with any saved answers
  useEffect(() => {
    if (version?.fields && !initialAnswersFromState && optInReuse && Object.keys(savedAnswers).length > 0) {
      setAnswers((prev) => ({
        ...savedAnswers,
        ...prev,
      }));
    }
  }, [version, optInReuse, savedAnswers, initialAnswersFromState]);

  const handleFieldChange = (key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    // Clear field-level error on change
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    setGeneralError(null);
  };

  const handleClear = () => {
    if (window.confirm(language === 'gu' ? 'શું તમે ખરેખર બધી ભરેલી વિગતો સાફ કરવા માંગો છો?' : 'Are you sure you want to clear all entered details?')) {
      setAnswers({});
      setFilledFromDocKeys([]);
      setErrors({});
      clearAllData();
    }
  };

  const handleOpenUpload = async () => {
    if (!citizen) {
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await api.getConsents();
      const hasProcess = (res?.data || []).some((c: any) => c.scope === 'process' && c.granted && !c.revokedAt);
      if (!hasProcess) {
        setShowPrivacyModal(true);
        return;
      }
    } catch {
      setShowPrivacyModal(true);
      return;
    }

    setUploadOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const res = await api.uploadDocument(file, uploadDocType, false);
      setExtractedData(res.data);
      setShowReviewModal(true);
      setUploadOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setUploadError(err.message || 'Failed to scan document.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmExtraction = (
    confirmedItems: Array<{ fieldKey: string; value: string }>,
    keepInVault: boolean
  ) => {
    const newAnswers = { ...answers };
    const newlyFilledKeys: string[] = [];
    for (const item of confirmedItems) {
      newAnswers[item.fieldKey] = item.value;
      newlyFilledKeys.push(item.fieldKey);
    }
    setAnswers(newAnswers);
    setFilledFromDocKeys((prev) => Array.from(new Set([...prev, ...newlyFilledKeys])));

    if (keepInVault && extractedData?.document?._id) {
      api.keepDocument(extractedData.document._id, 30).catch(() => {});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version) return;

    setSubmitting(true);
    setGeneralError(null);
    setErrors({});

    try {
      // 1. Persist session answers if opt-in is enabled
      if (optInReuse) {
        saveAnswers(answers);
      }

      // 2. Call server-side preview creation endpoint
      const response = await api.createPreview({
        templateVersionId: version._id || templateId!,
        answers,
        language,
      });

      // 3. Navigate to preview screen
      navigate(`/preview/${response.data.sessionId}`, {
        state: {
          answers,
          templateSlug: template?.slug || templateId,
          versionId: version._id,
        },
      });
    } catch (err: any) {
      if (err instanceof ApiClientError && err.fields) {
        setErrors(err.fields);
        setGeneralError(err.message);
      } else {
        setGeneralError(err.message || 'An unexpected error occurred. Please check your entries.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <FormSkeleton />;
  }

  if (error || !template || !version) {
    return (
      <div className="p-8 text-center bg-card border border-destructive/30 rounded-lg space-y-4 max-w-xl mx-auto">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-destructive">
          {language === 'gu' ? 'દસ્તાવેજ ફોર્મ લોડ થઈ શક્યું નથી' : 'Failed to load form'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {(error as any)?.message || 'Template version not available.'}
        </p>
        <Link to="/documents">
          <Button variant="outline" size="sm">
            {language === 'gu' ? 'લાઇબ્રેરી પર પાછા જાઓ' : 'Back to Templates'}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Step Indicator: Step 2 */}
      <StepIndicator currentStep={2} language={language} />

      {/* Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to={`/documents/${template.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'gu' ? 'દસ્તાવેજ વિગતો પર પાછા' : 'Back to Details'}</span>
        </Link>

        {Object.keys(answers).length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-destructive hover:bg-destructive/10 text-xs gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{language === 'gu' ? 'ડેટા સાફ કરો' : 'Clear My Data'}</span>
          </Button>
        )}
      </div>

      {/* Optional Upload Supporting Document Entry Point (D1, P0) */}
      <div className="bg-card border border-primary/20 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-sm sm:text-base text-foreground">
                {language === 'gu'
                  ? 'તમારો દસ્તાવેજ અપલોડ કરી વિગતો ભરો (વૈકલ્પિક)'
                  : 'Upload supporting document to fill details (Optional)'}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'gu'
                ? 'આધાર, પાન અથવા સરનામા પુરાવો સ્કેન કરી ફોર્મ આપોઆપ ભરવામાં સહાય મેળવો. હંમેશા તમારી ચકાસણી પછી જ વિગતો લાગુ થશે.'
                : 'Scan an ID/address proof to pre-fill fields. You review and confirm every value.'}
            </p>
          </div>

          {!uploadOpen && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenUpload}
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5 shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{language === 'gu' ? 'દસ્તાવેજ અપલોડ કરો' : 'Upload Document'}</span>
            </Button>
          )}
        </div>

        {uploadOpen && (
          <div className="pt-3 border-t border-border space-y-3">
            {uploadError && (
              <Alert variant="destructive" title={language === 'gu' ? 'અપલોડ ક્ષતિ' : 'Upload Error'}>
                {uploadError}
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {language === 'gu' ? 'દસ્તાવેજનો પ્રકાર' : 'Document Type'}
                </label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                >
                  <option value="id_proof">{language === 'gu' ? 'ઓળખનો પુરાવો (ID Proof)' : 'ID Proof (Aadhaar / Voter ID / PAN)'}</option>
                  <option value="address_proof">{language === 'gu' ? 'સરનામાનો પુરાવો (Address Proof)' : 'Address Proof (Ration / Electricity / Tax)'}</option>
                  <option value="previous_affidavit">{language === 'gu' ? 'અગાઉનું સોગંદનામું (Previous Affidavit)' : 'Previous Affidavit'}</option>
                  <option value="other">{language === 'gu' ? 'અન્ય સહાયક દસ્તાવેજ (Other)' : 'Other Supporting Document'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {language === 'gu' ? 'ફાઇલ પસંદ કરો (PDF, JPG, PNG ≤ 10MB)' : 'Select File (PDF, JPG, PNG ≤ 10MB)'}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  capture="environment"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
              </div>
            </div>

            {uploading && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2.5 text-xs text-primary font-medium animate-pulse">
                <Sparkles className="h-4 w-4 shrink-0 animate-spin" />
                <span>
                  {language === 'gu'
                    ? 'સુરક્ષા તપાસ અને લખાણ સ્કેન થઈ રહ્યું છે... કૃપા કરીને રાહ જુઓ.'
                    : 'Running safety scan & local OCR extraction... Please wait.'}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUploadOpen(false)}
                disabled={uploading}
                className="text-xs"
              >
                {language === 'gu' ? 'બંધ કરો' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="border-b border-border space-y-2">
          <CardTitle className="text-xl sm:text-2xl text-primary">
            {language === 'gu' ? template.titleGu : template.title}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {language === 'gu'
              ? 'કૃપા કરીને નીચે દર્શાવેલી તમામ જરૂરી વિગતો કાળજીપૂર્વક ભરો.'
              : 'Please enter only the required details accurately to generate your document.'}
          </p>
        </CardHeader>

        <CardContent className="pt-6">
          {generalError && (
            <div className="mb-6">
              <Alert variant="destructive" title={language === 'gu' ? 'ચકાસણી ક્ષતિ' : 'Validation Error'}>
                {generalError}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Dynamic fields mapped from schema */}
            <div className="space-y-5">
              {version.fields.map((field: TemplateField) => {
                const baseLabel = language === 'gu' && field.labelGu ? field.labelGu : field.label;
                const isFromDoc = filledFromDocKeys.includes(field.key);
                const labelText = (
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    <span>{baseLabel}</span>
                    {isFromDoc && (
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/40 py-0 px-1.5 font-normal">
                        {language === 'gu' ? 'તમારા દસ્તાવેજમાંથી' : 'from your document'}
                      </Badge>
                    )}
                  </span>
                );
                const placeholderText = language === 'gu' && field.placeholderGu ? field.placeholderGu : field.placeholder;
                const help = language === 'gu' && field.helpTextGu ? field.helpTextGu : field.helpText;
                const fieldError = errors[field.key];
                const value = answers[field.key] ?? '';

                switch (field.type) {
                  case 'textarea':
                    return (
                      <Textarea
                        key={field.key}
                        id={`field-${field.key}`}
                        name={field.key}
                        label={labelText}
                        required={field.required}
                        requiredText={language === 'gu' ? '(આવશ્યક)' : '(required)'}
                        placeholder={placeholderText}
                        helpText={help}
                        error={fieldError}
                        value={value}
                        maxLength={field.maxLength}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      />
                    );

                  case 'select':
                    return (
                      <Select
                        key={field.key}
                        id={`field-${field.key}`}
                        name={field.key}
                        label={labelText}
                        required={field.required}
                        requiredText={language === 'gu' ? '(આવશ્યક)' : '(required)'}
                        helpText={help}
                        error={fieldError}
                        value={value}
                        options={(field.options || []).map((opt) => ({
                          value: opt.value,
                          label: language === 'gu' && opt.labelGu ? opt.labelGu : opt.label,
                        }))}
                        placeholderOption={language === 'gu' ? '-- વિકલ્પ પસંદ કરો --' : '-- Select option --'}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      />
                    );

                  case 'checkbox':
                    return (
                      <Checkbox
                        key={field.key}
                        id={`field-${field.key}`}
                        name={field.key}
                        label={labelText}
                        required={field.required}
                        requiredText={language === 'gu' ? '(આવશ્યક)' : '(required)'}
                        error={fieldError}
                        checked={Boolean(value)}
                        onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                      />
                    );

                  case 'date':
                    return (
                      <Input
                        key={field.key}
                        id={`field-${field.key}`}
                        name={field.key}
                        type="date"
                        label={labelText}
                        required={field.required}
                        requiredText={language === 'gu' ? '(આવશ્યક)' : '(required)'}
                        helpText={help}
                        error={fieldError}
                        value={value}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      />
                    );

                  case 'number':
                    return (
                      <Input
                        key={field.key}
                        id={`field-${field.key}`}
                        name={field.key}
                        type="number"
                        min={field.min}
                        max={field.max}
                        label={labelText}
                        required={field.required}
                        requiredText={language === 'gu' ? '(આવશ્યક)' : '(required)'}
                        placeholder={placeholderText}
                        helpText={help}
                        error={fieldError}
                        value={value}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      />
                    );

                  case 'text':
                  default:
                    return (
                      <Input
                        key={field.key}
                        id={`field-${field.key}`}
                        name={field.key}
                        type="text"
                        label={labelText}
                        required={field.required}
                        requiredText={language === 'gu' ? '(આવશ્યક)' : '(required)'}
                        placeholder={placeholderText}
                        helpText={help}
                        error={fieldError}
                        value={value}
                        maxLength={field.maxLength}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      />
                    );
                }
              })}
            </div>

            {/* Session Opt-in Control (F3) */}
            <div className="pt-4 border-t border-border">
              <Checkbox
                id="optInSessionReuse"
                checked={optInReuse}
                onChange={(e) => setOptInReuse(e.target.checked)}
                label={
                  <span className="text-xs text-muted-foreground">
                    {language === 'gu'
                      ? 'આ સત્ર દરમિયાન અન્ય દસ્તાવેજો માટે મારી માહિતી સાચવી રાખો (ઓપ્ટ-ઇન). સત્ર બંધ થતાં ડેટા ભૂંસાઈ જશે.'
                      : 'Remember my entered details for reuse in other documents during this browser session (opt-in).'}
                  </span>
                }
              />
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link to={`/documents/${template.slug}`} className="w-full sm:w-auto">
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  {language === 'gu' ? 'રદ કરો' : 'Cancel'}
                </Button>
              </Link>

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full sm:w-auto gap-2"
              >
                {submitting ? (
                  <span>{language === 'gu' ? 'પ્રિવ્યૂ બની રહ્યું છે...' : 'Generating Preview...'}</span>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>{language === 'gu' ? 'પૂર્વાવલોકન જુઓ' : 'Review Preview'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Citizen Authentication Modal */}
      <CitizenAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          handleOpenUpload();
        }}
      />

      {/* Privacy Notice & Consent Modal (DPDP Act 2023) */}
      <PrivacyNoticeModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onConsentSaved={() => {
          setShowPrivacyModal(false);
          setUploadOpen(true);
        }}
        requireProcessScope={true}
      />

      {/* Extraction Review Modal (UD-04, UD-05) */}
      {extractedData && (
        <ExtractionReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          documentData={extractedData.document}
          extractionItems={(extractedData.extraction?.items || []).map((item: any) => ({
            fieldKey: item.fieldKey,
            value: item.valueEnc, // in dev/mock, unencrypted string
            confidence: item.confidence,
            sourcePage: item.page,
          }))}
          onConfirm={handleConfirmExtraction}
        />
      )}
    </div>
  );
}

