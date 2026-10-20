import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Printer, Edit, ShieldAlert, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { api, ApiClientError } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { StepIndicator } from '../../components/shared/StepIndicator.js';
import { Button } from '../../components/ui/Button.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Checkbox } from '../../components/ui/Checkbox.js';
import { Alert } from '../../components/ui/Alert.js';
import { Badge } from '../../components/ui/Badge.js';
import { getDocumentStyles } from '@jandastavej/shared';

export function PreviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['generation-session', sessionId],
    queryFn: () => api.getSession(sessionId!),
    enabled: !!sessionId,
    retry: false,
  });

  const session = data?.data;

  const handleEditReturn = () => {
    if (!session) return;
    navigate(`/create/${session.templateSlug}`, {
      state: {
        answers: session.answers,
      },
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!disclaimerAccepted || !sessionId) return;
    setDownloading(true);
    setDownloadError(null);

    try {
      const blob = await api.downloadPdfBlob(sessionId, disclaimerAccepted);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JanDastavej-${session?.templateSlug || 'document'}-${language}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setDownloadError(err.message || 'Failed to download PDF. Please try browser print instead.');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-[600px] bg-card border border-border rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-8 text-center bg-card border border-destructive/30 rounded-lg space-y-4 max-w-lg mx-auto">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-destructive">
          {language === 'gu' ? 'પૂર્વાવલોકન સત્ર સમાપ્ત થયું છે' : 'Session Expired or Not Found'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {language === 'gu'
            ? 'તમારી ડેટા સુરક્ષા માટે આ પ્રિવ્યૂ સત્ર સમાપ્ત થઈ ગયું છે. કૃપા કરીને દસ્તાવેજ ફરી બનાવો.'
            : 'For your privacy, document preview sessions expire automatically after 30 minutes.'}
        </p>
        <Link to="/documents">
          <Button variant="primary" size="sm">
            {language === 'gu' ? 'નવો દસ્તાવેજ શરૂ કરો' : 'Start New Document'}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Step Indicator: Step 3 (Preview) / Step 4 (Download) */}
      <div className="no-print">
        <StepIndicator currentStep={disclaimerAccepted ? 4 : 3} language={language} />
      </div>

      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Button variant="outline" size="sm" onClick={handleEditReturn} className="gap-1.5">
          <Edit className="h-4 w-4" />
          <span>{language === 'gu' ? 'વિગતોમાં સુધારો કરો (Edit)' : 'Edit Answers'}</span>
        </Button>

        <div className="flex items-center gap-2">
          <Badge variant="warning" className="text-xs">
            {language === 'gu' ? 'માત્ર ડેમો હેતુ માટે' : 'Demo Only — Not Official'}
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>30m Privacy Expiry</span>
          </span>
        </div>
      </div>

      {/* Mandatory Legal Disclaimer Banner Before Download */}
      <div className="no-print space-y-3">
        <Alert variant="warning" title={language === 'gu' ? 'કાનૂની સૂચના અને બાંહેધરી' : 'Legal Disclaimer & Acknowledgment'}>
          <div className="space-y-2">
            <p className="text-xs leading-relaxed">
              {language === 'gu'
                ? 'આ જનરેટ કરેલો દસ્તાવેજ એક ડ્રાફ્ટ (મુસદ્દો) છે. તે કલેક્ટર કચેરીમાં આપમેળે જમા થતો નથી કે નોટરાઇઝ થતો નથી. જરૂરિયાત મુજબ નિયત સ્ટેમ્પ ડ્યુટી, નોટરી સમક્ષ સોગંદ અથવા સહી કરાવવી અરજદારની વ્યક્તિગત જવાબદારી છે.'
                : 'This generated document is a prepared draft. It is not automatically filed, sworn, or notarized. Execution on required stamp paper, notary attestation, and signature remain the user’s responsibility.'}
            </p>
            <div className="pt-2">
              <Checkbox
                id="legalDisclaimerAck"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                label={
                  <span className="text-xs font-bold text-foreground">
                    {language === 'gu'
                      ? 'હું સ્વીકારું છું કે આ દસ્તાવેજ માત્ર મુસદ્દો છે અને સત્તાવાર માન્યતા માટે આગળની પ્રક્રિયા જરૂરી છે.'
                      : 'I acknowledge that this document is a prepared draft and requires further execution/attestation where prescribed.'}
                  </span>
                }
              />
            </div>
          </div>
        </Alert>

        {downloadError && (
          <Alert variant="destructive" title={language === 'gu' ? 'ડાઉનલોડ ક્ષતિ' : 'Download Error'}>
            {downloadError}
          </Alert>
        )}
      </div>

      {/* Action Buttons Bar */}
      <div className="bg-card p-4 rounded-lg border border-border flex flex-wrap items-center justify-between gap-4 no-print shadow-xs">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            <span>{language === 'gu' ? 'પ્રિન્ટ કરો' : 'Print Document'}</span>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {!disclaimerAccepted && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {language === 'gu' ? 'ડાઉનલોડ કરવા બાંહેધરી સ્વીકારો' : 'Accept disclaimer to download'}
            </span>
          )}
          <Button
            variant="primary"
            size="lg"
            disabled={!disclaimerAccepted || downloading}
            onClick={handleDownloadPdf}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span>
              {downloading
                ? language === 'gu' ? 'PDF બની રહ્યું છે...' : 'Preparing PDF...'
                : language === 'gu' ? 'PDF ડાઉનલોડ કરો' : 'Download PDF'}
            </span>
          </Button>
        </div>
      </div>

      {/* Preview Section Header */}
      <div className="flex items-center justify-between no-print px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {language === 'gu' ? 'દસ્તાવેજ પ્રિવ્યૂ (A4 કદ)' : 'Document Preview (A4 Canvas)'}
        </span>
        <span className="text-xs text-muted-foreground">
          {language === 'gu' ? 'પ્રિન્ટ લેઆઉટ સાથે ૧૦૦% મેળ ખાય છે' : 'Single Render Path'}
        </span>
      </div>

      {/* A4 Paper Document Canvas (Single Render Path) */}
      <div className="w-full overflow-x-auto pb-8 flex justify-center bg-muted/40 p-4 sm:p-8 rounded-xl border border-border">
        {/* Document CSS embedded for exact rendering */}
        <style dangerouslySetInnerHTML={{ __html: getDocumentStyles() }} />

        {/* The White A4 Paper Sheet */}
        <div
          className="bg-paper shadow-lg rounded-sm border border-border w-full max-w-[210mm] min-h-[297mm] transition-all"
          style={{ boxShadow: 'var(--paper-shadow)' }}
          dangerouslySetInnerHTML={{ __html: session.previewHtml }}
        />
      </div>
    </div>
  );
}
