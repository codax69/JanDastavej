import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Shield, LogOut, Eye, ArrowLeft, Trash2, Search, Filter, AlertTriangle, X } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Input } from '../../components/ui/Input.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { Select } from '../../components/ui/Select.js';
import { Alert } from '../../components/ui/Alert.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export function AdminTemplatesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Template Form State
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [titleGu, setTitleGu] = useState('');
  const [category, setCategory] = useState('declaration');
  const [description, setDescription] = useState('');
  const [descriptionGu, setDescriptionGu] = useState('');
  const [purpose, setPurpose] = useState('');
  const [purposeGu, setPurposeGu] = useState('');
  const [layoutKey, setLayoutKey] = useState('sample_declaration');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/admin/templates`, {
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) {
          navigate('/admin/login');
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to load templates');
      }
      return res.json();
    },
  });

  const handleLogout = async () => {
    await fetch(`${API_BASE}/admin/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    navigate('/admin/login');
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/admin/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          slug: slug.trim(),
          title: title.trim(),
          titleGu: titleGu.trim(),
          category,
          description: description.trim() || title.trim(),
          descriptionGu: descriptionGu.trim() || titleGu.trim(),
          purpose: purpose.trim(),
          purposeGu: purposeGu.trim(),
          layoutKey,
          fields: [
            { key: 'fullName', label: 'Full Name', labelGu: 'પૂર્ણ નામ', type: 'text', required: true, maxLength: 120 },
            { key: 'address', label: 'Residential Address', labelGu: 'સરનામું', type: 'textarea', required: true, maxLength: 500 },
            { key: 'declarationDate', label: 'Date', labelGu: 'તારીખ', type: 'date', required: true },
            { key: 'place', label: 'Place', labelGu: 'સ્થળ', type: 'text', required: true, maxLength: 100 },
          ],
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || 'Failed to create template.');
      }

      setShowCreateModal(false);
      // Reset form
      setSlug('');
      setTitle('');
      setTitleGu('');
      setDescription('');
      setDescriptionGu('');
      setPurpose('');
      setPurposeGu('');
      refetch();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    try {
      const res = await fetch(`${API_BASE}/admin/templates/${templateToDelete._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error?.message || 'Failed to delete template');
      }
      setTemplateToDelete(null);
      refetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRetireTemplate = async (tplId: string) => {
    if (!confirm('Are you sure you want to retire this template? Users will no longer see it as active.')) return;
    try {
      await fetch(`${API_BASE}/admin/templates/${tplId}/retire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Retired from admin panel' }),
      });
      refetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const templates = data?.data || [];

  const filteredTemplates = useMemo(() => {
    return templates.filter((t: any) => {
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.titleGu.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [templates, categoryFilter, search]);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Exit to Citizen Portal</span>
        </Link>
        <span className="text-xs text-muted-foreground">Admin: admin@jandastavej.local</span>
      </div>

      {/* Admin Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-5 rounded-lg border border-border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-primary tracking-tight">Template Administration</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Collector Office Gandhinagar · Complete CRUD for Document Formats & Schema Lifecycle
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/admin/audit">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Shield className="h-4 w-4" />
              <span>Audit Log</span>
            </Button>
          </Link>

          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-lg border border-border">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full h-9 pl-9 pr-3 text-xs rounded-md border border-input bg-background focus-visible:outline-2 focus-visible:outline-ring"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-input bg-background font-medium"
          >
            <option value="all">All Categories</option>
            <option value="declaration">Declarations</option>
            <option value="affidavit">Affidavits</option>
            <option value="certificate_support">Certificate Support</option>
            <option value="revenue_service">Revenue Service</option>
            <option value="general">General</option>
          </select>
        </div>

        <Button size="sm" onClick={() => setShowCreateModal(true)} className="gap-1.5 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          <span>Create New Template</span>
        </Button>
      </div>

      {/* Templates Table Card */}
      <Card>
        <CardHeader className="border-b border-border py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">
              Document Templates Registry ({filteredTemplates.length})
            </CardTitle>
            <span className="text-xs text-muted-foreground">Drafts & Published Formats</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Loading template registry...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No templates found matching filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Template Name</th>
                    <th className="px-5 py-3.5">Slug</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Current Status</th>
                    <th className="px-5 py-3.5">Lifecycle</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTemplates.map((tpl: any) => {
                    const status = tpl.latestVersionStatus || 'draft';
                    const isRetired = tpl.status === 'retired';
                    const statusBadgeVariant = isRetired
                      ? 'outline'
                      : status === 'published'
                      ? 'success'
                      : status === 'in_review'
                      ? 'secondary'
                      : status === 'approved'
                      ? 'success'
                      : status === 'rejected'
                      ? 'destructive'
                      : 'outline';

                    return (
                      <tr key={tpl._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-foreground text-sm">{tpl.title}</div>
                          <div className="text-xs text-muted-foreground">{tpl.titleGu}</div>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground">{tpl.slug}</td>
                        <td className="px-5 py-3.5 capitalize text-xs text-muted-foreground">
                          {tpl.category.replace('_', ' ')}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={statusBadgeVariant as any} className="capitalize text-xs">
                            {isRetired ? 'Retired' : status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          v{tpl.currentVersionNumber || 1} · {tpl.versionsCount || 1} ver.
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link to={`/admin/templates/${tpl._id}`}>
                              <Button variant="outline" size="sm" className="gap-1 text-xs h-8 px-2.5">
                                <Eye className="h-3.5 w-3.5" />
                                <span>Edit / View</span>
                              </Button>
                            </Link>

                            {!isRetired && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRetireTemplate(tpl._id)}
                                className="text-xs text-muted-foreground hover:text-warning h-8 px-2"
                                title="Retire template"
                              >
                                Retire
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setTemplateToDelete(tpl)}
                              className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
                              title="Delete template"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-lg max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-primary">Create New Document Template</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && <Alert variant="destructive" title="Error">{formError}</Alert>}

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Identifier Slug (URL)"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="e.g. sample-income-affidavit"
                  helpText="Alphanumeric with hyphens only"
                />

                <Select
                  label="Document Category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={[
                    { value: 'declaration', label: 'Self Declaration' },
                    { value: 'affidavit', label: 'Affidavit' },
                    { value: 'certificate_support', label: 'Certificate Support' },
                    { value: 'revenue_service', label: 'Revenue Service' },
                    { value: 'general', label: 'General' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Title (English)"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. General Income Declaration"
                />

                <Input
                  label="Title (Gujarati)"
                  required
                  value={titleGu}
                  onChange={(e) => setTitleGu(e.target.value)}
                  placeholder="દા.ત. સામાન્ય આવક અંગેનું એકરારનામું"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Textarea
                  label="Description (English)"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of document purpose"
                />

                <Textarea
                  label="Description (Gujarati)"
                  rows={2}
                  value={descriptionGu}
                  onChange={(e) => setDescriptionGu(e.target.value)}
                  placeholder="દસ્તાવેજના ઉપયોગ અંગે સંક્ષિપ્ત વિગત"
                />
              </div>

              <Select
                label="Layout Style Key"
                value={layoutKey}
                onChange={(e) => setLayoutKey(e.target.value)}
                options={[
                  { value: 'sample_declaration', label: 'Standard Declaration Layout' },
                  { value: 'sample_affidavit', label: 'Sworn Affidavit Layout' },
                  { value: 'sample_address_declaration', label: 'Address Verification Layout' },
                ]}
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Draft...' : 'Create Template Draft'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Delete Template Permanently?</span>
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete template <strong className="text-foreground">{templateToDelete.title}</strong> ({templateToDelete.slug})?
              All associated versions and drafts will be deleted.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setTemplateToDelete(null)}>
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
