import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, FileText, CheckCircle2, ArrowRight, ShieldCheck, Printer, FileCheck } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Alert } from '../../components/ui/Alert.js';

export function LandingPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['templates', language],
    queryFn: () => api.getTemplates({ language }),
  });

  const templates = data?.data || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/documents?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/documents');
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
            ? 'ડિજિટલ એફિડેવિટ અને સ્વ-ઘોષણાપત્ર નિર્માતા'
            : 'Digital Affidavit & Declaration Generator'}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          {language === 'gu'
            ? 'સરકારી કામકાજ માટે જરૂરી સોગંદનામા અને ઘોષણાપત્રો ઝડપથી, સચોટ અને પુનરાવર્તિત માહિતી ભર્યા વિના જાતે તૈયાર કરો.'
            : 'Prepare standardized affidavits and declarations with minimal data entry, instant faithful preview, and clean PDF output.'}
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
                  ? 'દસ્તાવેજનો પ્રકાર શોધો (દા.ત. સોગંદનામું, ઘોષણાપત્ર...)'
                  : 'Search document formats (e.g. Affidavit, Declaration...)'
              }
              className="w-full h-12 pl-11 pr-4 rounded-md border border-input bg-card text-foreground shadow-xs text-base focus-visible:outline-2 focus-visible:outline-ring"
            />
          </div>
          <Button type="submit" size="lg" className="gap-2 shrink-0">
            <span>{language === 'gu' ? 'શોધો' : 'Search'}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </section>

      {/* How It Works (4 Steps) */}
      <section className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-primary">
            {language === 'gu' ? 'કેવી રીતે કાર્ય કરે છે?' : 'How It Works'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {language === 'gu'
              ? 'ચાર સરળ તબક્કામાં તમારો દસ્તાવેજ પ્રિન્ટ કરવા માટે તૈયાર કરો'
              : 'Prepare and print your verified document in 4 simple steps'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {[
            {
              step: '૧',
              stepEn: '1',
              title: language === 'gu' ? 'દસ્તાવેજ પસંદ કરો' : 'Select Format',
              desc: language === 'gu' ? 'તમારી જરૂરિયાત મુજબનું માન્ય ફોર્મેટ પસંદ કરો.' : 'Browse standardized templates verified for administrative use.',
              icon: <FileText className="h-6 w-6 text-primary" />,
            },
            {
              step: '૨',
              stepEn: '2',
              title: language === 'gu' ? 'વિગતો ભરો' : 'Enter Details',
              desc: language === 'gu' ? 'માત્ર જરૂરી વિગતો ભરો. સત્રમાં વિગતો ફરી વાપરી શકાય છે.' : 'Fill only the required fields with inline plain-language validation.',
              icon: <FileCheck className="h-6 w-6 text-primary" />,
            },
            {
              step: '૩',
              stepEn: '3',
              title: language === 'gu' ? 'પૂર્વાવલોકન કરો' : 'Review Preview',
              desc: language === 'gu' ? 'તૈયાર થનાર A4 દસ્તાવેજ અગાઉથી ચકાસો અને ભૂલ સુધારો.' : 'Faithful A4 preview matching the exact final print layout.',
              icon: <ShieldCheck className="h-6 w-6 text-primary" />,
            },
            {
              step: '૪',
              stepEn: '4',
              title: language === 'gu' ? 'ડાઉનલોડ / પ્રિન્ટ' : 'Download & Print',
              desc: language === 'gu' ? 'સ્વચ્છ PDF ડાઉનલોડ કરો અથવા સીધી પ્રિન્ટ મેળવો.' : 'Download crisp PDF or print directly from your browser.',
              icon: <Printer className="h-6 w-6 text-primary" />,
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-background/80 border border-border/80 rounded-lg p-5 space-y-3 relative">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-md bg-secondary text-primary">{item.icon}</div>
                <span className="text-2xl font-black text-muted-foreground/30">
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
              {language === 'gu' ? 'ઉપલબ્ધ ડેમો દસ્તાવેજો' : 'Available Demo Templates'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {language === 'gu'
                ? 'કલેક્ટર કચેરી ગાંધીનગર પ્રોટોટાઇપ માટે તૈયાર કરાયેલા ડેમો ફોર્મેટ્સ'
                : 'Sample standardized formats prepared for Gandhinagar Collector Office demo'}
            </p>
          </div>
          <Link to="/documents">
            <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
              <span>{language === 'gu' ? 'બધા જુઓ' : 'View All'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-lg bg-muted/60 animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((tpl) => (
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
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
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
