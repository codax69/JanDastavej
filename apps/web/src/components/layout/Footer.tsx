import React from 'react';
import { useLanguage } from '../../context/LanguageContext.js';

export function Footer() {
  const { language } = useLanguage();

  return (
    <footer className="border-t border-border bg-card mt-12 py-8 text-center text-xs text-muted-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-3">
        <div className="font-semibold text-primary">
          JanDastavej · {language === 'gu' ? 'કલેક્ટર કચેરી, ગાંધીનગર' : 'Collector Office, Gandhinagar'}
        </div>
        <p className="max-w-2xl mx-auto text-muted-foreground/90">
          {language === 'gu'
            ? 'પ્રોટોટાઇપ વિશિષ્ટતા: માત્ર ડેમો હેતુ માટે — સત્તાવાર ઉપયોગ માટે નથી. કાનૂની અથવા સત્તાવાર ઉપયોગ પહેલાં યોગ્ય સત્તાધિકારી દ્વારા માન્યતા જરૂરી છે.'
            : 'Prototype specification: Demo only — not for official use. Official templates require formal validation before public deployment.'}
        </p>
        <div className="text-[11px] text-muted-foreground/70">
          © {new Date().getFullYear()} JanDastavej (PS000221) · Developed with accessible government service design standards
        </div>
      </div>
    </footer>
  );
}
