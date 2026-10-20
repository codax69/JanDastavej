import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Trash2, Eye, ShieldCheck, AlertCircle } from 'lucide-react';
import { api, ApiClientError } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { useSessionReuse } from '../../context/SessionReuseContext.js';
import { StepIndicator } from '../../components/shared/StepIndicator.js';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { Select } from '../../components/ui/Select.js';
import { Checkbox } from '../../components/ui/Checkbox.js';
import { Alert } from '../../components/ui/Alert.js';
import { TemplateField } from '@jandastavej/shared';

export function DynamicFormPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { optInReuse, setOptInReuse, savedAnswers, saveAnswers, clearAllData } = useSessionReuse();

  // Load existing answers if passed from preview's "Edit" button
  const initialAnswersFromState = (location.state as any)?.answers;

  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    return initialAnswersFromState || savedAnswers || {};
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

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
      setErrors({});
      clearAllData();
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
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-card border border-border rounded-lg animate-pulse" />
      </div>
    );
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
                const labelText = language === 'gu' && field.labelGu ? field.labelGu : field.label;
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
    </div>
  );
}
