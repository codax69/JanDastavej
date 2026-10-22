import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Upload,
  FileText,
  CheckCircle,
  ArrowRight,
  Shield,
  Layers,
  HelpCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { Select } from '../../components/ui/Select.js';
import { Badge } from '../../components/ui/Badge.js';
import { Alert } from '../../components/ui/Alert.js';
import { AiScanResult } from '@jandastavej/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const SAMPLE_PRESETS = [
  {
    name: 'રેશન કાર્ડમાં નામ ઉમેરવા અંગેનું સોગંદનામું',
    nameEn: 'Ration Card Member Addition Affidavit',
    category: 'affidavit',
    text: `સોગંદનામું (રેશન કાર્ડમાં નામ ઉમેરવા બાબત)

હું નીચે સહી કરનાર શ્રી/શ્રીમતી ________________________
પિતા/પતિનું નામ: ________________________
ઉંમર વર્ષ: ______ ધંધો: _______________
રહેવાસી: __________________________________________________
આધાર કાર્ડ નંબર: ____________________
રેશન કાર્ડ નંબર: ____________________

આથી પ્રતિજ્ઞાપૂર્વક એકરાર કરી જણાવું છું કે:
૧. મારું ઉપરોક્ત સરનામે કુટુંબ સાથેનું કાયમી રહેઠાણ આવેલું છે.
૨. મારા રેશન કાર્ડમાં મારા કુટુંબના સભ્યનું નામ ઉમેરવાનું બાકી રહી ગયેલ છે.
૩. સદર સભ્યનું નામ અન્ય કોઈ પણ રેશન કાર્ડમાં નોંધાયેલ નથી.
૪. ઉપરોક્ત તમામ વિગતો મારી વ્યક્તિગત જાણ મુજબ સાચી અને ખરી છે. જો તેમાં કોઈ અસત્યતા જણાય તો હું કાયદેસરની ફોજદારી કાર્યવાહીને પાત્ર રહીશ.

તારીખ: ______________
સ્થળ: ગાંધીનગર

સોગંદ લેનારની સહી: ___________________`,
  },
  {
    name: 'વાર્ષિક કૌટુંબિક આવક અંગેનું સ્વયં ઘોષણાપત્ર',
    nameEn: 'Annual Family Income Self-Declaration',
    category: 'certificate_support',
    text: `વાર્ષિક કૌટુંબિક આવક અંગેનું એકરારનામું

હું નીચે સહી કરનાર શ્રી/શ્રીમતી ________________________
પિતા/પતિનું નામ: ________________________
ઉંમર વર્ષ: ______ વ્યવસાય: _______________
રહેવાસી: __________________________________________________
વાર્ષિક કૌટુંબિક આવક (રૂપિયામાં): ____________________

આથી સ્વયં ઘોષણાપત્ર રજૂ કરી જણાવું છું કે:
૧. મારી તથા મારા સંયુક્ત કુટુંબના તમામ સભ્યોની તમામ સાધનોમાંથી થતી કુલ વાર્ષિક આવક રૂપિયા ____________/- થાય છે.
૨. આ આવક પ્રમાણપત્ર મેળવવા અર્થે મામલતદારશ્રી/કલેક્ટર કચેરીમાં રજૂ કરવા સારું આ એકરારનામું કરેલ છે.
૩. આ નિવેદનમાં દર્શાવેલ વિગતો સંપૂર્ણ સત્ય છે.

તારીખ: ______________
સ્થળ: ગાંધીનગર

અરજદારની સહી: ___________________`,
  },
  {
    name: 'મહેસૂલી જમીન ઉપયોગ અંગેનું એકરારનામું',
    nameEn: 'Agricultural Land Usage Declaration',
    category: 'revenue_service',
    text: `મહેસૂલી જમીન વિગત અંગેનું એકરારનામું

હું નીચે સહી કરનાર શ્રી/શ્રીમતી ________________________
પિતા/પતિનું નામ: ________________________
ઉંમર: ______ ધંધો: ખેતી
સરનામું: __________________________________________________
સર્વે / બ્લોક નંબર: ____________________
મહેસૂલી ખાતા નંબર: ____________________

આથી જણાવું છું કે સદરહુ જમીન મારી સ્વતંત્ર માલિકી અને કબજા ભોગવટાની છે. તેમાં કોઈ પણ પ્રકારનો કાનૂની તકરાર નથી. આ વિગત સત્તાવાર વહીવટી ખરાઈ માટે રજૂ કરેલ છે.

તારીખ: ______________
સ્થળ: ગાંધીનગર

સહી: ___________________`,
  },
];

export function SubmitDocumentPage() {
  const { language } = useLanguage();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('declaration');
  const [documentText, setDocumentText] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<AiScanResult | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const handleApplyPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setTitle(language === 'gu' ? preset.name : preset.nameEn);
    setCategory(preset.category);
    setDocumentText(preset.text);
    setScanResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setDocumentText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmitAndScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanError(null);
    setIsScanning(true);

    try {
      setScanStep('1/3: Analyzing document text & Gujarati legal vernacular...');
      await new Promise((r) => setTimeout(r, 600));

      setScanStep('2/3: Identifying blanks, identity clauses & citizen input variables...');
      await new Promise((r) => setTimeout(r, 600));

      setScanStep('3/3: Generating structured schema & mapping layout engine...');

      const res = await fetch(`${API_BASE}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTitle: title.trim(),
          documentText: documentText.trim(),
          category,
          submitterName: submitterName.trim() || undefined,
          submitterEmail: submitterEmail.trim() || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || 'Failed to submit document.');
      }

      setScanResult(resData.data.aiScanResult);
      setSubmissionId(resData.data.submissionId);
    } catch (err: any) {
      setScanError(err.message);
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Page Title Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="default" className="gap-1 text-xs">
            <Sparkles className="h-3 w-3" />
            <span>Document Ingestion Portal</span>
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">Collector Office, Gandhinagar</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
          {language === 'gu'
            ? 'નવું દસ્તાવેજ ફોર્મેટ સબમિટ કરો'
            : 'Submit New Document Format for Verification'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          {language === 'gu'
            ? 'જો તમારી જરૂરિયાત મુજબનું સોગંદનામું કે એકરારનામું હાલ લાઇબ્રેરીમાં ઉપલબ્ધ ન હોય, તો અહીં ફોર્મેટ પેસ્ટ કરો. ઓટોમેટેડ સિસ્ટમ જરૂરી ઇનપુટ ફીલ્ડ્સ તૈયાર કરશે અને પ્રશાસનિક મંજૂરી બાદ તે સમગ્ર નાગરિકો માટે લાઇવ થશે.'
            : 'Submit an affidavit or declaration format not yet in the library. Automated verification extracts input variables, bilingual labels, and prepares it for administrative approval to publish publicly.'}
        </p>
      </div>

      {scanError && <Alert variant="destructive" title="Error">{scanError}</Alert>}

      {/* SUCCESS / SUBMISSION STATE */}
      {scanResult && submissionId ? (
        <Card
          className={`${
            scanResult.verificationStatus === 'EXTRACTION_FAILED'
              ? 'border-destructive/40 bg-destructive/5'
              : 'border-success/40 bg-success/5'
          } shadow-md space-y-6 p-6`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`${
                scanResult.verificationStatus === 'EXTRACTION_FAILED'
                  ? 'bg-destructive/20'
                  : 'bg-success/20'
              } p-3 rounded-full shrink-0`}
            >
              {scanResult.verificationStatus === 'EXTRACTION_FAILED' ? (
                <AlertCircle className="h-8 w-8 text-destructive" />
              ) : (
                <CheckCircle className="h-8 w-8 text-success" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">
                  {scanResult.verificationStatus === 'EXTRACTION_FAILED'
                    ? language === 'gu'
                      ? 'માળખું ઓળખવામાં નિષ્ફળતા! મેન્યુઅલ સમીક્ષા માટે મોકલેલ'
                      : 'Structure Extraction Failed (Sent for Manual Review)'
                    : language === 'gu'
                    ? 'ચકાસણી સફળ! સબમિશન પૂર્ણ થયું'
                    : 'Verification Complete & Submitted!'}
                </h2>
                <Badge
                  variant={scanResult.verificationStatus === 'EXTRACTION_FAILED' ? 'destructive' : 'success'}
                  className="text-xs"
                >
                  {scanResult.confidenceScore}%{' '}
                  {scanResult.verificationStatus === 'EXTRACTION_FAILED'
                    ? 'Extraction Failed'
                    : 'Compliance Score'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tracking ID:{' '}
                <span className="font-mono font-bold text-foreground">{submissionId}</span>
              </p>
            </div>
          </div>

          <div className="bg-background rounded-lg p-5 border border-border space-y-4">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span>{language === 'gu' ? 'ઓળખાયેલ દસ્તાવેજ માળખું' : 'Extracted Structure & Fields'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-muted-foreground">Title (EN):</span>{' '}
                <span className="font-bold text-foreground">{scanResult.detectedTitle}</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">Title (GU):</span>{' '}
                <span className="font-bold text-foreground font-gujarati">{scanResult.detectedTitleGu}</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">Category:</span>{' '}
                <Badge variant="outline" className="capitalize">{scanResult.detectedCategory}</Badge>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">Suggested Layout:</span>{' '}
                <span className="font-mono text-foreground">{scanResult.suggestedLayoutKey}</span>
              </div>
            </div>

            {/* Extracted Fields Table Preview */}
            <div className="mt-4 border border-border rounded-md overflow-hidden">
              <div className="bg-muted px-4 py-2 font-bold text-xs text-foreground flex justify-between">
                <span>Detected Form Fields ({scanResult.extractedFields.length})</span>
                <span className="text-muted-foreground font-normal">
                  {scanResult.verificationStatus === 'EXTRACTION_FAILED'
                    ? 'Requires Manual Schema Definition'
                    : 'Ready for Admin Review'}
                </span>
              </div>
              <div className="divide-y divide-border text-xs max-h-48 overflow-y-auto">
                {scanResult.extractedFields.map((f, idx) => (
                  <div key={f.key + idx} className="p-2.5 flex items-center justify-between hover:bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-primary font-semibold">{f.key}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="font-medium">{f.label}</span>
                      {f.labelGu && <span className="text-muted-foreground font-gujarati">({f.labelGu})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">{f.type}</Badge>
                      {f.required && <Badge variant="secondary" className="text-[10px]">Required</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-primary/5 rounded border border-primary/20 text-xs text-muted-foreground leading-relaxed">
              <Shield className="h-4 w-4 text-primary inline mr-1" />
              <strong>What happens next?</strong> Administrative officers at the Gandhinagar Collectorate will review the extracted legal format, verify the clauses, and approve it. Upon approval, it will be immediately published to the public JanDastavej template library for all citizens!
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setScanResult(null);
                setSubmissionId(null);
                setTitle('');
                setDocumentText('');
              }}
            >
              Submit Another Document
            </Button>

            <Link to="/documents">
              <Button size="sm" className="gap-1.5">
                <span>Browse Document Library</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* FORM SUBMISSION */
        <form onSubmit={handleSubmitAndScan} className="space-y-6">
          {/* Quick Presets for Demo / Testing */}
          <Card>
            <CardHeader className="py-3.5 border-b border-border bg-muted/30">
              <CardTitle className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>1-Click Sample Formats for Testing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {SAMPLE_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-3 text-left rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="font-semibold text-xs text-foreground group-hover:text-primary font-gujarati">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{p.nameEn}</div>
                    <Badge variant="outline" className="mt-2 text-[10px] capitalize">
                      {p.category.replace('_', ' ')}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form Inputs */}
          <Card>
            <CardHeader className="border-b border-border py-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>Document Format Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Document Title / Name"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ration Card Member Addition Affidavit"
                  helpText="In Gujarati or English"
                />

                <Select
                  label="Document Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={[
                    { value: 'declaration', label: 'Self Declaration / Undertaking' },
                    { value: 'affidavit', label: 'Sworn Affidavit (સોગંદનામું)' },
                    { value: 'certificate_support', label: 'Certificate Support (પ્રમાણપત્ર)' },
                    { value: 'revenue_service', label: 'Revenue & Land (મહેસૂલ / જમીન)' },
                    { value: 'general', label: 'General Legal Format' },
                  ]}
                />
              </div>

              {/* Upload or Paste */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-foreground">
                    Document Text or Upload File <span className="text-destructive">*</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Text/Doc file</span>
                    <input
                      type="file"
                      accept=".txt,.doc,.docx,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <Textarea
                  rows={10}
                  required
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  placeholder="Paste legal document draft here with blanks (e.g. હું નીચે સહી કરનાર ________ ઉંમર: ______ રહેવાસી: _________ ...)"
                  helpText="Automatically detects blanks, personal variables, dates, and signature lines."
                />
              </div>

              {/* Submitter Info (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <Input
                  label="Your Name (Optional)"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  placeholder="Citizen or Operator Name"
                />

                <Input
                  label="Contact Email (Optional)"
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  placeholder="For status updates"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isScanning || !title.trim() || !documentText.trim()}
                  className="gap-2 font-bold"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{scanStep || 'Verifying Document Structure...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Scan & Submit for Approval</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
