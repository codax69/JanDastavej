import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle, FileText, Info, AlertTriangle, ShieldCheck, Clock, Flag, Send } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { StepIndicator } from '../../components/shared/StepIndicator.js';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Alert } from '../../components/ui/Alert.js';
import { Input } from '../../components/ui/Input.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { Select } from '../../components/ui/Select.js';
import { DetailPageSkeleton } from '../../components/ui/Skeleton.js';

export function DocumentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [showReportForm, setShowReportForm] = useState(false);
  const [issueType, setIssueType] = useState<'outdated_format' | 'incorrect_wording' | 'legal_change' | 'broken_placeholder' | 'other'>('outdated_format');
  const [reportDescription, setReportDescription] = useState('');
  const [sourceProofUrl, setSourceProofUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !reportDescription.trim()) return;

    setIsSubmittingReport(true);
    setReportError(null);

    try {
      await api.reportTemplate(slug, {
        issueType,
        description: reportDescription.trim(),
        sourceProofUrl: sourceProofUrl.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      });
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportForm(false);
        setReportSuccess(false);
        setReportDescription('');
        setSourceProofUrl('');
        setContactEmail('');
      }, 3000);
    } catch (err: any) {
      setReportError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['template-detail', slug, language],
    queryFn: () => api.getTemplateDetail(slug!, language),
    enabled: !!slug,
  });

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !data?.data) {
    return (
      <div className="p-8 text-center bg-card border border-destructive/30 rounded-lg space-y-4">
        <h2 className="text-xl font-bold text-destructive">
          {language === 'gu' ? 'દસ્તાવેજ મળ્યો નથી' : 'Document Template Not Found'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {language === 'gu'
            ? 'આ દસ્તાવેજ ઉપલબ્ધ નથી અથવા નિષ્ક્રિય કરવામાં આવ્યો છે.'
            : 'The requested document format could not be found or has been retired.'}
        </p>
        <Link to="/documents">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>{language === 'gu' ? 'લાઇબ્રેરી પર પાછા જાઓ' : 'Back to Library'}</span>
          </Button>
        </Link>
      </div>
    );
  }

  const { template, version } = data.data;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Step Indicator: Step 1 */}
      <StepIndicator currentStep={1} language={language} />

      {/* Back button */}
      <div>
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'gu' ? 'દસ્તાવેજ લાઇબ્રેરી પર પાછા જાઓ' : 'Back to Templates'}</span>
        </Link>
      </div>

      {/* Main Detail Card */}
      <Card>
        <CardHeader className="border-b border-border space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {template.category.replace('_', ' ')}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Version {version.version} (Published)</span>
            </span>
          </div>

          <CardTitle className="text-2xl sm:text-3xl text-primary">
            {language === 'gu' ? template.titleGu : template.title}
          </CardTitle>

          <p className="text-base text-muted-foreground">
            {language === 'gu' ? template.descriptionGu : template.description}
          </p>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Demo Disclaimer Box */}
          <Alert variant="warning" title={language === 'gu' ? 'મહત્વપૂર્ણ કાનૂની સૂચના' : 'Important Legal Notice'}>
            {language === 'gu'
              ? 'આ દસ્તાવેજ જનરેટર માત્ર મુસદ્દો તૈયાર કરવા માટેનું સાધન છે. જનરેટ કરેલ દસ્તાવેજ આપમેળે માન્ય કે પ્રમાણિત થતો નથી. જરૂરિયાત મુજબ યોગ્ય સ્ટેમ્પ પેપર પર પ્રિન્ટ કરી, સહી અથવા નોટરી સમક્ષ પ્રમાણિત કરાવવો જરૂરી રહેશે.'
              : 'This system is a document preparation tool. Generating this document does not constitute notarization, attestation, stamp duty payment, or official government submission.'}
          </Alert>

          {/* Purpose & Scope */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <span>{language === 'gu' ? 'દસ્તાવેજનો હેતુ અને ઉપયોગ' : 'Purpose & Application'}</span>
            </h4>
            <p className="text-sm text-muted-foreground pl-6 leading-relaxed">
              {(language === 'gu' ? template.purposeGu : template.purpose) ||
                (language === 'gu'
                  ? 'સામાન્ય વહીવટી પ્રક્રિયાઓ અને અરજીઓ માટે અરજદારની વિગતો દર્શાવવા માટે.'
                  : 'Used for declaring statements and verifying details in administrative procedures.')}
            </p>
          </div>

          {/* Required Documents / Information to have handy */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>{language === 'gu' ? 'સાથે રાખવાની વિગતો અને પુરાવા' : 'Required Information & Documents'}</span>
            </h4>
            <ul className="pl-6 space-y-1.5 text-sm text-muted-foreground">
              {(language === 'gu' ? template.requiredDocumentsGu : template.requiredDocuments).map((doc, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next Steps */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>{language === 'gu' ? 'દસ્તાવેજ તૈયાર થયા પછીનાં પગલાં' : 'Next Steps After Generation'}</span>
            </h4>
            <p className="text-sm text-muted-foreground pl-6 leading-relaxed">
              {(language === 'gu' ? template.nextStepsGu : template.nextSteps) ||
                (language === 'gu'
                  ? 'દસ્તાવેજ પ્રિન્ટ કરી નીચે સહી કરો અને સંબંધિત કચેરીમાં અરજી સાથે જોડો.'
                  : 'Print the prepared document, sign in the designated space, and submit with your application.')}
            </p>
          </div>

          {/* Governance Metadata */}
          <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
            <div>
              <span className="font-semibold text-foreground">
                {language === 'gu' ? 'સ્રોત સંદર્ભ:' : 'Source:'}{' '}
              </span>
              <span>{version.sourceReference}</span>
            </div>
            <div>
              <span>{version.fields.length} {language === 'gu' ? 'વિગતો ભરવાની રહેશે' : 'fields required'}</span>
            </div>
          </div>

          {/* Primary Start CTA & Report Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowReportForm(!showReportForm)}
              className="gap-2 text-muted-foreground hover:text-destructive"
            >
              <Flag className="h-4 w-4" />
              <span>{language === 'gu' ? 'સમસ્યા અથવા જૂનો ફોર્મેટ રિપોર્ટ કરો' : 'Report an Issue / Outdated Format'}</span>
            </Button>

            <Button
              size="lg"
              onClick={() => navigate(`/create/${template.slug}`)}
              className="w-full sm:w-auto gap-2"
            >
              <span>{language === 'gu' ? 'દસ્તાવેજ બનાવવાનું શરૂ કરો' : 'Start Document Preparation'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Collapsible Issue Reporting Form */}
          {showReportForm && (
            <div className="mt-4 p-4 rounded-lg border border-border bg-muted/40 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span>{language === 'gu' ? 'ટેમ્પ્લેટ અંગે સમસ્યા નોંધાવો' : 'Report an Issue with this Template'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              {reportSuccess ? (
                <Alert variant="success">
                  {language === 'gu'
                    ? 'તમારી સમસ્યા સફળતાપૂર્વક નોંધાઈ છે. એડમિન સમીક્ષા કરશે.'
                    : 'Issue report submitted successfully. Reviewers have been notified.'}
                </Alert>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-3">
                  {reportError && (
                    <Alert variant="destructive">
                      {reportError}
                    </Alert>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">
                        {language === 'gu' ? 'સમસ્યાનો પ્રકાર' : 'Issue Category'}
                      </label>
                      <Select
                        value={issueType}
                        onChange={(e) => setIssueType(e.target.value as any)}
                        options={[
                          { value: 'outdated_format', label: language === 'gu' ? 'જૂનું ફોર્મેટ / નિયમ બદલાયો છે' : 'Outdated Format / Rule Changed' },
                          { value: 'incorrect_wording', label: language === 'gu' ? 'ખોટી કાનૂની ભાષા' : 'Incorrect Legal Wording' },
                          { value: 'legal_change', label: language === 'gu' ? 'કાનૂની ફેરફાર / સુધારો' : 'Legal Change / Amendment' },
                          { value: 'broken_placeholder', label: language === 'gu' ? 'પ્લેસહોલ્ડર ખામી' : 'Broken Placeholder' },
                          { value: 'other', label: language === 'gu' ? 'અન્ય બાબત' : 'Other' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">
                        {language === 'gu' ? 'ઈમેલ (વૈકલ્પિક)' : 'Contact Email (Optional)'}
                      </label>
                      <Input
                        type="email"
                        placeholder="citizen@example.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      {language === 'gu' ? 'નવા પરિપત્ર / સત્તાવાર સ્રોતની લિંક (જો હોય તો)' : 'New Circular / Source URL (Optional)'}
                    </label>
                    <Input
                      type="url"
                      placeholder="https://revenue.gujarat.gov.in/circulars/..."
                      value={sourceProofUrl}
                      onChange={(e) => setSourceProofUrl(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      {language === 'gu' ? 'વિગતવાર વર્ણન *' : 'Description of Issue *'}
                    </label>
                    <Textarea
                      required
                      rows={3}
                      placeholder={
                        language === 'gu'
                          ? 'કયા ફકરા કે શબ્દો બદલાયા છે અથવા શું ખામી છે તે જણાવો...'
                          : 'Describe what needs correction or cite the recent government order...'
                      }
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReportForm(false)}
                    >
                      {language === 'gu' ? 'રદ કરો' : 'Cancel'}
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmittingReport || !reportDescription.trim()}
                      className="gap-2"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{isSubmittingReport ? (language === 'gu' ? 'મોકલી રહ્યું છે...' : 'Submitting...') : (language === 'gu' ? 'રિપોર્ટ મોકલો' : 'Submit Report')}</span>
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

