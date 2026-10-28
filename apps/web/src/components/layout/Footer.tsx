import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { Logo } from '../ui/Logo.js';

export function Footer() {
  const { language } = useLanguage();

  return (
    <footer className="border-t-2 border-t-accent border-b border-border bg-card mt-16 py-8 text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Portal Info */}
        <div className="flex items-center gap-1 text-center sm:text-left">
          <Logo className="h-6 w-auto shrink-0 mb-1" />
          <span className="font-bold text-foreground leading-none">JanDastavej</span>
          <span className="mx-2 text-border">·</span>
          <span>
            {language === 'gu' ? 'નાગરિક સેવા ડિજિટલ દસ્તાવેજ પોર્ટલ' : 'Citizen Document Portal'}
          </span>
        </div>

        {/* Admin Portal Button */}
        <div className="flex items-center gap-3">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all duration-150 shadow-2xs"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>{language === 'gu' ? 'અધિકારી પોર્ટલ (Admin Portal)' : 'Admin Portal'}</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground/70 text-center sm:text-left">
        <div>
          © {new Date().getFullYear()} JanDastavej · All rights reserved
        </div>
      </div>
    </footer>
  );
}
