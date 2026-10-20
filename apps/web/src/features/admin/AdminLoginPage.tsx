import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck, UserCheck, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.js';
import { Input } from '../../components/ui/Input.js';
import { Alert } from '../../components/ui/Alert.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@jandastavej.local');
  const [password, setPassword] = useState('DemoAdminPass123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const performLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Login failed. Please check credentials.');
      }

      navigate('/admin/templates');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(email, password);
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Citizen Portal</span>
        </Link>
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">JanDastavej Admin</h1>
        <p className="text-xs text-muted-foreground">
          Collector Office, Gandhinagar · Template Governance & Audit
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <span>Authorized Staff Sign In</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {error && (
            <Alert variant="destructive" title="Authentication Failed">
              {error}
            </Alert>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@jandastavej.local"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />

            <Button type="submit" size="lg" disabled={loading} className="w-full gap-2">
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Credentials Fill Buttons */}
          <div className="pt-4 border-t border-border space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">Quick Demo Roles (1-Click Fill):</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail('admin@jandastavej.local');
                  setPassword('DemoAdminPass123!');
                  performLogin('admin@jandastavej.local', 'DemoAdminPass123!');
                }}
                className="gap-1 text-xs"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Admin Login</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail('approver@jandastavej.local');
                  setPassword('DemoApproverPass123!');
                  performLogin('approver@jandastavej.local', 'DemoApproverPass123!');
                }}
                className="gap-1 text-xs"
              >
                <UserCheck className="h-3.5 w-3.5 text-success" />
                <span>Approver Login</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
