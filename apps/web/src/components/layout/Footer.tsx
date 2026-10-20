import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';

export function Footer() {
  const { language } = useLanguage();

  return (
    <footer className="border-t border-border bg-card mt-12 py-8 text-center text-xs text-muted-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="font-semibold text-primary">
          JanDastavej · {language === 'gu' ? 'કલેક્ટર કચેરી, ગાંધીનગર' : 'Collector Office, Gandhinagar'}
        </div>
        <p className="max-w-2xl mx-auto text-muted-foreground/90 leading-relaxed">
          {language === 'gu'
            ? 'પ્રોટોટાઇપ વિશિષ્ટતા: માત્ર ડેમો હેતુ માટે — સત્તાવાર ઉપયોગ માટે નથી. કાનૂની અથવા સત્તાવાર ઉપયોગ પહેલાં યોગ્ય સત્તાધિકારી દ્વારા માન્યતા જરૂરી છે.'
            : 'Prototype specification: Demo only — not for official use. Official templates require formal validation before public deployment.'}
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/80">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors py-1 px-2.5 rounded bg-muted/60 border border-border"
          >
            <Lock className="h-3 w-3 text-primary" />
            <span>{language === 'gu' ? 'અધિકારી પોર્ટલ (Admin Portal)' : 'Staff / Admin Portal'}</span>
          </Link>
        </div>

        <div className="text-[11px] text-muted-foreground/60 pt-2 border-t border-border/50">
          © {new Date().getFullYear()} JanDastavej (PS000221) · Developed with accessible government service design standards
        </div>
      </div>
    </footer>
  );
}
