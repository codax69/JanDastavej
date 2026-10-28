import React, { useState } from 'react';
import { X, Lock, Phone, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCitizenAuth } from '../../context/CitizenAuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import { Alert } from '../ui/Alert.js';

interface CitizenAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
}

export function CitizenAuthModal({ isOpen, onClose, onSuccess, title }: CitizenAuthModalProps) {
  const { language } = useLanguage();
  const { requestOtp, verifyOtp } = useCitizenAuth();

  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await requestOtp(identifier.trim());
      setDemoNotice(res.demoOtp ? `OTP: ${res.demoOtp}` : null);
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      await verifyOtp(identifier.trim(), otp.trim());
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep('request');
    setIdentifier('');
    setOtp('');
    setError(null);
    setDemoNotice(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {title || (language === 'gu' ? 'નાગરિક પ્રવેશ (OTP)' : 'Citizen Sign In')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {language === 'gu'
                  ? 'પોતાના દસ્તાવેજો અપલોડ કરવા અને સાચવવા માટે પ્રવેશ કરો'
                  : 'Sign in to upload supporting documents and manage your files'}
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <Alert variant="destructive" title={language === 'gu' ? 'પ્રવેશ નિષ્ફળ' : 'Authentication Error'}>
            {error}
          </Alert>
        )}

        {demoNotice && (
          <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-md text-xs text-primary font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{demoNotice}</span>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <Input
              id="citizen-identifier"
              label={language === 'gu' ? 'મોબાઇલ નંબર અથવા ઇમેઇલ' : 'Mobile Number or Email'}
              placeholder="e.g. 9876543210 or citizen@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={isLoading}
              autoFocus
            />

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {language === 'gu'
                ? 'ચકાસણી માટે તમારા મોબાઇલ નંબર અથવા ઇમેઇલ પર OTP મોકલવામાં આવશે.'
                : 'An OTP will be sent to your mobile number or email for verification.'}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={resetAndClose} disabled={isLoading}>
                {language === 'gu' ? 'રદ કરો' : 'Cancel'}
              </Button>
              <Button type="submit" size="sm" disabled={isLoading} className="gap-1.5">
                {isLoading ? (
                  <span>{language === 'gu' ? 'મોકલી રહ્યું છે...' : 'Sending...'}</span>
                ) : (
                  <>
                    <span>{language === 'gu' ? 'OTP મેળવો' : 'Send OTP'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-xs text-muted-foreground">
              {language === 'gu' ? (
                <>
                  <span className="font-semibold text-foreground">{identifier}</span> પર મોકલેલો ૬-અંકનો OTP દાખલ કરો:
                </>
              ) : (
                <>
                  Enter the 6-digit OTP sent to <span className="font-semibold text-foreground">{identifier}</span>:
                </>
              )}
            </div>

            <Input
              id="citizen-otp"
              label={language === 'gu' ? '૬-અંકનો OTP' : '6-Digit OTP'}
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              disabled={isLoading}
              autoFocus
            />

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-xs text-primary hover:underline"
                disabled={isLoading}
              >
                {language === 'gu' ? 'બીજો નંબર વાપરો' : 'Change identifier'}
              </button>

              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={resetAndClose} disabled={isLoading}>
                  {language === 'gu' ? 'રદ કરો' : 'Cancel'}
                </Button>
                <Button type="submit" size="sm" disabled={isLoading || otp.length < 4} className="gap-1.5">
                  {isLoading ? (
                    <span>{language === 'gu' ? 'ચકાસણી...' : 'Verifying...'}</span>
                  ) : (
                    <span>{language === 'gu' ? 'ચકાસો અને આગળ વધો' : 'Verify & Continue'}</span>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
