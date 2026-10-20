import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Send,
  Globe,
  Shield,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Save,
  Layers,
  Settings,
  AlertTriangle,
  X,
  FileText,
  Eye,
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

export function AdminTemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'fields' | 'metadata' | 'preview'>('fields');

  // Selected Version ID
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Status feedback
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Template Confirmation Modal
  const [showDeleteTemplateModal, setShowDeleteTemplateModal] = useState(false);

  // Template Metadata Form State
  const [metaTitle, setMetaTitle] = useState('');
  const [metaTitleGu, setMetaTitleGu] = useState('');
  const [metaCategory, setMetaCategory] = useState('declaration');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaDescriptionGu, setMetaDescriptionGu] = useState('');
  const [metaPurpose, setMetaPurpose] = useState('');
  const [metaPurposeGu, setMetaPurposeGu] = useState('');
  const [metaRequiredDocs, setMetaRequiredDocs] = useState('');
  const [metaNextSteps, setMetaNextSteps] = useState('');
  const [metaNextStepsGu, setMetaNextStepsGu] = useState('');

  // Version Fields State
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [layoutKey, setLayoutKey] = useState('sample_declaration');
  const [sourceReference, setSourceReference] = useState('');

  // Field Edit/Add Modal State
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [fieldModalError, setFieldModalError] = useState<string | null>(null);

  // Field Modal Inputs
  const [fieldKey, setFieldKey] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldLabelGu, setFieldLabelGu] = useState('');
  const [fieldType, setFieldType] = useState<TemplateField['type']>('text');
  const [fieldRequired, setFieldRequired] = useState(true);
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldPlaceholderGu, setFieldPlaceholderGu] = useState('');
  const [fieldHelpText, setFieldHelpText] = useState('');
  const [fieldHelpTextGu, setFieldHelpTextGu] = useState('');
  const [fieldMaxLength, setFieldMaxLength] = useState<number>(200);
  const [fieldMinLength, setFieldMinLength] = useState<number>(0);
  const [fieldOptions, setFieldOptions] = useState<Array<{ value: string; label: string; labelGu?: string }>>([]);
  const [newOptValue, setNewOptValue] = useState('');
  const [newOptLabel, setNewOptLabel] = useState('');
  const [newOptLabelGu, setNewOptLabelGu] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-template-detail', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/admin/templates/${id}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) navigate('/admin/login');
        throw new Error('Failed to load template');
      }
      return res.json();
    },
    enabled: !!id,
  });

  const template = data?.data?.template;
  const versions: any[] = data?.data?.versions || [];

  // Currently active version object
  const currentVersion =
    versions.find((v) => v._id === selectedVersionId) || versions[0] || null;

  // Initialize form states when template/version loads
  useEffect(() => {
    if (template) {
      setMetaTitle(template.title || '');
      setMetaTitleGu(template.titleGu || '');
      setMetaCategory(template.category || 'declaration');
      setMetaDescription(template.description || '');
      setMetaDescriptionGu(template.descriptionGu || '');
      setMetaPurpose(template.purpose || '');
      setMetaPurposeGu(template.purposeGu || '');
      setMetaRequiredDocs(
        Array.isArray(template.requiredDocuments) ? template.requiredDocuments.join(', ') : ''
      );
      setMetaNextSteps(template.nextSteps || '');
      setMetaNextStepsGu(template.nextStepsGu || '');
    }
  }, [template]);

  useEffect(() => {
    if (currentVersion) {
      setFields(currentVersion.fields || []);
      setLayoutKey(currentVersion.layoutKey || 'sample_declaration');
      setSourceReference(currentVersion.sourceReference || '');
      if (!selectedVersionId) {
        setSelectedVersionId(currentVersion._id);
      }
    }
  }, [currentVersion, selectedVersionId]);

  const isVersionEditable =
    currentVersion && (currentVersion.status === 'draft' || currentVersion.status === 'rejected');

  // Lifecycle Transitions
  const handleTransition = async (actionUrl: string, method = 'POST', body?: any) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(actionUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || 'Action failed.');
      }
      setActionSuccess('Lifecycle transition successful.');
      refetch();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Save Template Metadata (PATCH /admin/templates/:id)
  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setIsSaving(true);

    try {
      const reqDocsList = metaRequiredDocs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`${API_BASE}/admin/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: metaTitle.trim(),
          titleGu: metaTitleGu.trim(),
          category: metaCategory,
          description: metaDescription.trim(),
          descriptionGu: metaDescriptionGu.trim(),
          purpose: metaPurpose.trim(),
          purposeGu: metaPurposeGu.trim(),
          requiredDocuments: reqDocsList,
          nextSteps: metaNextSteps.trim(),
          nextStepsGu: metaNextStepsGu.trim(),
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error?.message || 'Failed to update metadata.');

      setActionSuccess('Template metadata updated successfully.');
      refetch();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Fields to Draft Version (PATCH /admin/template-versions/:id)
  const handleSaveFields = async () => {
    if (!currentVersion) return;
    setActionError(null);
    setActionSuccess(null);
    setIsSaving(true);

    try {
      const res = await fetch(`${API_BASE}/admin/template-versions/${currentVersion._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fields,
          layoutKey,
          sourceReference,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error?.message || 'Failed to update version fields.');

      setActionSuccess(`Version ${currentVersion.version} schema saved successfully.`);
      refetch();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Create New Version (POST /admin/templates/:id/versions)
  const handleCreateNewVersion = async () => {
    if (!confirm('Create a new draft version based on current schema?')) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/admin/templates/${id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fields,
          layoutKey,
          sourceReference,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error?.message || 'Failed to create new version.');

      setActionSuccess(`Draft Version ${resData.data.version} created! You can now edit its fields.`);
      setSelectedVersionId(resData.data._id);
      refetch();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Delete Draft Version (DELETE /admin/template-versions/:id)
  const handleDeleteVersion = async () => {
    if (!currentVersion) return;
    if (!confirm(`Are you sure you want to delete draft version ${currentVersion.version}?`)) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/admin/template-versions/${currentVersion._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error?.message || 'Failed to delete version.');

      setActionSuccess(`Version ${currentVersion.version} deleted.`);
      setSelectedVersionId(null);
      refetch();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Delete Entire Template (DELETE /admin/templates/:id)
  const handleDeleteTemplate = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/templates/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error?.message || 'Failed to delete template.');

      navigate('/admin/templates');
    } catch (err: any) {
      setActionError(err.message);
      setShowDeleteTemplateModal(false);
    }
  };

  // Open Add Field Modal
  const handleOpenAddField = () => {
    setEditingFieldIndex(null);
    setFieldKey('');
    setFieldLabel('');
    setFieldLabelGu('');
    setFieldType('text');
    setFieldRequired(true);
    setFieldPlaceholder('');
    setFieldPlaceholderGu('');
    setFieldHelpText('');
    setFieldHelpTextGu('');
    setFieldMaxLength(200);
    setFieldMinLength(0);
    setFieldOptions([]);
    setFieldModalError(null);
    setShowFieldModal(true);
  };

  // Open Edit Field Modal
  const handleOpenEditField = (index: number) => {
    const f = fields[index];
    if (!f) return;
    setEditingFieldIndex(index);
    setFieldKey(f.key);
    setFieldLabel(f.label);
    setFieldLabelGu(f.labelGu || '');
    setFieldType(f.type);
    setFieldRequired(f.required !== false);
    setFieldPlaceholder(f.placeholder || '');
    setFieldPlaceholderGu(f.placeholderGu || '');
    setFieldHelpText(f.helpText || '');
    setFieldHelpTextGu(f.helpTextGu || '');
    setFieldMaxLength(f.maxLength || 200);
    setFieldMinLength(f.minLength || 0);
    setFieldOptions(f.options ? [...f.options] : []);
    setFieldModalError(null);
    setShowFieldModal(true);
  };

  // Save Field from Modal
  const handleSaveFieldModal = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldModalError(null);

    // Validate key
    const trimmedKey = fieldKey.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(trimmedKey)) {
      setFieldModalError('Field key must be camelCase alphanumeric starting with a letter (e.g. occupationType).');
      return;
    }

    if (!fieldLabel.trim()) {
      setFieldModalError('English label is required.');
      return;
    }

    // Check duplicate key
    const duplicate = fields.some((f, idx) => f.key === trimmedKey && idx !== editingFieldIndex);
    if (duplicate) {
      setFieldModalError(`A field with key '${trimmedKey}' already exists.`);
      return;
    }

    const updatedField: TemplateField = {
      key: trimmedKey,
      label: fieldLabel.trim(),
      labelGu: fieldLabelGu.trim() || undefined,
      type: fieldType,
      required: fieldRequired,
      placeholder: fieldPlaceholder.trim() || undefined,
      placeholderGu: fieldPlaceholderGu.trim() || undefined,
      helpText: fieldHelpText.trim() || undefined,
      helpTextGu: fieldHelpTextGu.trim() || undefined,
      maxLength: fieldMaxLength || 200,
      minLength: fieldMinLength || 0,
      options: ['select', 'radio'].includes(fieldType) && fieldOptions.length > 0 ? fieldOptions : undefined,
    };

    if (editingFieldIndex !== null) {
      const nextFields = [...fields];
      nextFields[editingFieldIndex] = updatedField;
      setFields(nextFields);
    } else {
      setFields([...fields, updatedField]);
    }

    setShowFieldModal(false);
  };

  // Delete Field
  const handleDeleteField = (index: number) => {
    if (!confirm(`Delete field '${fields[index].label}'?`)) return;
    setFields(fields.filter((_, idx) => idx !== index));
  };

  // Reorder Fields
  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const nextFields = [...fields];
    const temp = nextFields[index];
    nextFields[index] = nextFields[targetIndex];
    nextFields[targetIndex] = temp;
    setFields(nextFields);
  };

  // Option Builder helpers
  const handleAddOption = () => {
    if (!newOptValue.trim() || !newOptLabel.trim()) return;
    setFieldOptions([
      ...fieldOptions,
      {
        value: newOptValue.trim(),
        label: newOptLabel.trim(),
        labelGu: newOptLabelGu.trim() || undefined,
      },
    ]);
    setNewOptValue('');
    setNewOptLabel('');
    setNewOptLabelGu('');
  };

  const handleRemoveOption = (optIdx: number) => {
    setFieldOptions(fieldOptions.filter((_, idx) => idx !== optIdx));
  };

  if (isLoading || !template || !currentVersion) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Loading template editor...</div>;
  }

  // Synthetic preview answers generated from fields
  const sampleAnswers: Record<string, any> = {
    fullName: 'રમણલાલ ચતુરભાઈ શાહ',
    parentSpouseName: 'ચતુરભાઈ શાહ',
    age: 42,
    occupation: 'વેપાર',
    address: 'પ્લોટ નં. ૧૨, સેક્ટર-૨૧, ગાંધીનગર',
    declarationPurpose: 'વહીવટી ચકાસણી અને પ્રિવ્યૂ ટેસ્ટિંગ હેતુ માટે આ નકલી ડેટા છે.',
    declarationDate: '2026-10-20',
    place: 'ગાંધીનગર',
    deponentName: 'રમણલાલ ચતુરભાઈ શાહ',
    deponentAge: 42,
    deponentAddress: 'ગાંધીનગર',
    matterStated: 'સિન્થેટિક ટેસ્ટ નિવેદન',
    applicantName: 'રમણલાલ ચતુરભાઈ શાહ',
    currentAddress: 'ગાંધીનગર',
    residingSinceYears: 10,
    premisesType: 'owned',
  };

  // Inject any extra fields defined in the schema into sample answers
  fields.forEach((f) => {
    if (!sampleAnswers[f.key]) {
      sampleAnswers[f.key] = `[${f.label}]`;
    }
  });

  const syntheticPreviewHtml = renderDocumentHtml({
    layoutKey,
    language: currentVersion.language,
    answers: sampleAnswers,
    isDemoOnly: true,
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/templates"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Template Registry</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteTemplateModal(true)}
            className="gap-1 text-xs h-8"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Entire Template</span>
          </Button>
        </div>
      </div>

      {actionError && <Alert variant="destructive" title="Error">{actionError}</Alert>}
      {actionSuccess && <Alert variant="success" title="Success">{actionSuccess}</Alert>}

      {/* Header Info & Lifecycle Bar */}
      <Card>
        <CardHeader className="border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="secondary" className="capitalize text-xs">{template.category}</Badge>
              <Badge variant="outline" className="text-xs font-mono">{template.slug}</Badge>
              <Badge
                variant={
                  currentVersion.status === 'published'
                    ? 'success'
                    : currentVersion.status === 'rejected'
                    ? 'destructive'
                    : 'warning'
                }
                className="capitalize text-xs"
              >
                Version {currentVersion.version} · {currentVersion.status.replace('_', ' ')}
              </Badge>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black text-foreground">{template.title}</CardTitle>
            <p className="text-xs text-muted-foreground font-gujarati">{template.titleGu}</p>
          </div>

          {/* Version Switcher & Workflow Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Version Selector */}
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-md border border-border">
              <span className="text-xs font-semibold px-2 text-muted-foreground">Version:</span>
              <select
                value={currentVersion._id}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="h-7 text-xs bg-background border border-input rounded px-2 font-medium"
              >
                {versions.map((v) => (
                  <option key={v._id} value={v._id}>
                    v{v.version} ({v.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Create New Version Button (available when current is published or whenever needed) */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateNewVersion}
              className="gap-1 text-xs h-8"
              title="Create new draft version to edit fields"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Version</span>
            </Button>

            {/* Delete Version Button (only for draft / rejected) */}
            {isVersionEditable && versions.length > 1 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDeleteVersion}
                className="text-xs text-destructive hover:bg-destructive/10 h-8"
                title="Delete this draft version"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* Workflow Action Transitions */}
            {currentVersion.status === 'draft' && (
              <Button
                size="sm"
                onClick={() =>
                  handleTransition(
                    `${API_BASE}/admin/template-versions/${currentVersion._id}/submit-review`
                  )
                }
                className="gap-1.5 text-xs h-8"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit Review</span>
              </Button>
            )}

            {currentVersion.status === 'in_review' && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    handleTransition(
                      `${API_BASE}/admin/template-versions/${currentVersion._id}/approve`
                    )
                  }
                  className="gap-1.5 text-xs h-8"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Approve</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    const reason = prompt('Enter rejection reason:');
                    if (reason) {
                      handleTransition(
                        `${API_BASE}/admin/template-versions/${currentVersion._id}/reject`,
                        'POST',
                        { reason }
                      );
                    }
                  }}
                  className="gap-1.5 text-xs h-8"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </Button>
              </>
            )}

            {currentVersion.status === 'approved' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  handleTransition(
                    `${API_BASE}/admin/template-versions/${currentVersion._id}/publish`
                  )
                }
                className="gap-1.5 text-xs h-8"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Publish to Citizens</span>
              </Button>
            )}

            {currentVersion.status === 'published' && (
              <span className="text-xs text-success font-semibold flex items-center gap-1 bg-success/10 px-2 py-1 rounded border border-success/30">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Published</span>
              </span>
            )}
          </div>
        </CardHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-muted/20 px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('fields')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'fields'
                ? 'border-primary text-primary bg-background'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Form Fields Schema ({fields.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('metadata')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'metadata'
                ? 'border-primary text-primary bg-background'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Template Metadata & Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-primary text-primary bg-background'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>Live Document Preview</span>
          </button>
        </div>
      </Card>

      {/* TAB 1: FORM FIELDS SCHEMA CRUD */}
      {activeTab === 'fields' && (
        <Card>
          <CardHeader className="border-b border-border py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span>Document Input Fields (Version {currentVersion.version})</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Define the schema of citizen input questions, types, validation, and order.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isVersionEditable ? (
                <>
                  <Button size="sm" onClick={handleOpenAddField} className="gap-1.5 text-xs h-8">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Field</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleSaveFields}
                    disabled={isSaving}
                    className="gap-1.5 text-xs h-8"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Schema'}</span>
                  </Button>
                </>
              ) : (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded border border-border">
                  Published versions are immutable. Click <strong>"New Version"</strong> above to edit fields.
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {fields.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No fields defined in this schema. Click "Add Field" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Key (Variable)</th>
                      <th className="px-4 py-3">Label (English / Gujarati)</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Constraints</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fields.map((f, idx) => (
                      <tr key={f.key + idx} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{f.key}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-xs text-foreground">{f.label}</div>
                          {f.labelGu && (
                            <div className="text-xs text-muted-foreground font-gujarati">{f.labelGu}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize text-xs font-mono">
                            {f.type}
                          </Badge>
                          {f.options && (
                            <span className="ml-1 text-[11px] text-muted-foreground">
                              ({f.options.length} options)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant={f.required ? 'secondary' : 'outline'} className="text-[11px]">
                              {f.required ? 'Required' : 'Optional'}
                            </Badge>
                            {f.maxLength && (
                              <span className="text-[11px] text-muted-foreground">Max: {f.maxLength}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isVersionEditable && (
                              <>
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveField(idx, 'up')}
                                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                  title="Move Up"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === fields.length - 1}
                                  onClick={() => handleMoveField(idx, 'down')}
                                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                  title="Move Down"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditField(idx)}
                                  className="p-1 text-muted-foreground hover:text-primary"
                                  title="Edit Field"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteField(idx)}
                                  className="p-1 text-muted-foreground hover:text-destructive"
                                  title="Delete Field"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: TEMPLATE METADATA & GUIDELINES */}
      {activeTab === 'metadata' && (
        <Card>
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <span>Template General Configuration & Information</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Configure titles, category, citizen instructions, and required supporting documents.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveMetadata} className="space-y-4 max-w-4xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Title (English)"
                  required
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />

                <Input
                  label="Title (Gujarati)"
                  required
                  value={metaTitleGu}
                  onChange={(e) => setMetaTitleGu(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Document Category"
                  required
                  value={metaCategory}
                  onChange={(e) => setMetaCategory(e.target.value)}
                  options={[
                    { value: 'declaration', label: 'Self Declaration' },
                    { value: 'affidavit', label: 'Affidavit' },
                    { value: 'certificate_support', label: 'Certificate Support' },
                    { value: 'revenue_service', label: 'Revenue Service' },
                    { value: 'general', label: 'General' },
                  ]}
                />

                <Input
                  label="Required Documents (Comma-separated)"
                  value={metaRequiredDocs}
                  onChange={(e) => setMetaRequiredDocs(e.target.value)}
                  placeholder="e.g. Aadhaar Card, Ration Card, Light Bill"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Textarea
                  label="Description (English)"
                  rows={2}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                />

                <Textarea
                  label="Description (Gujarati)"
                  rows={2}
                  value={metaDescriptionGu}
                  onChange={(e) => setMetaDescriptionGu(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Textarea
                  label="Purpose of Document (English)"
                  rows={2}
                  value={metaPurpose}
                  onChange={(e) => setMetaPurpose(e.target.value)}
                  placeholder="When and where citizens use this document"
                />

                <Textarea
                  label="Purpose of Document (Gujarati)"
                  rows={2}
                  value={metaPurposeGu}
                  onChange={(e) => setMetaPurposeGu(e.target.value)}
                  placeholder="આ દસ્તાવેજનો ક્યાં અને કયા હેતુ માટે ઉપયોગ થાય છે"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Textarea
                  label="Next Steps / Citizen Instructions (English)"
                  rows={2}
                  value={metaNextSteps}
                  onChange={(e) => setMetaNextSteps(e.target.value)}
                  placeholder="What to do after printing (notary, submission, etc.)"
                />

                <Textarea
                  label="Next Steps / Citizen Instructions (Gujarati)"
                  rows={2}
                  value={metaNextStepsGu}
                  onChange={(e) => setMetaNextStepsGu(e.target.value)}
                  placeholder="પ્રિન્ટ કર્યા પછી આગળની કાર્યવાહી"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button type="submit" size="sm" disabled={isSaving} className="gap-1.5">
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Template Metadata'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: DOCUMENT LAYOUT & LIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>Layout Style & Source Reference</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Select the underlying government legal format engine and official notification source.
                </p>
              </div>

              {isVersionEditable && (
                <Button size="sm" variant="primary" onClick={handleSaveFields} disabled={isSaving} className="gap-1.5 text-xs h-8">
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
                <Select
                  label="Layout Engine Key"
                  value={layoutKey}
                  disabled={!isVersionEditable}
                  onChange={(e) => setLayoutKey(e.target.value)}
                  options={[
                    { value: 'sample_declaration', label: 'Standard Declaration Layout' },
                    { value: 'sample_affidavit', label: 'Sworn Affidavit Layout' },
                    { value: 'sample_address_declaration', label: 'Address Verification Layout' },
                  ]}
                />

                <Input
                  label="Source Official Reference"
                  disabled={!isVersionEditable}
                  value={sourceReference}
                  onChange={(e) => setSourceReference(e.target.value)}
                  placeholder="Collector Office, Gandhinagar - Standard Prototype Format"
                />
              </div>
            </CardContent>
          </Card>

          {/* Synthetic Document Render Container */}
          <Card>
            <CardHeader className="border-b border-border py-4 flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Simulated Output Verification</span>
              </CardTitle>
              <Badge variant="outline" className="text-xs">DEMO WATERMARK ACTIVE</Badge>
            </CardHeader>
            <CardContent className="pt-6 bg-muted/40 flex justify-center p-4 overflow-x-auto">
              <style dangerouslySetInnerHTML={{ __html: getDocumentStyles() }} />
              <div
                className="bg-paper shadow-lg border border-border p-8 max-w-[210mm] w-full min-h-[500px]"
                dangerouslySetInnerHTML={{ __html: syntheticPreviewHtml }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* FIELD ADD/EDIT MODAL DIALOG */}
      {showFieldModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-lg max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-primary">
                {editingFieldIndex !== null ? 'Edit Field Definition' : 'Add New Input Field'}
              </h3>
              <button
                type="button"
                onClick={() => setShowFieldModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {fieldModalError && <Alert variant="destructive" title="Validation Error">{fieldModalError}</Alert>}

            <form onSubmit={handleSaveFieldModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Variable Key (camelCase)"
                  required
                  value={fieldKey}
                  onChange={(e) => setFieldKey(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  placeholder="e.g. occupationType"
                  helpText="Alphanumeric identifier starting with letter"
                />

                <Select
                  label="Field Type"
                  required
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as any)}
                  options={[
                    { value: 'text', label: 'Short Text' },
                    { value: 'textarea', label: 'Long Text (Textarea)' },
                    { value: 'date', label: 'Date' },
                    { value: 'number', label: 'Number' },
                    { value: 'select', label: 'Dropdown (Select)' },
                    { value: 'radio', label: 'Radio Buttons' },
                    { value: 'checkbox', label: 'Checkbox' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Label (English)"
                  required
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  placeholder="e.g. Occupation Type"
                />

                <Input
                  label="Label (Gujarati)"
                  value={fieldLabelGu}
                  onChange={(e) => setFieldLabelGu(e.target.value)}
                  placeholder="દા.ત. વ્યવસાયનો પ્રકાર"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Placeholder (English)"
                  value={fieldPlaceholder}
                  onChange={(e) => setFieldPlaceholder(e.target.value)}
                  placeholder="e.g. Enter your current occupation"
                />

                <Input
                  label="Placeholder (Gujarati)"
                  value={fieldPlaceholderGu}
                  onChange={(e) => setFieldPlaceholderGu(e.target.value)}
                  placeholder="દા.ત. તમારો વ્યવસાય દાખલ કરો"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Help Text (English)"
                  value={fieldHelpText}
                  onChange={(e) => setFieldHelpText(e.target.value)}
                  placeholder="Guidance for citizen"
                />

                <Input
                  label="Help Text (Gujarati)"
                  value={fieldHelpTextGu}
                  onChange={(e) => setFieldHelpTextGu(e.target.value)}
                  placeholder="નાગરિક માટે માર્ગદર્શન"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <Input
                  label="Max Character Length"
                  type="number"
                  value={fieldMaxLength}
                  onChange={(e) => setFieldMaxLength(parseInt(e.target.value, 10) || 200)}
                />

                <div className="pt-5">
                  <Checkbox
                    id="field-required-toggle"
                    label="Mandatory / Required Field"
                    checked={fieldRequired}
                    onChange={(e) => setFieldRequired(e.target.checked)}
                  />
                </div>
              </div>

              {/* Options Builder for Select / Radio */}
              {['select', 'radio'].includes(fieldType) && (
                <div className="space-y-3 p-3 bg-muted/40 rounded-md border border-border">
                  <span className="text-xs font-bold text-foreground">Options List ({fieldOptions.length})</span>

                  {fieldOptions.length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {fieldOptions.map((opt, optIdx) => (
                        <div
                          key={opt.value + optIdx}
                          className="flex items-center justify-between text-xs bg-background p-2 rounded border border-border"
                        >
                          <div>
                            <span className="font-mono font-semibold">{opt.value}</span> ·{' '}
                            <span>{opt.label}</span>{' '}
                            {opt.labelGu && <span className="text-muted-foreground font-gujarati">({opt.labelGu})</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(optIdx)}
                            className="text-destructive hover:opacity-75"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                    <input
                      type="text"
                      placeholder="Value (code)"
                      value={newOptValue}
                      onChange={(e) => setNewOptValue(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      className="h-8 px-2 text-xs rounded border border-input bg-background font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Label (EN)"
                      value={newOptLabel}
                      onChange={(e) => setNewOptLabel(e.target.value)}
                      className="h-8 px-2 text-xs rounded border border-input bg-background"
                    />
                    <input
                      type="text"
                      placeholder="Label (GU)"
                      value={newOptLabelGu}
                      onChange={(e) => setNewOptLabelGu(e.target.value)}
                      className="h-8 px-2 text-xs rounded border border-input bg-background font-gujarati"
                    />
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddOption} className="text-xs h-7 w-full">
                    + Add Option to List
                  </Button>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowFieldModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  {editingFieldIndex !== null ? 'Update Field' : 'Insert Field'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE TEMPLATE MODAL */}
      {showDeleteTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Delete Entire Document Template?</span>
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete template <strong className="text-foreground">{template.title}</strong> ({template.slug})?
              All versions, audit entries, and draft definitions will be permanently removed.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteTemplateModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteTemplate}>
                Yes, Delete Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
