import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle,
  XCircle,
  Globe,
  FileText,
  Layers,
  Shield,
  Edit2,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ExternalLink,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Alert } from '../../components/ui/Alert.js';
import { Input } from '../../components/ui/Input.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { Select } from '../../components/ui/Select.js';
import { Checkbox } from '../../components/ui/Checkbox.js';
import { renderDocumentHtml, getDocumentStyles, TemplateField } from '@jandastavej/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export function AdminSubmissionReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);

  // Editable Approval Parameters
  const [title, setTitle] = useState('');
  const [titleGu, setTitleGu] = useState('');
  const [category, setCategory] = useState('declaration');
  const [purpose, setPurpose] = useState('');
  const [purposeGu, setPurposeGu] = useState('');
  const [layoutKey, setLayoutKey] = useState('sample_declaration');
  const [fields, setFields] = useState<TemplateField[]>([]);

  // Field Edit Modal State
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [fieldModalError, setFieldModalError] = useState<string | null>(null);
  const [modalKey, setModalKey] = useState('');
  const [modalLabel, setModalLabel] = useState('');
  const [modalLabelGu, setModalLabelGu] = useState('');
  const [modalType, setModalType] = useState<TemplateField['type']>('text');
  const [modalRequired, setModalRequired] = useState(true);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-submission-detail', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/admin/submissions/${id}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) navigate('/admin/login');
        throw new Error('Failed to load submission');
      }
      return res.json();
    },
    enabled: !!id,
  });

  const submission = data?.data;
  const scan = submission?.aiScanResult;

  useEffect(() => {
    if (submission) {
      setTitle(scan?.detectedTitle || submission.documentTitle || '');
      setTitleGu(scan?.detectedTitleGu || '');
      setCategory(submission.category || scan?.detectedCategory || 'declaration');
      setPurpose(scan?.detectedPurpose || '');
      setPurposeGu(scan?.detectedPurposeGu || '');
      setLayoutKey(scan?.suggestedLayoutKey || 'sample_declaration');
      setFields(scan?.extractedFields || []);
    }
  }, [submission, scan]);

  const handleRescan = async () => {
    setIsRescanning(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/submissions/${id}/rescan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ categoryHint: category }),
      });
      if (!res.ok) throw new Error('Failed to re-scan document.');
      setActionSuccess('Document re-scanned by AI successfully.');
      refetch();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsRescanning(false);
    }
  };

  const handleApproveAndPublish = async () => {
    if (!title.trim() || !titleGu.trim() || fields.length === 0) {
      setActionError('Title and at least one input field are required to publish.');
      return;
    }

    setIsApproving(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/admin/submissions/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          titleGu: titleGu.trim(),
          category,
          purpose: purpose.trim(),
          purposeGu: purposeGu.trim(),
          fields,
          layoutKey,
          requiredDocuments: ['Aadhaar Card (આધાર કાર્ડ)', 'Ration Card (રેશન કાર્ડ)'],
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error?.message || 'Approval failed.');

      setActionSuccess(
        `Template approved & published live! Slug: '${resData.data.template.slug}'. Citizens can now use this format.`
      );
      refetch();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      const res = await fetch(`${API_BASE}/admin/submissions/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Rejection failed.');
      setActionSuccess('Submission rejected.');
      refetch();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Field CRUD
  const handleOpenAddField = () => {
    setEditingFieldIndex(null);
    setModalKey('');
    setModalLabel('');
    setModalLabelGu('');
    setModalType('text');
    setModalRequired(true);
    setFieldModalError(null);
    setShowFieldModal(true);
  };

  const handleOpenEditField = (index: number) => {
    const f = fields[index];
    if (!f) return;
    setEditingFieldIndex(index);
    setModalKey(f.key);
    setModalLabel(f.label);
    setModalLabelGu(f.labelGu || '');
    setModalType(f.type);
    setModalRequired(f.required !== false);
    setFieldModalError(null);
    setShowFieldModal(true);
  };

  const handleSaveFieldModal = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldModalError(null);

    const trimmedKey = modalKey.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(trimmedKey)) {
      setFieldModalError('Field key must be camelCase alphanumeric starting with a letter.');
      return;
    }

    if (!modalLabel.trim()) {
      setFieldModalError('English label is required.');
      return;
    }

    const updated: TemplateField = {
      key: trimmedKey,
      label: modalLabel.trim(),
      labelGu: modalLabelGu.trim() || undefined,
      type: modalType,
      required: modalRequired,
      minLength: 0,
      maxLength: 200,
    };

    if (editingFieldIndex !== null) {
      const next = [...fields];
      next[editingFieldIndex] = updated;
      setFields(next);
    } else {
      setFields([...fields, updated]);
    }

    setShowFieldModal(false);
  };

  const handleDeleteField = (index: number) => {
    setFields(fields.filter((_, idx) => idx !== index));
  };

  const handleMoveField = (index: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setFields(next);
  };

  if (isLoading || !submission) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Loading submission review...</div>;
  }

  // Synthetic answers for document preview
  const sampleAnswers: Record<string, any> = {
    fullName: 'રમણલાલ ચતુરભાઈ શાહ',
    parentSpouseName: 'ચતુરભાઈ શાહ',
    age: 42,
    occupation: 'વેપાર',
    address: 'પ્લોટ નં. ૧૨, સેક્ટર-૨૧, ગાંધીનગર',
    declarationPurpose: purposeGu || 'વહીવટી ચકાસણી અને પ્રિવ્યૂ ટેસ્ટિંગ હેતુ માટે આ નકલી ડેટા છે.',
    declarationDate: '2026-10-20',
    place: 'ગાંધીનગર',
    deponentName: 'રમણલાલ ચતુરભાઈ શાહ',
    deponentAge: 42,
    deponentAddress: 'ગાંધીનગર',
    matterStated: 'સોગંદપૂર્વકનું નિવેદન',
    annualIncome: 150000,
    rationCardNumber: '072501234567',
  };

  fields.forEach((f) => {
    if (!sampleAnswers[f.key]) sampleAnswers[f.key] = `[${f.label}]`;
  });

  const previewHtml = renderDocumentHtml({
    layoutKey,
    language: 'gu',
    answers: sampleAnswers,
    isDemoOnly: true,
  });

  const isApproved = submission.status === 'approved';
  const isRejected = submission.status === 'rejected';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/submissions"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Submissions Queue</span>
        </Link>
        <span className="text-xs text-muted-foreground">Submission #{submission._id.slice(-6)}</span>
      </div>

      {actionError && <Alert variant="destructive" title="Error">{actionError}</Alert>}
      {actionSuccess && <Alert variant="success" title="Success">{actionSuccess}</Alert>}

      {/* Main Review Card */}
      <Card>
        <CardHeader className="border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                <span>AI Scan Analysis</span>
              </Badge>
              {scan && (
                <Badge variant="outline" className="text-xs font-mono">
                  {scan.confidenceScore}% Confidence
                </Badge>
              )}
              <Badge
                variant={isApproved ? 'success' : isRejected ? 'destructive' : 'warning'}
                className="capitalize text-xs"
              >
                {isApproved ? 'Approved & Published' : isRejected ? 'Rejected' : 'Pending Review'}
              </Badge>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black text-foreground">
              {submission.documentTitle}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Submitted by: {submission.submitterName || 'Citizen'} ({submission.submitterEmail || 'No email'}) ·{' '}
              {new Date(submission.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Action Decision Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!isApproved && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRescan}
                  disabled={isRescanning}
                  className="gap-1.5 text-xs h-8"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRescanning ? 'animate-spin' : ''}`} />
                  <span>Re-scan AI</span>
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleReject}
                  className="gap-1.5 text-xs h-8"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleApproveAndPublish}
                  disabled={isApproving}
                  className="gap-1.5 text-xs h-8 font-bold"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>{isApproving ? 'Publishing...' : 'Approve & Publish to Site'}</span>
                </Button>
              </>
            )}

            {isApproved && (
              <Link to="/documents">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs text-success border-success/40">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>View in Public Library</span>
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: ORIGINAL SUBMITTED TEXT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                <span>Original Submitted Document</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {submission.documentText?.length || 0} chars
              </span>
            </div>
            <div className="bg-muted/40 p-4 rounded-lg border border-border text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {submission.documentText}
            </div>
          </div>

          {/* RIGHT: AI EXTRACTION & REFINEMENT */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Extracted Template Configuration</span>
            </span>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Title (English)"
                  required
                  value={title}
                  disabled={isApproved}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Input
                  label="Title (Gujarati)"
                  required
                  value={titleGu}
                  disabled={isApproved}
                  onChange={(e) => setTitleGu(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Category"
                  value={category}
                  disabled={isApproved}
                  onChange={(e) => setCategory(e.target.value)}
                  options={[
                    { value: 'declaration', label: 'Self Declaration' },
                    { value: 'affidavit', label: 'Affidavit' },
                    { value: 'certificate_support', label: 'Certificate Support' },
                    { value: 'revenue_service', label: 'Revenue Service' },
                    { value: 'general', label: 'General' },
                  ]}
                />
                <Select
                  label="Layout Key"
                  value={layoutKey}
                  disabled={isApproved}
                  onChange={(e) => setLayoutKey(e.target.value)}
                  options={[
                    { value: 'sample_declaration', label: 'Standard Declaration Layout' },
                    { value: 'sample_affidavit', label: 'Sworn Affidavit Layout' },
                    { value: 'sample_address_declaration', label: 'Address Verification Layout' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Textarea
                  label="Purpose (English)"
                  rows={2}
                  value={purpose}
                  disabled={isApproved}
                  onChange={(e) => setPurpose(e.target.value)}
                />
                <Textarea
                  label="Purpose (Gujarati)"
                  rows={2}
                  value={purposeGu}
                  disabled={isApproved}
                  onChange={(e) => setPurposeGu(e.target.value)}
                />
              </div>
            </div>

            {/* Extracted Fields Schema Table */}
            <div className="border border-border rounded-lg overflow-hidden mt-4">
              <div className="bg-muted px-4 py-2.5 flex items-center justify-between border-b border-border">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Citizen Form Fields ({fields.length})</span>
                </span>
                {!isApproved && (
                  <Button size="sm" onClick={handleOpenAddField} className="text-xs h-7 gap-1">
                    <Plus className="h-3 w-3" />
                    <span>Add Field</span>
                  </Button>
                )}
              </div>

              <div className="divide-y divide-border text-xs max-h-56 overflow-y-auto">
                {fields.map((f, idx) => (
                  <div key={f.key + idx} className="p-2.5 flex items-center justify-between hover:bg-muted/30">
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className="font-mono text-primary">{f.key}</span>
                        <span className="text-muted-foreground">·</span>
                        <span>{f.label}</span>
                        {f.labelGu && <span className="text-muted-foreground font-gujarati">({f.labelGu})</span>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[10px] font-mono">{f.type}</Badge>
                        <Badge variant={f.required ? 'secondary' : 'outline'} className="text-[10px]">
                          {f.required ? 'Required' : 'Optional'}
                        </Badge>
                      </div>
                    </div>

                    {!isApproved && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveField(idx, 'up')}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === fields.length - 1}
                          onClick={() => handleMoveField(idx, 'down')}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditField(idx)}
                          className="p-1 text-muted-foreground hover:text-primary"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteField(idx)}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SYNTHETIC LIVE PREVIEW */}
      <Card>
        <CardHeader className="border-b border-border py-4 flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Simulated Output Verification (How Citizen will see it)</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs">DEMO WATERMARK ACTIVE</Badge>
        </CardHeader>
        <CardContent className="pt-6 bg-muted/30 flex justify-center p-4 overflow-x-auto">
          <style dangerouslySetInnerHTML={{ __html: getDocumentStyles() }} />
          <div
            className="bg-paper shadow-md border border-border p-8 max-w-[210mm] w-full min-h-[400px]"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </CardContent>
      </Card>

      {/* FIELD MODAL */}
      {showFieldModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-primary">
                {editingFieldIndex !== null ? 'Edit Field' : 'Add Field'}
              </h3>
              <button onClick={() => setShowFieldModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {fieldModalError && <Alert variant="destructive" title="Error">{fieldModalError}</Alert>}

            <form onSubmit={handleSaveFieldModal} className="space-y-4">
              <Input
                label="Key (camelCase)"
                required
                value={modalKey}
                onChange={(e) => setModalKey(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                placeholder="e.g. rationCardNumber"
              />

              <Input
                label="Label (English)"
                required
                value={modalLabel}
                onChange={(e) => setModalLabel(e.target.value)}
                placeholder="e.g. Ration Card Number"
              />

              <Input
                label="Label (Gujarati)"
                value={modalLabelGu}
                onChange={(e) => setModalLabelGu(e.target.value)}
                placeholder="દા.ત. રેશન કાર્ડ નંબર"
              />

              <Select
                label="Type"
                value={modalType}
                onChange={(e) => setModalType(e.target.value as any)}
                options={[
                  { value: 'text', label: 'Short Text' },
                  { value: 'textarea', label: 'Long Text' },
                  { value: 'date', label: 'Date' },
                  { value: 'number', label: 'Number' },
                ]}
              />

              <Checkbox
                id="modal-req-toggle"
                label="Mandatory Field"
                checked={modalRequired}
                onChange={(e) => setModalRequired(e.target.checked)}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowFieldModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">Save Field</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
