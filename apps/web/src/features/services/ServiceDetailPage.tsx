import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  ShieldCheck,
  HelpCircle,
  Paperclip,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Alert } from '../../components/ui/Alert.js';
import { DetailPageSkeleton } from '../../components/ui/Skeleton.js';

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['service-detail', slug, language],
    queryFn: () => api.getServiceDetail(slug!, language),
    enabled: !!slug,
  });

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !data?.data) {
    return (
      <div className="p-8 text-center bg-card border border-destructive/30 rounded-lg space-y-4 max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-destructive">
          {language === 'gu' ? 'સેવા મળી નથી' : 'Service Not Found'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {language === 'gu'
            ? 'આ સરકારી સેવા ઉપલબ્ધ નથી અથવા નિષ્ક્રિય કરવામાં આવી છે.'
            : 'The requested citizen service could not be found or has been retired.'}
        </p>
        <Link to="/services">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>{language === 'gu' ? 'સેવાઓ પર પાછા જાઓ' : 'Back to Services'}</span>
          </Button>
        </Link>
      </div>
    );
  }

  const service = data.data;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back Link */}
      <div>
        <Link
          to="/services"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'gu' ? 'તમામ સેવાઓ ડિરેક્ટરી પર પાછા જાઓ' : 'Back to All Services'}</span>
        </Link>
      </div>

      {/* Main Service Card */}
      <Card className="shadow-xs border-border">
        <CardHeader className="border-b border-border space-y-4 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {language === 'gu' ? service.departmentGu : service.department}
            </Badge>
            <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 inline" />
              {language === 'gu' ? 'ચકાસાયેલ પ્રોટોટાઇપ ફોર્મેટ' : 'Verified Prototype Checklist'}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Effective: {service.effectiveDate}</span>
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              {language === 'gu' ? service.titleGu : service.title}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              {language === 'gu' ? service.descriptionGu : service.description}
            </p>
          </div>

          {/* Legal Authority & Jurisdiction Meta bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs bg-muted/40 p-3 rounded-md border border-border">
            <div>
              <span className="font-semibold text-foreground">
                {language === 'gu' ? 'કાર્યક્ષેત્ર / જિલ્લો: ' : 'Applicable Jurisdiction: '}
              </span>
              <span className="text-muted-foreground">{service.jurisdiction}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">
                {language === 'gu' ? 'સંદર્ભ / ઠરાવ: ' : 'Official Reference: '}
              </span>
              <span className="text-muted-foreground">{service.sourceReference}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-8">
          {/* Demo Prototype Notice */}
          <Alert variant="warning" title={language === 'gu' ? 'પ્રોટોટાઇપ સૂચના' : 'Prototype Notice'}>
            {language === 'gu'
              ? 'આ દસ્તાવેજ યાદી ગાંધીનગર કલેક્ટર કચેરી માટે પ્રસ્તાવિત પ્રોટોટાઇપ મુજબ તૈયાર કરવામાં આવી છે. જનરેટ કરેલા દસ્તાવેજો કાનૂની અધિકારી સમક્ષ રજૂ કરતા પહેલા સહી અથવા નોટરાઇઝેશન કરાવવું જરૂરી છે.'
              : 'This checklist is structured for the Gandhinagar administrative prototype. Generated documents are drafts for citizen self-attestation or execution before competent authorities.'}
          </Alert>

          {/* Section 1: Required Document Checklists */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>{language === 'gu' ? 'જરૂરી દસ્તાવેજોનું ચેકલિસ્ટ (ડિજિટલ નિર્માણ)' : 'Required Document Checklist (Generable Formats)'}</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  {language === 'gu'
                    ? 'આ તમામ દસ્તાવેજો એક જ વાર માહિતી ભરીને આ પ્લેટફોર્મ પર સીધા બનાવી શકાય છે:'
                    : 'These standardized legal formats can be generated simultaneously using your personal details:'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {service.requiredTemplates.map((reqTpl: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-border bg-card/60 hover:bg-card transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-foreground">
                        {language === 'gu' ? reqTpl.templateTitleGu : reqTpl.templateTitle}
                      </span>
                      {reqTpl.isMandatory ? (
                        <Badge variant="default" className="text-[10px] px-2 py-0.5">
                          {language === 'gu' ? 'ફરજિયાત' : 'Mandatory'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 border-amber-300">
                          {language === 'gu' ? 'શરતી / વૈકલ્પિક' : 'Conditional'}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {reqTpl.category}
                      </Badge>
                    </div>

                    {reqTpl.condition && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {language === 'gu' ? reqTpl.conditionGu || reqTpl.condition : reqTpl.condition}
                        </span>
                      </p>
                    )}

                    {(reqTpl.notes || reqTpl.notesGu) && (
                      <p className="text-xs text-muted-foreground">
                        {language === 'gu' ? reqTpl.notesGu || reqTpl.notes : reqTpl.notes}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Link to={`/create/${reqTpl.templateSlug}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        {language === 'gu' ? 'ફક્ત આ દસ્તાવેજ ભરો' : 'Fill Single Doc'}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Supporting Proofs to Attach */}
          {service.supportingDocuments && service.supportingDocuments.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-primary" />
                <span>{language === 'gu' ? 'સાથે જોડવાના સમર્થક પુરાવા (ભૌતિક નકલ)' : 'Supporting Proofs to Attach'}</span>
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {service.supportingDocuments.map((doc: any, i: number) => (
                  <li
                    key={i}
                    className="p-3 rounded-md border border-border bg-muted/20 flex items-start gap-2 text-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold">
                        {language === 'gu' ? doc.nameGu : doc.name}
                      </span>
                      {doc.isMandatory && (
                        <span className="text-[10px] text-destructive ml-1.5 font-bold">
                          ({language === 'gu' ? 'ફરજિયાત' : 'Required'})
                        </span>
                      )}
                      {(doc.description || doc.descriptionGu) && (
                        <p className="text-muted-foreground mt-0.5">
                          {language === 'gu' ? doc.descriptionGu || doc.description : doc.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 3: Next Steps & Submission Procedure */}
          {service.steps && service.steps.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>{language === 'gu' ? 'અરજી પ્રક્રિયા અને પગલાં' : 'Procedure & Submission Steps'}</span>
              </h2>
              <ol className="space-y-2 text-xs text-muted-foreground list-decimal pl-4">
                {(language === 'gu' ? service.stepsGu : service.steps).map((step: string, i: number) => (
                  <li key={i} className="pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Primary CTA Box */}
          <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 space-y-4 text-center">
            <div className="max-w-xl mx-auto space-y-1">
              <h3 className="text-lg font-bold text-primary">
                {language === 'gu'
                  ? 'આ સેવા માટેના તમામ દસ્તાવેજો એકસાથે તૈયાર કરો'
                  : 'Prepare All Documents for this Service in One Go'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {language === 'gu'
                  ? 'તમારી વ્યક્તિગત વિગતો ફક્ત એક જ વાર ભરો. સિસ્ટમ સ્વ-ઘોષણાપત્ર અને સોગંદનામું આપમેળે બનાવી આપશે.'
                  : 'Enter your personal information once. The system will pre-fill and format all required affidavits and declarations together.'}
              </p>
            </div>

            <Button
              size="lg"
              className="gap-2 px-8 font-bold"
              onClick={() => navigate(`/services/${service.slug}/apply`)}
            >
              <Sparkles className="h-5 w-5" />
              <span>
                {language === 'gu'
                  ? 'દસ્તાવેજ નિર્માણ શરૂ કરો'
                  : 'Start Unified Document Generation'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
