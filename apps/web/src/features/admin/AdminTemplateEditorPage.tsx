import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle, Send, Globe, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Alert } from '../../components/ui/Alert.js';
import { renderDocumentHtml, getDocumentStyles } from '@jandastavej/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export function AdminTemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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
  const versions = data?.data?.versions || [];
  const currentVersion = versions[0]; // latest version

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
      setActionSuccess('Status updated successfully.');
      refetch();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  if (isLoading || !template || !currentVersion) {
    return <div className="p-8 text-center text-muted-foreground">Loading template editor...</div>;
  }

  // Synthetic test preview
  const syntheticPreviewHtml = renderDocumentHtml({
    layoutKey: currentVersion.layoutKey,
    language: currentVersion.language,
    answers: {
      fullName: 'રમણલાલ ચતુરભાઈ શાહ (Synthetic Test)',
      parentSpouseName: 'ચતુરભાઈ શાહ',
      age: 42,
      occupation: 'વેપાર',
      address: 'ગાંધીનગર (ટેસ્ટ સરનામું)',
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
    },
    isDemoOnly: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/templates"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Templates</span>
        </Link>
      </div>

      {actionError && <Alert variant="destructive" title="Lifecycle Action Failed">{actionError}</Alert>}
      {actionSuccess && <Alert variant="success" title="Success">{actionSuccess}</Alert>}

      {/* Header Info & Lifecycle Control */}
      <Card>
        <CardHeader className="border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="capitalize text-xs">{template.category}</Badge>
              <Badge variant="outline" className="text-xs">Version {currentVersion.version}</Badge>
              <Badge variant={currentVersion.status === 'published' ? 'success' : 'warning'} className="capitalize text-xs">
                {currentVersion.status.replace('_', ' ')}
              </Badge>
            </div>
            <CardTitle className="text-xl sm:text-2xl">{template.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{template.slug} · {template.titleGu}</p>
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {currentVersion.status === 'draft' && (
              <Button
                size="sm"
                onClick={() =>
                  handleTransition(
                    `${API_BASE}/admin/template-versions/${currentVersion._id}/submit-review`
                  )
                }
                className="gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit for Review</span>
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
                  className="gap-1.5"
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
                  className="gap-1.5"
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
                className="gap-1.5"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Publish to Citizens</span>
              </Button>
            )}

            {currentVersion.status === 'published' && (
              <span className="text-xs text-success font-semibold flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span>Published & Public</span>
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-foreground">Source Reference:</span>{' '}
              <span className="text-muted-foreground">{currentVersion.sourceReference}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">Layout Key:</span>{' '}
              <span className="text-muted-foreground">{currentVersion.layoutKey}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Synthetic Preview Box */}
      <Card>
        <CardHeader className="border-b border-border flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Synthetic Data Preview (Verification before Publish)</span>
          </CardTitle>
          <span className="text-xs text-muted-foreground">Simulated with test answers</span>
        </CardHeader>
        <CardContent className="pt-6 bg-muted/30 flex justify-center p-4">
          <style dangerouslySetInnerHTML={{ __html: getDocumentStyles() }} />
          <div
            className="bg-paper shadow-md border border-border p-8 max-w-[210mm] w-full min-h-[400px]"
            dangerouslySetInnerHTML={{ __html: syntheticPreviewHtml }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
