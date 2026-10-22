import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';
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
import { FormSkeleton } from '../../components/ui/Skeleton.js';
import { Badge } from '../../components/ui/Badge.js';

export function ServiceBundleFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationAnswers = location.state?.answers;
  const { optInReuse, setOptInReuse, savedAnswers, saveAnswers, clearAllData } = useSessionReuse();

  const { data, isLoading } = useQuery({
    queryKey: ['service-detail', slug, language],
    queryFn: () => api.getServiceDetail(slug!, language),
    enabled: !!slug,
  });

  const service = data?.data;

  // Selected document slugs for bundle generation
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  // Initialize selected docs once service loads
  useEffect(() => {
    if (service?.requiredTemplates && selectedDocs.length === 0) {
      // Default select all mandatory templates
      const initial = service.requiredTemplates
        .filter((t: any) => t.isMandatory || service.requiredTemplates.length <= 2)
        .map((t: any) => t.templateSlug);
      setSelectedDocs(initial.length > 0 ? initial : service.requiredTemplates.map((t: any) => t.templateSlug));
    }
  }, [service]);

  // Form answers state
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    return {
      place: language === 'gu' ? 'ગાંધીનગર' : 'Gandhinagar',
      declarationDate: new Date().toISOString().split('T')[0],
      ...savedAnswers,
      ...(navigationAnswers || {}),
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleFieldChange = (key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    setGeneralError(null);
  };

  const handleToggleDoc = (docSlug: string) => {
    setSelectedDocs((prev) => {
      if (prev.includes(docSlug)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((s) => s !== docSlug);
      } else {
        return [...prev, docSlug];
      }
    });
  };

  const handleClear = () => {
    if (
      window.confirm(
        language === 'gu'
          ? 'શું તમે ખરેખર બધી ભરેલી વિગતો સાફ કરવા માંગો છો?'
          : 'Are you sure you want to clear all entered details?'
      )
    ) {
      setAnswers({
        place: language === 'gu' ? 'ગાંધીનગર' : 'Gandhinagar',
        declarationDate: new Date().toISOString().split('T')[0],
      });
      setErrors({});
      clearAllData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || selectedDocs.length === 0) return;

    // Validate core fields
    const validationErrors: Record<string, string> = {};
    if (!answers.fullName?.trim()) {
      validationErrors.fullName = language === 'gu' ? 'પૂર્ણ નામ જરૂરી છે' : 'Full Name is required';
    }
    if (!answers.address?.trim()) {
      validationErrors.address = language === 'gu' ? 'સરનામું જરૂરી છે' : 'Address is required';
    }
    if (!answers.declarationDate) {
      validationErrors.declarationDate = language === 'gu' ? 'તારીખ જરૂરી છે' : 'Date is required';
    }

    // Specific validation if income declaration selected
    if (selectedDocs.includes('income-declaration') && !answers.annualIncome) {
      validationErrors.annualIncome = language === 'gu' ? 'વાર્ષિક આવક જરૂરી છે' : 'Annual Income is required';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setGeneralError(
        language === 'gu'
          ? 'કૃપા કરીને લાલ રંગથી દર્શાવેલ તમામ જરૂરી ખાના ભરો.'
          : 'Please correct the highlighted errors before proceeding.'
      );
      return;
    }

    setSubmitting(true);
    setGeneralError(null);

    try {
      if (optInReuse) {
        saveAnswers(answers);
      }

      const res = await api.createServiceBundle({
        serviceSlug: service.slug,
        language,
        answers,
        selectedTemplateSlugs: selectedDocs,
      });

      navigate(`/services/${service.slug}/bundle/${service.slug}`, {
        state: {
          bundleData: res.data,
          service,
          answers,
        },
      });
    } catch (err: any) {
      if (err instanceof ApiClientError && err.fields) {
        setErrors(err.fields);
        setGeneralError(err.message);
      } else {
        setGeneralError(err.message || 'Failed to generate documents. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !service) {
    return <FormSkeleton />;
  }

  const hasIncomeDoc = selectedDocs.includes('income-declaration');
  const hasAddressDoc = selectedDocs.includes('sample-address-declaration');
  const hasUtilityDoc = selectedDocs.includes('undertaking-utility');
  const hasStatementDoc = selectedDocs.includes('sample-declaration') || selectedDocs.includes('sample-affidavit');

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Step Indicator */}
      <StepIndicator currentStep={2} language={language} />

      {/* Back button */}
      <div>
        <Link
          to={`/services/${service.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'gu' ? 'સેવા વિગત પર પાછા જાઓ' : 'Back to Service Details'}</span>
        </Link>
      </div>

      <Card className="shadow-xs border-border">
        <CardHeader className="border-b border-border pb-4 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge variant="secondary">{language === 'gu' ? service.departmentGu : service.department}</Badge>
            <Badge variant="warning">{language === 'gu' ? 'માત્ર ડેમો હેતુ માટે' : 'Demo Prototype'}</Badge>
          </div>
          <CardTitle className="text-xl sm:text-2xl text-primary font-bold">
            {language === 'gu' ? service.titleGu : service.title}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {language === 'gu'
              ? 'નીચે તમારી વિગતો એકવાર ભરો. પસંદ કરેલ તમામ દસ્તાવેજોમાં તે આપમેળે લાગુ થશે.'
              : 'Enter your citizen details once below. They will be faithfully mapped to all selected documents.'}
          </p>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* General Error Alert */}
            {generalError && (
              <Alert variant="destructive" title={language === 'gu' ? 'ભૂલ' : 'Error'}>
                {generalError}
              </Alert>
            )}

            {/* Document Selection Box */}
            <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>{language === 'gu' ? 'જનરેટ કરવા માટેના દસ્તાવેજો:' : 'Documents to Generate in this Bundle:'}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedDocs.length} {language === 'gu' ? 'પસંદ કરેલ' : 'selected'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {service.requiredTemplates.map((t: any) => {
                  const isChecked = selectedDocs.includes(t.templateSlug);
                  return (
                    <label
                      key={t.templateSlug}
                      className={`flex items-start gap-2.5 p-3 rounded-md border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-primary/50 bg-primary/5 text-foreground'
                          : 'border-border bg-card text-muted-foreground'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleDoc(t.templateSlug)}
                        className="mt-0.5 rounded border-input text-primary focus:ring-primary"
                      />
                      <div className="space-y-0.5">
                        <span className="font-semibold block text-foreground">
                          {language === 'gu' ? t.templateTitleGu : t.templateTitle}
                        </span>
                        {t.isMandatory ? (
                          <span className="text-[10px] text-primary font-medium">
                            {language === 'gu' ? 'ફરજિયાત' : 'Mandatory'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                            {language === 'gu' ? 'શરતી / વૈકલ્પિક' : 'Conditional'}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section 1: Common Personal Details */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-primary border-b border-border pb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>{language === 'gu' ? '૧. અરજદારની સામાન્ય વિગતો (તમામ દસ્તાવેજો માટે)' : '1. General Citizen Information (Shared across documents)'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label={language === 'gu' ? 'અરજદારનું પૂર્ણ નામ *' : 'Applicant Full Name *'}
                    value={answers.fullName || ''}
                    onChange={(e) => handleFieldChange('fullName', e.target.value)}
                    error={errors.fullName}
                    placeholder={language === 'gu' ? 'દા.ત. રમેશભાઈ કાંતિભાઈ પટેલ' : 'e.g. Rameshbhai Kantibhai Patel'}
                    required
                  />
                </div>

                <div>
                  <Input
                    label={language === 'gu' ? 'પિતા અથવા પતિનું નામ *' : 'Father / Husband Name *'}
                    value={answers.parentSpouseName || ''}
                    onChange={(e) => handleFieldChange('parentSpouseName', e.target.value)}
                    placeholder={language === 'gu' ? 'દા.ત. કાંતિભાઈ પટેલ' : 'e.g. Kantibhai Patel'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label={language === 'gu' ? 'ઉંમર (વર્ષ)' : 'Age (years)'}
                    type="number"
                    value={answers.age || ''}
                    onChange={(e) => handleFieldChange('age', e.target.value)}
                    min={18}
                    max={120}
                  />
                  <Input
                    label={language === 'gu' ? 'વ્યવસાય' : 'Occupation'}
                    value={answers.occupation || ''}
                    onChange={(e) => handleFieldChange('occupation', e.target.value)}
                    placeholder={language === 'gu' ? 'ખેતી / નોકરી' : 'Agriculture / Job'}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Textarea
                    label={language === 'gu' ? 'કાયમી રહેઠાણનું સરનામું *' : 'Permanent Residential Address *'}
                    value={answers.address || ''}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    error={errors.address}
                    rows={3}
                    placeholder={language === 'gu' ? 'મકાન નંબર, શેરી, સોસાયટી, ગામ/શહેર, તાલુકો, જિલ્લો' : 'House No., Street, Area, Taluka, District'}
                    required
                  />
                </div>

                <div>
                  <Input
                    label={language === 'gu' ? 'સ્થળ' : 'Place'}
                    value={answers.place || ''}
                    onChange={(e) => handleFieldChange('place', e.target.value)}
                    placeholder="Gandhinagar"
                  />
                </div>

                <div>
                  <Input
                    label={language === 'gu' ? 'તારીખ *' : 'Date *'}
                    type="date"
                    value={answers.declarationDate || ''}
                    onChange={(e) => handleFieldChange('declarationDate', e.target.value)}
                    error={errors.declarationDate}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Conditional Document-Specific Fields */}
            {(hasIncomeDoc || hasAddressDoc || hasUtilityDoc || hasStatementDoc) && (
              <div className="space-y-4 pt-2">
                <h3 className="text-base font-bold text-primary border-b border-border pb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>{language === 'gu' ? '૨. સેવા-વિશેષ વિગતો (જરૂરિયાત મુજબ)' : '2. Service-Specific Details'}</span>
                </h3>

                <div className="space-y-4">
                  {/* Income Fields */}
                  {hasIncomeDoc && (
                    <div className="p-4 rounded-md border border-border bg-card space-y-3">
                      <span className="font-bold text-xs text-primary block">
                        {language === 'gu' ? 'આવક ઘોષણા વિગત (કુટુંબની વાર્ષિક આવક માટે):' : 'Income Declaration Information:'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label={language === 'gu' ? 'કુલ વાર્ષિક આવક (રૂપિયામાં) *' : 'Total Annual Income (INR) *'}
                          type="number"
                          value={answers.annualIncome || ''}
                          onChange={(e) => handleFieldChange('annualIncome', e.target.value)}
                          error={errors.annualIncome}
                          placeholder="e.g. 150000"
                        />
                        <Input
                          label={language === 'gu' ? 'આવકનું મુખ્ય સાધન' : 'Primary Income Source'}
                          value={answers.incomeSource || ''}
                          onChange={(e) => handleFieldChange('incomeSource', e.target.value)}
                          placeholder={language === 'gu' ? 'ખેતી / મજૂરી / વ્યાપાર' : 'Agriculture / Labour / Business'}
                        />
                      </div>
                    </div>
                  )}

                  {/* Address Declaration Fields */}
                  {hasAddressDoc && (
                    <div className="p-4 rounded-md border border-border bg-card space-y-3">
                      <span className="font-bold text-xs text-primary block">
                        {language === 'gu' ? 'રહેઠાણ પુરાવા વિગત:' : 'Residential Verification Information:'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label={language === 'gu' ? 'કેટલા વર્ષોથી આ સરનામે રહો છો (વર્ષ)' : 'Residing Since (Years)'}
                          type="number"
                          value={answers.residingSinceYears || ''}
                          onChange={(e) => handleFieldChange('residingSinceYears', e.target.value)}
                          placeholder="e.g. 10"
                        />
                        <Select
                          label={language === 'gu' ? 'મકાનની માલિકીનો પ્રકાર' : 'Premises Ownership Type'}
                          value={answers.premisesType || 'owned'}
                          onChange={(e) => handleFieldChange('premisesType', e.target.value)}
                          options={[
                            { value: 'owned', label: language === 'gu' ? 'પોતાની માલિકીનું (Self-owned)' : 'Self-owned' },
                            { value: 'rented', label: language === 'gu' ? 'ભાડાનું મકાન (Rented)' : 'Rented' },
                            { value: 'parental', label: language === 'gu' ? 'વાલી/વારસાગત (Parental/Ancestral)' : 'Parental / Ancestral' },
                          ]}
                        />
                      </div>
                    </div>
                  )}

                  {/* Utility Undertaking Fields */}
                  {hasUtilityDoc && (
                    <div className="p-4 rounded-md border border-border bg-card space-y-3">
                      <span className="font-bold text-xs text-primary block">
                        {language === 'gu' ? 'બાંહેધરીપત્ર વિગત:' : 'Undertaking Specifics:'}
                      </span>
                      <Textarea
                        label={language === 'gu' ? 'બાંહેધરીનો હેતુ' : 'Purpose of Undertaking'}
                        value={answers.undertakingPurpose || ''}
                        onChange={(e) => handleFieldChange('undertakingPurpose', e.target.value)}
                        rows={2}
                        placeholder={language === 'gu' ? 'નવા નળ / વીજળી જોડાણ મેળવવા અંગેની બાંહેધરી' : 'Undertaking for utility connection'}
                      />
                    </div>
                  )}

                  {/* Declaration / Statement text */}
                  {hasStatementDoc && (
                    <div>
                      <Textarea
                        label={language === 'gu' ? 'નિવેદન / ઘોષણાનો હેતુ' : 'Statement of Facts / Purpose of Declaration'}
                        value={answers.declarationPurpose || ''}
                        onChange={(e) => handleFieldChange('declarationPurpose', e.target.value)}
                        rows={3}
                        placeholder={
                          language === 'gu'
                            ? service.purposeGu || 'જે બાબત અંગે સોગંદ કે એકરાર કરવાનો હોય તેની વિગત'
                            : service.purpose || 'State the purpose or declaration facts'
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Session Reuse Opt-In Checkbox */}
            <div className="p-4 rounded-lg border border-border bg-card space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={optInReuse}
                  onChange={(e) => setOptInReuse(e.target.checked)}
                  className="mt-0.5 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-foreground leading-relaxed">
                  {language === 'gu'
                    ? 'આ સેશન દરમિયાન મારી માહિતી યાદ રાખો (અન્ય દસ્તાવેજોમાં પુનઃ ટાઈપ ન કરવી પડે તે માટે).'
                    : 'Remember entered details for this browser session to reuse across other documents.'}
                </span>
              </label>
              <p className="text-[11px] text-muted-foreground pl-6">
                {language === 'gu'
                  ? 'તમારી માહિતી સુરક્ષિત છે અને ફક્ત આ બ્રાઉઝર સેશન માટે જ કામચલાઉ સંગ્રહાય છે.'
                  : 'Your details are strictly temporary, private, and removed when browser closes.'}
              </p>
            </div>

            {/* Form Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-destructive hover:bg-destructive/10 gap-1.5 w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4" />
                <span>{language === 'gu' ? 'માહિતી સાફ કરો' : 'Clear Form'}</span>
              </Button>

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="gap-2 font-bold w-full sm:w-auto px-8"
              >
                {submitting ? (
                  <span>{language === 'gu' ? 'દસ્તાવેજો તૈયાર થઈ રહ્યા છે...' : 'Generating Bundle...'}</span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>
                      {language === 'gu'
                        ? `${selectedDocs.length} દસ્તાવેજો જનરેટ કરી પ્રીવ્યૂ જુઓ`
                        : `Generate ${selectedDocs.length} Documents & Preview`}
                    </span>
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
