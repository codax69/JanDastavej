import React, { useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Printer,
  Edit,
  FileText,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { StepIndicator } from '../../components/shared/StepIndicator.js';
import { Button } from '../../components/ui/Button.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Alert } from '../../components/ui/Alert.js';
import { getDocumentStyles } from '@jandastavej/shared';

export function ServiceBundlePreviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const bundleData = (location.state as any)?.bundleData;
  const service = (location.state as any)?.service;
  const initialAnswers = (location.state as any)?.answers || {};

  const sessions = bundleData?.sessions || [];
  const [activeTab, setActiveTab] = useState<number>(0);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingBundlePdf, setDownloadingBundlePdf] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!bundleData || sessions.length === 0) {
    return (
      <div className="p-8 text-center bg-card border border-border rounded-lg space-y-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-foreground">
          {language === 'gu' ? 'કોઈ સક્રિય દસ્તાવેજ સત્ર મળ્યું નથી' : 'No Active Session Found'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {language === 'gu'
            ? 'કૃપા કરીને સેવા ફોર્મ પરથી દસ્તાવેજ જનરેટ કરો.'
            : 'Please start from the service application form.'}
        </p>
        <Link to={`/services/${slug || ''}`}>
          <Button variant="primary" size="sm">
            {language === 'gu' ? 'સેવા પર પાછા જાઓ' : 'Back to Service'}
          </Button>
        </Link>
      </div>
    );
  }

  const activeSession = sessions[activeTab] || sessions[0];

  const handleEditReturn = () => {
    navigate(`/services/${slug}/apply`, {
      state: {
        answers: initialAnswers,
      },
    });
  };

  const handleDownloadSinglePdf = async () => {
    if (!disclaimerAccepted || !activeSession) return;
    setDownloadingPdf(true);
    setDownloadError(null);
    try {
      const blob = await api.downloadPdfBlob(activeSession.sessionId, disclaimerAccepted);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JanDastavej-${activeSession.templateSlug}-${language}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setDownloadError(err.message || 'Failed to download PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadSingleDocx = async () => {
    if (!disclaimerAccepted || !activeSession) return;
    setDownloadingDocx(true);
    setDownloadError(null);
    try {
      const blob = await api.downloadDocxBlob(activeSession.sessionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JanDastavej-${activeSession.templateSlug}-${language}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setDownloadError(err.message || 'Failed to download DOCX.');
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleDownloadAllBundlePdf = async () => {
    if (!disclaimerAccepted) return;
    setDownloadingBundlePdf(true);
    setDownloadError(null);
    try {
      const sessionIds = sessions.map((s: any) => s.sessionId);
      const blob = await api.downloadServiceBundlePdfBlob(
        sessionIds,
        `JanDastavej-${slug}-Combined-Bundle`
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JanDastavej-${slug}-All-Documents-${language}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setDownloadError(err.message || 'Failed to download bundle PDF.');
    } finally {
      setDownloadingBundlePdf(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Step Indicator */}
      <StepIndicator currentStep={3} language={language} />

      {/* Header controls bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-lg border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{bundleData.serviceTitle}</Badge>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {language === 'gu'
              ? `${sessions.length} દસ્તાવેજો સફળતાપૂર્વક તૈયાર થયા છે`
              : `${sessions.length} Documents Generated in this Bundle`}
          </h1>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditReturn}
            className="gap-1.5"
          >
            <Edit className="h-4 w-4" />
            <span>{language === 'gu' ? 'વિગતો સુધારો' : 'Edit Answers'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5"
          >
            <Printer className="h-4 w-4" />
            <span>{language === 'gu' ? 'પ્રિન્ટ' : 'Print'}</span>
          </Button>
        </div>
      </div>

      {/* Document Selection Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {sessions.map((s: any, idx: number) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-semibold transition-all ${
              activeTab === idx
                ? 'bg-card border-t border-x border-border text-primary shadow-xs -mb-[9px] pb-3'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <FileText className="h-4 w-4 text-primary" />
            <span>{s.templateTitle}</span>
          </button>
        ))}
      </div>

      {/* Legal Disclaimer & Download Action Box */}
      <Card className="border-border shadow-xs bg-card">
        <CardContent className="pt-5 space-y-4">
          <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">
                {language === 'gu' ? 'કાનૂની એકરાર અને ડાઉનલોડ શરત:' : 'Legal Acknowledgment & Download Terms:'}
              </span>
              <p>
                {language === 'gu'
                  ? 'હું ખાતરી આપું છું કે આ દસ્તાવેજો મારી સ્વ-ઘોષિત વિગતો પરથી તૈયાર કરેલ મુસદ્દો છે અને નિયત કચેરીમાં રજૂ કરતા પહેલા સહી અથવા સત્તાવાર સ્ટેમ્પ લગાવીશ.'
                  : 'I acknowledge that these documents are drafts generated from my self-declared inputs. I will review, sign, and affix requisite stamp duty or notary attestation before formal submission.'}
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={disclaimerAccepted}
              onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
            />
            <span>
              {language === 'gu'
                ? 'મેં ઉપરોક્ત શરતો વાંચી છે અને હું આ એકરાર સ્વીકારું છું.'
                : 'I have read and agree to the above terms and legal acknowledgment.'}
            </span>
          </label>

          {downloadError && (
            <Alert variant="destructive" title={language === 'gu' ? 'ભૂલ' : 'Error'}>
              {downloadError}
            </Alert>
          )}

          {/* Action Download Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Download Active Single PDF */}
            <Button
              variant="primary"
              size="sm"
              disabled={!disclaimerAccepted || downloadingPdf}
              onClick={handleDownloadSinglePdf}
              className="gap-1.5 font-bold"
            >
              <Download className="h-4 w-4" />
              <span>
                {downloadingPdf
                  ? language === 'gu' ? 'PDF ડાઉનલોડ થઈ રહી છે...' : 'Downloading PDF...'
                  : language === 'gu' ? 'આ દસ્તાવેજ (PDF)' : 'Download This Doc (PDF)'}
              </span>
            </Button>

            {/* Download Active Single DOCX */}
            <Button
              variant="outline"
              size="sm"
              disabled={!disclaimerAccepted || downloadingDocx}
              onClick={handleDownloadSingleDocx}
              className="gap-1.5 font-bold border-primary/40 text-primary hover:bg-primary/5"
            >
              <FileCode className="h-4 w-4 text-primary" />
              <span>
                {downloadingDocx
                  ? language === 'gu' ? 'Word ફાઈલ તૈયાર થાય છે...' : 'Downloading Word...'
                  : language === 'gu' ? 'આ દસ્તાવેજ (Word .docx)' : 'Download This Doc (Word .docx)'}
              </span>
            </Button>

            {/* Download ALL BUNDLE PDF in ONE GO */}
            <Button
              variant="secondary"
              size="sm"
              disabled={!disclaimerAccepted || downloadingBundlePdf}
              onClick={handleDownloadAllBundlePdf}
              className="gap-1.5 font-bold ml-auto bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Layers className="h-4 w-4" />
              <span>
                {downloadingBundlePdf
                  ? language === 'gu' ? 'બંડલ તૈયાર થાય છે...' : 'Preparing All Docs...'
                  : language === 'gu'
                  ? `તમામ ${sessions.length} દસ્તાવેજો કમ્બાઈન્ડ PDF ડાઉનલોડ`
                  : `Download All ${sessions.length} Docs in One PDF`}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clean A4 Paper Sheet Preview Canvas */}
      <div className="bg-muted/40 p-4 sm:p-8 rounded-xl border border-border flex justify-center overflow-x-auto">
        <style dangerouslySetInnerHTML={{ __html: getDocumentStyles() }} />
        <div
          className="shadow-md rounded-xs bg-white text-black max-w-[210mm] w-full"
          dangerouslySetInnerHTML={{ __html: activeSession.previewHtml }}
        />
      </div>
    </div>
  );
}
