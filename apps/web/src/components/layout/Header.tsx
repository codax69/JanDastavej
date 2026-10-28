import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Globe,
  ShieldCheck,
  HelpCircle,
  Trash2,
  FileText,
  FileCheck,
  Menu,
  X,
  Sparkles,
  HardDrive,
  User,
  LogOut,
  LogIn,
  Layers,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useSessionReuse } from '../../context/SessionReuseContext.js';
import { useCitizenAuth } from '../../context/CitizenAuthContext.js';
import { Button } from '../ui/Button.js';
import { Logo } from '../ui/Logo.js';
import { CitizenAuthModal } from '../auth/CitizenAuthModal.js';
import { cn } from '../../lib/utils.js';

export function Header() {
  const { language, toggleLanguage } = useLanguage();
  const { savedAnswers, clearAllData } = useSessionReuse();
  const { citizen, logout } = useCitizenAuth();
  const location = useLocation();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCitizenAuth, setShowCitizenAuth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hasStoredData = Object.keys(savedAnswers).length > 0;

  const handleClear = () => {
    clearAllData();
    setShowClearConfirm(false);
  };

  const navLinks = [
    {
      to: '/services',
      label: language === 'gu' ? 'સેવાઓ' : 'Services',
      icon: Layers,
      isActive: location.pathname.startsWith('/services'),
    },
    {
      to: '/documents',
      label: language === 'gu' ? 'દસ્તાવેજ લાઇબ્રેરી' : 'Templates',
      icon: FileText,
      isActive: location.pathname.startsWith('/documents'),
    },
    {
      to: '/submit-format',
      label: language === 'gu' ? 'નવું ફોર્મેટ' : 'Submit Template',
      icon: Sparkles,
      isActive: location.pathname === '/submit-format',
    },
    {
      to: '/my-documents',
      label: language === 'gu' ? 'મારા દસ્તાવેજો' : 'My Documents',
      icon: HardDrive,
      isActive: location.pathname === '/my-documents',
    },
  ];

  return (
    <>
      <header className="border-t-2 border-t-accent border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Wordmark & Emblem */}
          <Link
            to="/"
            className="flex items-center gap-1.5 group shrink-0 focus-visible:outline-2 focus-visible:outline-primary rounded-lg py-1"
            aria-label="JanDastavej Home"
          >
            <Logo className="h-8 w-auto group-hover:scale-105 transition-transform shrink-0 mb-1" />
            <div className="flex flex-col justify-center">
              <span className="text-xl font-black text-primary tracking-tight leading-none group-hover:text-primary/85 transition-colors">
                JanDastavej
              </span>
            </div>
          </Link>

          {/* Desktop Navigation & Utilities */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-2.5 shrink-0">
            {/* Primary Nav Links */}
            <nav className="flex items-center gap-1 xl:gap-1.5">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'h-8 inline-flex items-center justify-center gap-2 px-2.5 xl:px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150',
                      item.isActive
                        ? 'bg-primary/10 text-primary font-bold shadow-2xs border border-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 border border-transparent'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0',
                        item.isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    <span className="leading-none flex items-center">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Subtle Divider */}
            <div className="h-5 w-px bg-border/80 shrink-0 mx-0.5" />

            {/* Utility Actions (Help, Privacy, Clear Data) */}
            <div className="flex items-center gap-1 xl:gap-1.5">

              {/* Help Modal Trigger */}
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                className="h-8 inline-flex items-center justify-center gap-1.5 px-2 xl:px-2.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors whitespace-nowrap cursor-pointer"
                title={language === 'gu' ? 'સહાય અને માર્ગદર્શન' : 'Help & Guidance'}
              >
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xl:inline leading-none flex items-center">
                  {language === 'gu' ? 'સહાય' : 'Help'}
                </span>
              </button>

              {/* Privacy Modal Trigger */}
              <button
                type="button"
                onClick={() => setShowPrivacy(true)}
                className="h-8 inline-flex items-center justify-center gap-1.5 px-2 xl:px-2.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors whitespace-nowrap cursor-pointer"
                title={language === 'gu' ? 'ડેટા ગોપનીયતા નીતિ' : 'Data Privacy Notice'}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xl:inline leading-none flex items-center">
                  {language === 'gu' ? 'ગોપનીયતા' : 'Privacy'}
                </span>
              </button>

              {/* Clear Stored Session Data */}
              {hasStoredData && (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="h-8 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 border border-destructive/30 transition-colors whitespace-nowrap cursor-pointer"
                  title={language === 'gu' ? 'તમારો સાચવેલ સત્ર ડેટા સાફ કરો' : 'Clear stored session data'}
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden 2xl:inline leading-none flex items-center">
                    {language === 'gu' ? 'ડેટા સાફ' : 'Clear'}
                  </span>
                </button>
              )}
            </div>

            {/* Subtle Divider */}
            <div className="h-5 w-px bg-border/80 shrink-0 mx-0.5" />

            {/* Citizen Auth Status */}
            <div className="flex items-center">
              {citizen ? (
                <div className="h-8 inline-flex items-center gap-1.5 pl-2.5 pr-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-foreground whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span
                    className="font-medium text-emerald-950 max-w-[110px] truncate leading-none flex items-center"
                    title={citizen.identifier}
                  >
                    {citizen.identifier}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title={language === 'gu' ? 'બહાર નીકળો' : 'Sign Out'}
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCitizenAuth(true)}
                  className="h-8 inline-flex items-center justify-center gap-1.5 px-3 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-[#17304F] shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span className="leading-none flex items-center">
                    {language === 'gu' ? 'પ્રવેશ' : 'Sign In'}
                  </span>
                </button>
              )}
            </div>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="h-8 inline-flex items-center justify-center gap-1.5 px-2.5 rounded-lg text-xs font-bold border border-border bg-card hover:bg-muted text-foreground transition-all shadow-2xs whitespace-nowrap cursor-pointer"
              aria-label="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="leading-none flex items-center">
                {language === 'gu' ? 'English' : 'ગુજરાતી'}
              </span>
            </button>
          </div>

          {/* Mobile Actions: Language + Hamburger Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={toggleLanguage}
              className="h-8 inline-flex items-center justify-center gap-1 px-2.5 rounded-lg text-xs font-bold border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
              aria-label="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="leading-none flex items-center">
                {language === 'gu' ? 'EN' : 'ગુજ'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted text-foreground border border-border/80 transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card/98 backdrop-blur-md px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
            {/* Primary Nav Links */}
            <div className="space-y-0.5">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      item.isActive
                        ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="leading-none flex items-center">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-border my-2" />

            {/* Citizen Auth */}
            {citizen ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-semibold text-emerald-950 truncate max-w-[180px]">
                    {citizen.identifier}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-1 text-destructive font-semibold text-xs hover:underline cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{language === 'gu' ? 'બહાર નીકળો' : 'Sign Out'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowCitizenAuth(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-[#17304F] transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span className="leading-none flex items-center">
                  {language === 'gu' ? 'નાગરિક પ્રવેશ (OTP)' : 'Citizen Sign In'}
                </span>
              </button>
            )}

            {/* Secondary Utilities */}
            <div className="pt-1 space-y-0.5">

              <button
                type="button"
                onClick={() => {
                  setShowHelp(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                <span className="leading-none flex items-center">
                  {language === 'gu' ? 'સહાય અને માર્ગદર્શન' : 'Help & Guidance'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPrivacy(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors text-left cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span className="leading-none flex items-center">
                  {language === 'gu' ? 'ડેટા ગોપનીયતા નીતિ' : 'Data Privacy Notice'}
                </span>
              </button>

              {hasStoredData && (
                <button
                  type="button"
                  onClick={() => {
                    setShowClearConfirm(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span className="leading-none flex items-center">
                    {language === 'gu' ? 'સાચવેલ ડેટા સાફ કરો' : 'Clear Stored Data'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-primary">
                  {language === 'gu' ? 'સહાય અને માર્ગદર્શન' : 'Help & Guidance'}
                </h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-sm space-y-3 text-muted-foreground leading-relaxed">
              <p>
                {language === 'gu'
                  ? 'JanDastavej એ નાગરિકોને એફિડેવિટ અને સ્વ-ઘોષણાપત્રો ઝડપથી તૈયાર કરવા માટેનું ડિજિટલ સાધન છે.'
                  : 'JanDastavej is a digital document preparation tool to assist citizens in preparing affidavits and declarations.'}
              </p>
              <p>
                {language === 'gu'
                  ? '૧. દસ્તાવેજ પસંદ કરો -> ૨. નિયત માહિતી ભરો -> ૩. પ્રિવ્યૂ ચકાસો -> ૪. ડાઉનલોડ અથવા પ્રિન્ટ કરો.'
                  : '1. Select a document format -> 2. Fill required fields -> 3. Review preview -> 4. Download PDF or Print.'}
              </p>
              <div className="bg-warning-bg p-3.5 rounded-lg text-xs text-[#7A4510] border border-warning/40">
                {language === 'gu'
                  ? 'મહત્વપૂર્ણ: આ સાધન માત્ર દસ્તાવેજ ડ્રાફ્ટ કરવા માટે છે. કાનૂની માન્યતા માટે સક્ષમ સત્તાધિકારી કે નોટરી સમક્ષ સહી અથવા સ્ટેમ્પ ડ્યુટી કરાવવી જરૂરી હોઈ શકે છે.'
                  : 'Important: This tool prepares drafts only. Legal validity may require authorized notarization, stamp duty, or physical signatures.'}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setShowHelp(false)} size="sm">
                {language === 'gu' ? 'સમજાયું' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-primary">
                  {language === 'gu' ? 'ડેટા ગોપનીયતા નીતિ' : 'Data Privacy Notice'}
                </h3>
              </div>
              <button
                onClick={() => setShowPrivacy(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-sm space-y-3 text-muted-foreground leading-relaxed">
              <p>
                {language === 'gu'
                  ? 'તમારી અંગત માહિતી સુરક્ષિત છે. અમે તમારી ફોર્મ વિગતો કાયમી રીતે સેવ કરતા નથી.'
                  : 'Your personal information is protected. We do not permanently store or log your form answers.'}
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li>
                  {language === 'gu'
                    ? 'તમારો ડેટા ટૂંકા ગાળાના સત્ર પૂરતો જ મર્યાદિત રહે છે.'
                    : 'Data is retained only for short-lived preview generation sessions.'}
                </li>
                <li>
                  {language === 'gu'
                    ? 'સત્ર સમાપ્ત થતાં ડેટા આપોઆપ નાશ પામે છે.'
                    : 'Sessions expire automatically via database TTL.'}
                </li>
                <li>
                  {language === 'gu'
                    ? 'તમે ગમે ત્યારે "ડેટા સાફ કરો" બટન દબાવી ડેટા તાત્કાલિક ડિલીટ કરી શકો છો.'
                    : 'You can immediately delete any saved session values using "Clear Data".'}
                </li>
              </ul>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setShowPrivacy(false)} size="sm">
                {language === 'gu' ? 'સમજાયું' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-destructive">
              {language === 'gu' ? 'બધો સાચવેલ ડેટા સાફ કરવો છે?' : 'Clear all stored data?'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === 'gu'
                ? 'આનાથી તમારા બ્રાઉઝર સત્રમાં સાચવેલી બધી વિગતો સંપૂર્ણપણે ભૂંસી નાખવામાં આવશે.'
                : 'This will completely erase all details prefilled or saved in your browser session.'}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(false)}>
                {language === 'gu' ? 'રદ કરો' : 'Cancel'}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleClear}>
                {language === 'gu' ? 'હા, ડેટા સાફ કરો' : 'Yes, Clear Data'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Citizen Authentication Modal */}
      <CitizenAuthModal
        isOpen={showCitizenAuth}
        onClose={() => setShowCitizenAuth(false)}
      />
    </>
  );
}
