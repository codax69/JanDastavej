import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Search,
  Filter,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Layers,
  Shield,
  FileText,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export function AdminSubmissionsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-submissions', statusFilter],
    queryFn: async () => {
      const url =
        statusFilter === 'all'
          ? `${API_BASE}/admin/submissions`
          : `${API_BASE}/admin/submissions?status=${statusFilter}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) navigate('/admin/login');
        throw new Error('Failed to load submissions');
      }
      return res.json();
    },
  });

  const submissions = data?.data || [];

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s: any) => {
      const q = search.toLowerCase().trim();
      return (
        !q ||
        s.documentTitle?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.submitterName?.toLowerCase().includes(q)
      );
    });
  }, [submissions, search]);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/templates"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Template Registry</span>
        </Link>
        <span className="text-xs text-muted-foreground">Admin Portal · AI Submissions</span>
      </div>

      {/* Admin Nav Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-5 rounded-lg border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" className="gap-1 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Ingestion Queue</span>
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
            Citizen Document Submissions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review AI-extracted formats, inspect field schemas, and approve to publish directly to citizens.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/templates">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              <span>Templates</span>
            </Button>
          </Link>
          <Link to="/admin/audit">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5" />
              <span>Audit Log</span>
            </Button>
          </Link>
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
              placeholder="Search submissions..."
              className="w-full h-9 pl-9 pr-3 text-xs rounded-md border border-input bg-background focus-visible:outline-2 focus-visible:outline-ring"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-input bg-background font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="scanned">Scanned (Pending Review)</option>
            <option value="approved">Approved & Published</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <Link to="/submit-format">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs w-full sm:w-auto">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Test Citizen Submission</span>
          </Button>
        </Link>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="border-b border-border py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>Submissions Pipeline ({filteredSubmissions.length})</span>
            </CardTitle>
            <span className="text-xs text-muted-foreground">Sorted by recent submission</span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Loading submissions...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No submissions found matching criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Document Title</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">AI Scan & Confidence</th>
                    <th className="px-5 py-3.5">Submitter</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSubmissions.map((sub: any) => {
                    const scan = sub.aiScanResult;
                    const isApproved = sub.status === 'approved';
                    const isRejected = sub.status === 'rejected';

                    return (
                      <tr key={sub._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-foreground text-sm">{sub.documentTitle}</div>
                          {scan?.detectedTitleGu && (
                            <div className="text-xs text-muted-foreground font-gujarati">{scan.detectedTitleGu}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 capitalize text-xs text-muted-foreground">
                          {sub.category || scan?.detectedCategory || 'general'}
                        </td>
                        <td className="px-5 py-3.5">
                          {scan ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="text-[11px] font-mono">
                                {scan.confidenceScore}% match
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {scan.extractedFields?.length || 0} fields
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Scanning...</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          <div>{sub.submitterName || 'Public Citizen'}</div>
                          {sub.submitterEmail && <div className="text-[11px] opacity-75">{sub.submitterEmail}</div>}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={isApproved ? 'success' : isRejected ? 'destructive' : 'warning'}
                            className="capitalize text-xs"
                          >
                            {isApproved ? 'Approved & Published' : isRejected ? 'Rejected' : 'Pending Review'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link to={`/admin/submissions/${sub._id}`}>
                            <Button size="sm" variant={isApproved ? 'outline' : 'primary'} className="gap-1 text-xs h-8">
                              <Eye className="h-3.5 w-3.5" />
                              <span>{isApproved ? 'View Published' : 'Review & Approve'}</span>
                            </Button>
                          </Link>
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
    </div>
  );
}
