import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Layers, ArrowRight, ShieldCheck, Building2, CheckCircle2, FileText } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { StepIndicator } from '../../components/shared/StepIndicator.js';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';

export function ServicesPage() {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get('search') || '';
  const categoryFromUrl = searchParams.get('category') || 'all';

  const [search, setSearch] = useState(searchFromUrl);
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);

  const { data, isLoading, error } = useQuery({
    queryKey: ['services', language],
    queryFn: () => api.getServices({ language }),
  });

  const categories = [
    { id: 'all', label: language === 'gu' ? 'બધી સેવાઓ' : 'All Services' },
    { id: 'revenue', label: language === 'gu' ? 'મહેસૂલ (Revenue)' : 'Revenue' },
    { id: 'general_administration', label: language === 'gu' ? 'સામાન્ય વહીવટ (Admin)' : 'General Admin' },
    { id: 'legal_affairs', label: language === 'gu' ? 'કાનૂની બાબતો (Legal)' : 'Legal Affairs' },
    { id: 'social_welfare', label: language === 'gu' ? 'સમાજ કલ્યાણ (Welfare)' : 'Social Welfare' },
    { id: 'urban_development', label: language === 'gu' ? 'શહેરી વિકાસ (Urban/Civic)' : 'Urban Development' },
  ];

  const services = data?.data || [];

  const filteredServices = useMemo(() => {
    let list = services;
    if (selectedCategory !== 'all') {
      list = list.filter((s) => s.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.titleGu.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.departmentGu.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.descriptionGu.toLowerCase().includes(q)
      );
    }
    return list;
  }, [services, selectedCategory, search]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setSearchParams((prev) => {
      if (catId === 'all') prev.delete('category');
      else prev.set('category', catId);
      return prev;
    });
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setSearchParams((prev) => {
      if (!val) prev.delete('search');
      else prev.set('search', val);
      return prev;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 font-bold">
            <Building2 className="h-3.5 w-3.5" />
            <span>{language === 'gu' ? 'સરકારી સેવાઓ ડિરેક્ટરી' : 'Citizen Services Directory'}</span>
          </Badge>
          <Badge variant="outline" className="text-xs">
            {language === 'gu' ? 'કલેક્ટર કચેરી, ગાંધીનગર' : 'Collector Office, Gandhinagar'}
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          {language === 'gu' ? 'નાગરિક-કેન્દ્રી સેવાઓ અને દસ્તાવેજ માર્ગદર્શિકા' : 'Citizen Services & Required Documents'}
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          {language === 'gu'
            ? 'તમને જે સરકારી સેવા જોઈતી હોય તે પસંદ કરો. સેવા માટે જરૂરી સોગંદનામા અને ઘોષણાપત્રોની સંપૂર્ણ યાદી જુઓ અને એક જ વાર માહિતી ભરી તમામ દસ્તાવેજો એકસાથે તૈયાર કરો.'
            : 'Select any public service to view verified document checklists. Enter personal details once and generate all required affidavits, declarations, and undertakings simultaneously.'}
        </p>
      </div>

      {/* Search and Category Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border border-border shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={language === 'gu' ? 'સેવા અથવા વિભાગ શોધો...' : 'Search service or department...'}
            className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services List / Loading / Empty */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-lg bg-card border border-border animate-pulse p-6" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-lg space-y-4">
          <Layers className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-bold text-foreground">
            {language === 'gu' ? 'કોઈ સેવા મળી નથી' : 'No Services Found'}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {language === 'gu'
              ? 'તમારી શોધ મુજબ કોઈ સરકારી સેવા ઉપલબ્ધ નથી. કૃપા કરીને અન્ય શોધ શબ્દનો ઉપયોગ કરો.'
              : 'No citizen services matched your search or category filter. Try clearing filters or using another keyword.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
            }}
          >
            {language === 'gu' ? 'તમામ ફિલ્ટર સાફ કરો' : 'Clear All Filters'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service._id} className="flex flex-col hover:border-primary/50 transition-colors shadow-xs">
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[11px] font-semibold text-primary">
                    {language === 'gu' ? service.departmentGu : service.department}
                  </Badge>
                  <Badge variant="secondary" className="text-[11px] flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>
                      {service.requiredDocumentCount} {language === 'gu' ? 'દસ્તાવેજો' : 'docs'}
                    </span>
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold text-foreground line-clamp-2">
                  {language === 'gu' ? service.titleGu : service.title}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground line-clamp-3">
                  {language === 'gu' ? service.descriptionGu : service.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="py-2 text-xs text-muted-foreground space-y-1.5 flex-1">
                <div className="flex items-center gap-1.5 text-foreground/80">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{service.jurisdiction}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-muted-foreground">
                    {language === 'gu' ? 'ચકાસણી:' : 'Status:'}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    {language === 'gu' ? 'પ્રમાણિત પ્રોટોટાઇપ' : 'Verified Prototype Checklist'}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t border-border mt-auto">
                <Link to={`/services/${service.slug}`} className="w-full">
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
    </div>
  );
}
