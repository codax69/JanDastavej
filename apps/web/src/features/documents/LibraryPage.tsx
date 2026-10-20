import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, FileText, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { StepIndicator } from '../../components/shared/StepIndicator.js';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';

export function LibraryPage() {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get('search') || '';
  const categoryFromUrl = searchParams.get('category') || 'all';

  const [search, setSearch] = useState(searchFromUrl);
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);

  const { data, isLoading, error } = useQuery({
    queryKey: ['templates', language],
    queryFn: () => api.getTemplates({ language }),
  });

  const categories = [
    { id: 'all', label: language === 'gu' ? 'બધા દસ્તાવેજો' : 'All Templates' },
    { id: 'declaration', label: language === 'gu' ? 'સ્વ-ઘોષણાપત્રો' : 'Declarations' },
    { id: 'affidavit', label: language === 'gu' ? 'સોગંદનામા (Affidavits)' : 'Affidavits' },
    { id: 'certificate_support', label: language === 'gu' ? 'દાખલા/પ્રમાણપત્ર સહાયક' : 'Certificate Support' },
  ];

  const filteredTemplates = useMemo(() => {
    let list = data?.data || [];
    if (selectedCategory !== 'all') {
      list = list.filter((t) => t.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.titleGu.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.descriptionGu.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, selectedCategory, search]);

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
      {/* Step Indicator: Step 1 */}
      <StepIndicator currentStep={1} language={language} />

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          {language === 'gu' ? 'દસ્તાવેજ લાઇબ્રેરી' : 'Document Template Library'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {language === 'gu'
            ? 'ગાંધીનગર કલેક્ટર કચેરી માટે ઉપલબ્ધ પ્રમાણિત ફોર્મેટ્સમાંથી પસંદ કરો'
            : 'Select an authorized document format to start preparation'}
        </p>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={language === 'gu' ? 'નામ દ્વારા શોધો...' : 'Search by name...'}
            className="w-full h-10 pl-9 pr-3 text-sm rounded-md border border-input bg-background focus-visible:outline-2 focus-visible:outline-ring"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange(cat.id)}
              className="text-xs font-semibold"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-60 rounded-lg bg-muted/60 animate-pulse border border-border" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-8 text-center bg-card border border-destructive/30 rounded-lg space-y-3">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <h3 className="font-bold text-destructive">
            {language === 'gu' ? 'દસ્તાવેજો લોડ કરવામાં ક્ષતિ આવી' : 'Failed to load templates'}
          </h3>
          <p className="text-sm text-muted-foreground">{(error as any)?.message || 'Please try again.'}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredTemplates.length === 0 && (
        <div className="p-12 text-center bg-card border border-border rounded-lg space-y-4">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-foreground text-lg">
              {language === 'gu' ? 'કોઈ દસ્તાવેજ મળ્યો નથી' : 'No documents found'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {language === 'gu'
                ? 'તમારા શોધ માપદંડને અનુરૂપ કોઈ પરિણામ મળ્યું નથી. કૃપા કરીને અન્ય શોધ શબ્દ અજમાવો.'
                : 'No templates match your search criteria. Try adjusting your search or category filter.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
            }}
          >
            {language === 'gu' ? 'ફિલ્ટર્સ સાફ કરો' : 'Clear Filters'}
          </Button>
        </div>
      )}

      {/* Template Cards Grid */}
      {!isLoading && !error && filteredTemplates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tpl) => (
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
                <CardTitle className="text-lg">
                  {language === 'gu' ? tpl.titleGu : tpl.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {language === 'gu' ? tpl.descriptionGu : tpl.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">
                    {language === 'gu' ? 'સહાયક પુરાવા:' : 'Required docs:'}{' '}
                  </span>
                  <span>
                    {(language === 'gu' ? tpl.requiredDocumentsGu : tpl.requiredDocuments).slice(0, 2).join(', ')}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Link to={`/documents/${tpl.slug}`} className="w-full">
                  <Button variant="primary" size="md" className="w-full gap-2">
                    <span>{language === 'gu' ? 'આગળ વધો' : 'Select Format'}</span>
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
