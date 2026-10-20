import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export function AdminAuditPage() {
  const navigate = useNavigate();
  const [actionFilter, setActionFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', actionFilter],
    queryFn: async () => {
      const url =
        actionFilter !== 'all'
          ? `${API_BASE}/admin/audit-events?action=${actionFilter}`
          : `${API_BASE}/admin/audit-events`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) navigate('/admin/login');
        throw new Error('Failed to load audit history');
      }
      return res.json();
    },
  });

  const events = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/admin/templates"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Templates</span>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Audit Trail (Governance History)</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Immutable record of template transitions, approvals, publications, and administrative actions.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-muted-foreground">Filter:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-8 rounded border border-input bg-card px-2 text-xs"
            >
              <option value="all">All Actions</option>
              <option value="VERSION_PUBLISHED">Version Published</option>
              <option value="VERSION_APPROVED">Version Approved</option>
              <option value="VERSION_REJECTED">Version Rejected</option>
              <option value="ADMIN_LOGIN_SUCCESS">Admin Login</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading audit events...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Actor</th>
                    <th className="px-6 py-3">Entity Type</th>
                    <th className="px-6 py-3">Details / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {events.map((evt: any) => (
                    <tr key={evt._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <Badge
                          variant={
                            evt.action.includes('PUBLISHED') || evt.action.includes('APPROVED')
                              ? 'success'
                              : evt.action.includes('REJECTED') || evt.action.includes('FAILED')
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-[11px]"
                        >
                          {evt.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-xs text-foreground font-medium">
                        {evt.actorEmail || 'System / Automated'}
                      </td>
                      <td className="px-6 py-3 text-xs capitalize text-muted-foreground">
                        {evt.entityType.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-3 text-xs text-muted-foreground">
                        {evt.reason ? `Reason: ${evt.reason}` : evt.version ? `Version: ${evt.version}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
