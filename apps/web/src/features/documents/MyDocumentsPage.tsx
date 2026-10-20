import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Trash2,
  Download,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Lock,
  Plus,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { useCitizenAuth } from '../../context/CitizenAuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { api, ApiClientError } from '../../api/client.js';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Alert } from '../../components/ui/Alert.js';
import { CitizenAuthModal } from '../../components/auth/CitizenAuthModal.js';

export function MyDocumentsPage() {
  const { citizen, isLoading: authLoading } = useCitizenAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const fetchDocuments = async () => {
    if (!citizen) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMyDocuments();
      setDocuments(res?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load your documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !citizen) {
      setShowAuthModal(true);
    } else if (citizen) {
      fetchDocuments();
    }
  }, [citizen, authLoading]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(language === 'gu' ? 'શું તમે આ દસ્તાવેજ કાયમી ધોરણે કાઢી નાખવા માંગો છો?' : 'Permanently delete this document from primary storage?')) {
      return;
    }
    setActionInProgress(id);
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete document.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleKeep = async (doc: any) => {
    setActionInProgress(doc._id);
    try {
      if (doc.kept) {
        await api.unkeepDocument(doc._id);
      } else {
        await api.keepDocument(doc._id, 30);
      }
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to update retention.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteAll = async () => {
    setActionInProgress('all');
    try {
      await api.deleteAllMyData();
      setDocuments([]);
      setConfirmDeleteAll(false);
    } catch (err: any) {
      setError(err.message || 'Failed to delete all data.');
    } finally {
      setActionInProgress(null);
    }
  };

  const formatExpiry = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const d = new Date(expiresAt);
    return d.toLocaleDateString(language === 'gu' ? 'gu-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (authLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-card border border-border rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!citizen) {
    return (
      <div className="p-8 text-center bg-card border border-border rounded-xl space-y-4 max-w-lg mx-auto">
        <Lock className="h-10 w-10 text-primary mx-auto" />
        <h2 className="text-xl font-bold text-foreground">
          {language === 'gu' ? 'નાગરિક પ્રવેશ આવશ્યક છે' : 'Citizen Sign In Required'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {language === 'gu'
            ? 'તમારા સહાયક દસ્તાવેજો અને એનક્ષર્સ જોવા માટે મોબાઇલ અથવા ઇમેઇલ દ્વારા પ્રવેશ કરો.'
            : 'Sign in to access your private My Documents area, reuse annexures, and manage privacy.'}
        </p>
        <Button onClick={() => setShowAuthModal(true)} size="sm">
          {language === 'gu' ? 'પ્રવેશ કરો (OTP)' : 'Sign In with OTP'}
        </Button>
        <CitizenAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={fetchDocuments}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'gu' ? 'દસ્તાવેજ લાઇબ્રેરી' : 'Templates'}</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{language === 'gu' ? 'રીફ્રેશ' : 'Refresh'}</span>
          </Button>

          {documents.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteAll(true)}
              className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{language === 'gu' ? 'મારો તમામ ડેટા ભૂંસી નાખો' : 'Delete All My Data'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-card border border-border p-6 rounded-xl space-y-2 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <HardDrive className="h-6 w-6" />
              <span>{language === 'gu' ? 'મારા દસ્તાવેજો (My Documents)' : 'My Documents'}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'gu'
                ? 'સાઇન-ઇન નાગરિક: '
                : 'Signed-in citizen: '}
              <span className="font-semibold text-foreground">{citizen.identifier}</span>
              {' · '}
              {language === 'gu'
                ? 'તમારા સહાયક દસ્તાવેજો એનક્રિપ્ટેડ અને વ્યક્તિગત રીતે સંગ્રહિત છે.'
                : 'Encrypted storage with per-user prefix. You stay in control.'}
            </p>
          </div>

          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            DPDP Act 2023 Compliant
          </Badge>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" title={language === 'gu' ? 'ક્ષતિ' : 'Error'}>
          {error}
        </Alert>
      )}

      {/* Delete All Modal Confirmation */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-destructive font-bold text-lg">
              <AlertTriangle className="h-5 w-5" />
              <span>{language === 'gu' ? 'તમામ ડેટા કાયમી ભૂંસવો?' : 'Right to Erasure Confirmation'}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === 'gu'
                ? 'આનાથી તમારા તમામ અપલોડ કરેલા દસ્તાવેજો, એક્સ્ટ્રેક્શન પરિણામો અને સત્રો સ્ટોરેજમાંથી તરત જ કાયમી ધોરણે ડિલીટ થઈ જશે.'
                : 'This immediately and permanently erases all your uploaded documents, extracted metadata, and storage files. This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDeleteAll(false)}>
                {language === 'gu' ? 'રદ કરો' : 'Cancel'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAll}
                disabled={actionInProgress === 'all'}
              >
                {actionInProgress === 'all'
                  ? language === 'gu'
                    ? 'કાઢી રહ્યું છે...'
                    : 'Deleting...'
                  : language === 'gu'
                  ? 'હા, બધું ડિલીટ કરો'
                  : 'Permanently Erase Everything'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Document List */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base text-foreground flex items-center justify-between">
            <span>{language === 'gu' ? 'સાચવેલ ફાઇલો' : 'Kept Files'}</span>
            <span className="text-xs text-muted-foreground font-normal">
              {documents.length} {language === 'gu' ? 'ફાઇલો' : 'files'}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {language === 'gu' ? 'દસ્તાવેજો લોડ થઈ રહ્યા છે...' : 'Loading documents...'}
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-foreground">
                {language === 'gu' ? 'કોઈ સાચવેલા દસ્તાવેજો નથી' : 'No documents saved yet'}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {language === 'gu'
                  ? 'જ્યારે તમે એફિડેવિટ બનાવતી વખતે દસ્તાવેજ અપલોડ કરી "Keep in My Documents" પસંદ કરશો ત્યારે તે અહીં દેખાશે.'
                  : 'When you upload supporting documents and choose "Keep in My Documents", they will appear here for easy reuse.'}
              </p>
              <Link to="/documents">
                <Button size="sm" className="mt-2">
                  {language === 'gu' ? 'દસ્તાવેજ લાઇબ્રેરી જુઓ' : 'Browse Templates'}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {documents.map((doc) => {
                const expiryText = formatExpiry(doc.expiresAt);
                return (
                  <div
                    key={doc._id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">
                          {doc.originalName || doc.docType || 'Document'}
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {doc.docType || 'other'}
                        </Badge>
                        <Badge
                          variant={doc.status === 'ready' ? 'success' : 'destructive'}
                          className="text-[10px]"
                        >
                          {doc.status}
                        </Badge>
                        {doc.kept && (
                          <Badge variant="secondary" className="text-[10px]">
                            {language === 'gu' ? 'સાચવેલ (Kept)' : 'Kept in Vault'}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span>{Math.round(doc.sizeBytes / 1024)} KB</span>
                        {doc.pageCount && <span>{doc.pageCount} pages</span>}
                        {expiryText && (
                          <span className="flex items-center gap-1 text-[#7A4510]">
                            <Clock className="h-3 w-3" />
                            <span>
                              {language === 'gu'
                                ? `આપોઆપ ડિલીટ થશે: ${expiryText}`
                                : `Deleted automatically on ${expiryText}`}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleKeep(doc)}
                        disabled={actionInProgress === doc._id}
                        className="text-xs h-8"
                      >
                        {doc.kept
                          ? language === 'gu'
                            ? 'ડિલીટ શેડ્યૂલ કરો'
                            : 'Unkeep'
                          : language === 'gu'
                          ? 'સાચવો'
                          : 'Keep'}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc._id)}
                        disabled={actionInProgress === doc._id}
                        className="text-destructive hover:bg-destructive/10 text-xs h-8 px-2"
                        title={language === 'gu' ? 'કાયમી ડિલીટ કરો' : 'Delete permanently'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
