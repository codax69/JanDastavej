import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Printer,
  FileCheck,
  Layers,
  Building2,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card.js';
import { CardGridSkeleton } from '../../components/ui/Skeleton.js';
import { Badge } from '../../components/ui/Badge.js';
import { Alert } from '../../components/ui/Alert.js';

export function LandingPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates', language],
    queryFn: () => api.getTemplates({ language }),
  });

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['services', language],
    queryFn: () => api.getServices({ language }),
  });

  const templates = templatesData?.data || [];
  const services = servicesData?.data || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/services');
    }
  };

  return (
    <div className="space-y-12">
      {/* Demo Warning Banner */}
      <Alert variant="warning" title={language === 'gu' ? 'ડેમો પ્રોટોટાઇપ સૂચના' : 'Demo Prototype Notice'}>
        {language === 'gu'
          ? 'આ એપ્લિકેશન કલેક્ટર કચેરી, ગાંધીનગર માટે પ્રસ્તાવિત ડિજિટલ પ્રોટોટાઇપ છે. અહીં આપેલા તમામ ફોર્મેટ ડેમો હેતુ માટે છે અને સત્તાવાર માન્યતા પછી જ સત્તાવાર ગણાશે.'
          : 'This is an engineering prototype for Collector Office, Gandhinagar. All generated documents are labelled for demo use and require official validation before formal submission.'}
      </Alert>

      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto pt-4">
        <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider font-bold">
          {language === 'gu' ? 'કલેક્ટર કચેરી, ગાંધીનગર' : 'Collector Office, Gandhinagar'}
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black text-primary tracking-tight leading-tight">
          {language === 'gu'
            ? 'ડિજિટલ એફિડેવિટ અને નાગરિક સેવા દસ્તાવેજ નિર્માતા'
            : 'Digital Affidavit & Citizen Document Generator'}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          {language === 'gu'
            ? 'સરકારી સેવાઓ માટે જરૂરી સોગંદનામા, સ્વ-ઘોષણાપત્રો અને બાંહેધરીપત્રો સચોટ અને પુનરાવર્તિત માહિતી ભર્યા વિના જાતે તૈયાર કરો.'
            : 'Prepare standardized affidavits, declarations, and undertakings with unified data entry, faithful preview, and clean PDF/Word output.'}
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex items-center gap-2 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'gu'
                  ? 'સેવા અથવા દસ્તાવેજ શોધો (દા.ત. આવકનો દાખલો, સોગંદનામું...)'
                  : 'Search service or document (e.g. Income, Domicile, Affidavit...)'
              }
              className="w-full h-12 pl-11 pr-4 rounded-md border border-input bg-card text-foreground shadow-xs text-base focus-visible:outline-2 focus-visible:outline-ring"
            />
          </div>
          <Button type="submit" size="lg" className="gap-2 shrink-0">
            <span>{language === 'gu' ? 'શોધો' : 'Search'}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {/* Quick Nav Shortcut Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/services">
            <Button variant="secondary" size="sm" className="gap-1.5 font-semibold">
              <Layers className="h-4 w-4 text-primary" />
              <span>{language === 'gu' ? 'સરકારી સેવાઓ ડિરેક્ટરી' : 'Browse Citizen Services'}</span>
            </Button>
          </Link>
          <Link to="/documents">
            <Button variant="outline" size="sm" className="gap-1.5 font-semibold">
              <FileText className="h-4 w-4" />
              <span>{language === 'gu' ? 'દસ્તાવેજ લાઇબ્રેરી' : 'Document Templates'}</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* High-Impact Citizen Services Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs text-primary font-bold">
                {language === 'gu' ? 'વારંવાર વપરાતી સેવાઓ' : 'High-Demand Services'}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-primary mt-1">
              {language === 'gu' ? 'નાગરિક સેવાઓ અને દસ્તાવેજ ચેકલિસ્ટ' : 'Popular Citizen Services'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {language === 'gu'
                ? 'જરૂરી સેવા પસંદ કરો અને એક જ ફોર્મ ભરી તમામ જરૂરી દસ્તાવેજો એકસાથે તૈયાર કરો'
                : 'Select a service to view mandatory checklists and generate all required documents simultaneously'}
            </p>
          </div>
          <Link to="/services">
            <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
              <span>{language === 'gu' ? 'તમામ સેવાઓ જુઓ' : 'View All Services'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {servicesLoading ? (
          <CardGridSkeleton count={3} columns={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.slice(0, 3).map((srv) => (
              <Card key={srv._id} className="flex flex-col justify-between hover:border-primary/50 transition-colors shadow-xs">
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[11px]">
                      {language === 'gu' ? srv.departmentGu : srv.department}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] font-semibold text-emerald-700">
                      {srv.requiredDocumentCount} {language === 'gu' ? 'દસ્તાવેજો' : 'docs'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {language === 'gu' ? srv.titleGu : srv.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                    {language === 'gu' ? srv.descriptionGu : srv.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-2 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{srv.jurisdiction}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t border-border mt-auto">
                  <Link to={`/services/${srv.slug}`} className="w-full">
                    <Button variant="primary" size="sm" className="w-full gap-2">
                      <span>{language === 'gu' ? 'ચેકલિસ્ટ અને દસ્તાવેજો' : 'View Checklist & Apply'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* How It Works (4 Steps) */}
      <section className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-primary">
            {language === 'gu' ? 'કેવી રીતે કાર્ય કરે છે?' : 'How It Works'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {language === 'gu'
              ? 'ચાર સરળ તબક્કામાં તમારા તમામ દસ્તાવેજો પ્રિન્ટ કરવા માટે તૈયાર કરો'
              : 'Prepare and print your verified documents in 4 simple steps'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {[
            {
              step: '૧',
              stepEn: '1',
              title: language === 'gu' ? 'સેવા / ફોર્મેટ પસંદ કરો' : 'Select Service or Format',
              desc:
                language === 'gu'
                  ? 'સરકારી સેવા અથવા વ્યક્તિગત દસ્તાવેજ ફોર્મેટ પસંદ કરો.'
                  : 'Browse citizen services or standardized legal templates.',
              icon: <Layers className="h-6 w-6 text-primary" />,
            },
            {
              step: '૨',
              stepEn: '2',
              title: language === 'gu' ? 'વિગતો એકવાર ભરો' : 'Enter Details Once',
              desc:
                language === 'gu'
                  ? 'તમારી સામાન્ય વિગતો માત્ર એક જ વાર ભરો. તમામ દસ્તાવેજોમાં તે આપમેળે લાગુ થશે.'
                  : 'Fill personal details once; reusable across all required formats.',
              icon: <FileCheck className="h-6 w-6 text-primary" />,
            },
            {
              step: '૩',
              stepEn: '3',
              title: language === 'gu' ? 'પૂર્વાવલોકન કરો' : 'Review Previews',
              desc:
                language === 'gu'
                  ? 'તૈયાર થનાર A4 દસ્તાવેજોનું સચોટ પ્રીવ્યૂ ચકાસો અને કોઈપણ ભૂલ સુધારો.'
                  : 'Faithful A4 preview matching the exact final print layout.',
              icon: <ShieldCheck className="h-6 w-6 text-primary" />,
            },
            {
              step: '૪',
              stepEn: '4',
              title: language === 'gu' ? 'PDF / Word ડાઉનલોડ' : 'Download PDF / Word',
              desc:
                language === 'gu'
                  ? 'પ્રિન્ટ-રેડી PDF અથવા એડિટેબલ Word ફાઈલ ડાઉનલોડ કરો.'
                  : 'Export print-ready PDF or editable DOCX formats instantly.',
              icon: <Printer className="h-6 w-6 text-primary" />,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-background border border-border space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-md bg-primary/10 text-primary">{item.icon}</div>
                <span className="text-xl font-black text-primary/40 font-mono">
                  {language === 'gu' ? item.step : item.stepEn}
                </span>
              </div>
              <h3 className="font-bold text-foreground text-base">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Templates */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">
              {language === 'gu' ? 'સ્વતંત્ર દસ્તાવેજ ફોર્મેટ્સ' : 'Direct Document Templates'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {language === 'gu'
                ? 'જો તમને માત્ર એક ચોક્કસ સોગંદનામું કે ઘોષણાપત્ર જોઈતું હોય તો સીધું અહીંથી બનાવો'
                : 'Directly generate specific individual legal formats'}
            </p>
          </div>
          <Link to="/documents">
            <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
              <span>{language === 'gu' ? 'બધા જુઓ' : 'View All'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {templatesLoading ? (
          <CardGridSkeleton count={3} columns={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.slice(0, 3).map((tpl) => (
              <Card key={tpl._id} className="flex flex-col justify-between hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="capitalize text-[11px]">
                      {tpl.category.replace('_', ' ')}
                    </Badge>
                    <Badge variant="warning" className="text-[10px]">
                      {language === 'gu' ? 'માત્ર ડેમો' : 'Demo Only'}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2">
                    {language === 'gu' ? tpl.titleGu : tpl.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {language === 'gu' ? tpl.descriptionGu : tpl.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {language === 'gu' ? 'ગુજરાતી અને અંગ્રેજી બંને ઉપલબ્ધ' : 'Gujarati & English available'}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Link to={`/documents/${tpl.slug}`} className="w-full">
                    <Button variant="primary" size="md" className="w-full gap-2">
                      <span>{language === 'gu' ? 'વિગતો જુઓ' : 'View Details'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
