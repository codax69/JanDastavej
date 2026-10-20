import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, FileText, Clock, Shield, LogOut, ArrowRight, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';

export function AdminTemplatesPage() {
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/v1/admin/templates', {
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
    await fetch('http://localhost:4000/api/v1/admin/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    navigate('/admin/login');
  };

  const templates = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Admin Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-lg border border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Template Administration</h1>
          <p className="text-xs text-muted-foreground">
            Manage versioned legal document schemas, review states, and publications
          </p>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Templates Table Card */}
      <Card>
        <CardHeader className="border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Controlled Templates ({templates.length})</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              const slug = prompt('Enter new template slug (e.g. sample-income-declaration):');
              if (slug) {
                fetch('http://localhost:4000/api/v1/admin/templates', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    slug: slug.trim(),
                    title: 'New Declaration Template',
                    titleGu: 'નવું ઘોષણાપત્ર',
                    category: 'declaration',
                  }),
                }).then(() => refetch());
              }
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Create Draft</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading template registry...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-6 py-3">Template / Title</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Version Status</th>
                    <th className="px-6 py-3">Lifecycle</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {templates.map((tpl: any) => {
                    const status = tpl.latestVersionStatus || 'draft';
                    const statusBadgeVariant =
                      status === 'published'
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
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground">{tpl.title}</div>
                          <div className="text-xs text-muted-foreground">{tpl.slug} · {tpl.titleGu}</div>
                        </td>
                        <td className="px-6 py-4 capitalize text-xs text-muted-foreground">
                          {tpl.category.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={statusBadgeVariant as any} className="capitalize text-xs">
                            {status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          v{tpl.currentVersionNumber || 1} · {tpl.versionsCount || 1} version(s)
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link to={`/admin/templates/${tpl._id}`}>
                            <Button variant="outline" size="sm" className="gap-1 text-xs">
                              <Eye className="h-3.5 w-3.5" />
                              <span>Manage</span>
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
