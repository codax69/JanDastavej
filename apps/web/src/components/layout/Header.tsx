import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, Shield, HelpCircle, Trash2, FileText, Menu, X, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useSessionReuse } from '../../context/SessionReuseContext.js';
import { Button } from '../ui/Button.js';

export function Header() {
  const { language, toggleLanguage } = useLanguage();
  const { savedAnswers, clearAllData } = useSessionReuse();
  const location = useLocation();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hasStoredData = Object.keys(savedAnswers).length > 0;

  const handleClear = () => {
    clearAllData();
    setShowClearConfirm(false);
  };

  return (
    <>
      <header className="border-b border-border bg-card sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Wordmark (Strict Rule: Text wordmark only, no fake logos or seals) */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex flex-col group">
              <span className="text-xl sm:text-2xl font-black text-primary tracking-tight group-hover:text-[#17304F]">
                JanDastavej
              </span>
              <span className="text-[11px] text-muted-foreground font-medium -mt-1 hidden sm:inline">
                {language === 'gu' ? 'કલેક્ટર કચેરી, ગાંધીનગર' : 'Collector Office, Gandhinagar'}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Link to="/documents">
              <Button
                variant={location.pathname === '/documents' ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-1.5"
              >
                <FileText className="h-4 w-4" />
                <span>{language === 'gu' ? 'દસ્તાવેજ લાઇબ્રેરી' : 'Templates'}</span>
              </Button>
            </Link>

            <Link to="/submit-format">
              <Button
                variant={location.pathname === '/submit-format' ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>{language === 'gu' ? 'નવું ફોર્મેટ (AI)' : 'Submit Format (AI)'}</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(true)}
              className="gap-1.5"
            >
              <HelpCircle className="h-4 w-4" />
              <span>{language === 'gu' ? 'સહાય' : 'Help'}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPrivacy(true)}
              className="gap-1.5"
            >
              <Shield className="h-4 w-4" />
              <span>{language === 'gu' ? 'ગોપનીયતા' : 'Privacy'}</span>
            </Button>

            {hasStoredData && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5 ml-1"
                title={language === 'gu' ? 'તમારો સાચવેલ ડેટા સાફ કરો' : 'Clear stored session data'}
              >
                <Trash2 className="h-4 w-4" />
                <span>{language === 'gu' ? 'ડેટા સાફ કરો' : 'Clear Data'}</span>
              </Button>
            )}

            {/* Language Switcher */}
            <div className="ml-2 pl-2 border-l border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleLanguage}
                className="gap-1.5 font-bold"
                aria-label="Switch Language"
              >
                <Globe className="h-4 w-4 text-primary" />
                <span>{language === 'gu' ? 'English' : 'ગુજરાતી'}</span>
              </Button>
            </div>
          </nav>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleLanguage}
              className="gap-1 px-2.5"
              aria-label="Switch Language"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{language === 'gu' ? 'EN' : 'ગુજ'}</span>
            </Button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md hover:bg-muted text-foreground"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-2">
            <Link
              to="/documents"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted"
            >
              <FileText className="h-4 w-4 text-primary" />
              <span>{language === 'gu' ? 'દસ્તાવેજ લાઇબ્રેરી' : 'Templates'}</span>
            </Link>
            <Link
              to="/submit-format"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{language === 'gu' ? 'નવું ફોર્મેટ (AI)' : 'Submit Format (AI)'}</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setShowHelp(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted text-left"
            >
              <HelpCircle className="h-4 w-4 text-primary" />
              <span>{language === 'gu' ? 'સહાય' : 'Help'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPrivacy(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted text-left"
            >
              <Shield className="h-4 w-4 text-primary" />
              <span>{language === 'gu' ? 'ગોપનીયતા' : 'Privacy'}</span>
            </button>
            {hasStoredData && (
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 text-left"
              >
                <Trash2 className="h-4 w-4" />
                <span>{language === 'gu' ? 'ડેટા સાફ કરો' : 'Clear Data'}</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">
                {language === 'gu' ? 'સહાય અને માર્ગદર્શન' : 'Help & Guidance'}
              </h3>
              <button onClick={() => setShowHelp(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-sm space-y-3 text-muted-foreground leading-relaxed">
              <p>
                {language === 'gu'
                  ? 'JanDastavej એ કલેક્ટર કચેરી, ગાંધીનગર માટે નાગરિકોને એફિડેવિટ અને સ્વ-ઘોષણાપત્રો ઝડપથી તૈયાર કરવા માટેનું ડિજિટલ સાધન છે.'
                  : 'JanDastavej is a digital document preparation tool for the Collector Office, Gandhinagar to assist citizens in preparing affidavits and declarations.'}
              </p>
              <p>
                {language === 'gu'
                  ? '૧. દસ્તાવેજ પસંદ કરો -> ૨. નિયત માહિતી ભરો -> ૩. પ્રિવ્યૂ ચકાસો -> ૪. ડાઉનલોડ અથવા પ્રિન્ટ કરો.'
                  : '1. Select a document format -> 2. Fill required fields -> 3. Review preview -> 4. Download PDF or Print.'}
              </p>
              <div className="bg-warning-bg p-3 rounded text-xs text-[#7A4510] border border-warning/40">
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">
                {language === 'gu' ? 'ડેટા ગોપનીયતા નીતિ' : 'Data Privacy Notice'}
              </h3>
              <button onClick={() => setShowPrivacy(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-sm space-y-3 text-muted-foreground leading-relaxed">
              <p>
                {language === 'gu'
                  ? 'તમારી અંગત માહિતી સુરક્ષિત છે. અમે તમારી ફોર્મ વિગતો કાયમી રીતે સેવ કરતા નથી.'
                  : 'Your personal information is protected. We do not permanently store or log your form answers.'}
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
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
    </>
  );
}
