import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle, FileText, Info, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { StepIndicator } from '../../components/shared/StepIndicator.js';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Alert } from '../../components/ui/Alert.js';

export function DocumentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['template-detail', slug, language],
    queryFn: () => api.getTemplateDetail(slug!, language),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-card border border-border rounded-lg animate-pulse" />
      </div>
    );
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
            <Badge variant="warning">
              {language === 'gu' ? 'માત્ર ડેમો હેતુ માટે' : 'Demo Only — Not Official'}
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

          {/* Primary Start CTA Button */}
          <div className="pt-4 flex justify-end">
            <Button
              size="lg"
              onClick={() => navigate(`/create/${template.slug}`)}
              className="w-full sm:w-auto gap-2"
            >
              <span>{language === 'gu' ? 'દસ્તાવેજ બનાવવાનું શરૂ કરો' : 'Start Document Preparation'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
