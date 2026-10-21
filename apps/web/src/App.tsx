import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './context/LanguageContext.js';
import { SessionReuseProvider } from './context/SessionReuseContext.js';
import { CitizenAuthProvider } from './context/CitizenAuthContext.js';
import { AppLayout } from './components/layout/AppLayout.js';

// Fast Code-Split Lazy Loaded Page Components
const LandingPage = lazy(() => import('./features/documents/LandingPage.js').then((m) => ({ default: m.LandingPage })));
const LibraryPage = lazy(() => import('./features/documents/LibraryPage.js').then((m) => ({ default: m.LibraryPage })));
const DocumentDetailPage = lazy(() => import('./features/documents/DocumentDetailPage.js').then((m) => ({ default: m.DocumentDetailPage })));
const DynamicFormPage = lazy(() => import('./features/generation/DynamicFormPage.js').then((m) => ({ default: m.DynamicFormPage })));
const PreviewPage = lazy(() => import('./features/preview/PreviewPage.js').then((m) => ({ default: m.PreviewPage })));
const MyDocumentsPage = lazy(() => import('./features/documents/MyDocumentsPage.js').then((m) => ({ default: m.MyDocumentsPage })));
const SubmitDocumentPage = lazy(() => import('./features/submissions/SubmitDocumentPage.js').then((m) => ({ default: m.SubmitDocumentPage })));

// Services Feature Pages
const ServicesPage = lazy(() => import('./features/services/ServicesPage.js').then((m) => ({ default: m.ServicesPage })));
const ServiceDetailPage = lazy(() => import('./features/services/ServiceDetailPage.js').then((m) => ({ default: m.ServiceDetailPage })));
const ServiceBundleFormPage = lazy(() => import('./features/services/ServiceBundleFormPage.js').then((m) => ({ default: m.ServiceBundleFormPage })));
const ServiceBundlePreviewPage = lazy(() => import('./features/services/ServiceBundlePreviewPage.js').then((m) => ({ default: m.ServiceBundlePreviewPage })));

// Admin Portal Pages
const AdminLoginPage = lazy(() => import('./features/admin/AdminLoginPage.js').then((m) => ({ default: m.AdminLoginPage })));
const AdminTemplatesPage = lazy(() => import('./features/admin/AdminTemplatesPage.js').then((m) => ({ default: m.AdminTemplatesPage })));
const AdminTemplateEditorPage = lazy(() => import('./features/admin/AdminTemplateEditorPage.js').then((m) => ({ default: m.AdminTemplateEditorPage })));
const AdminSubmissionsPage = lazy(() => import('./features/admin/AdminSubmissionsPage.js').then((m) => ({ default: m.AdminSubmissionsPage })));
const AdminSubmissionReviewPage = lazy(() => import('./features/admin/AdminSubmissionReviewPage.js').then((m) => ({ default: m.AdminSubmissionReviewPage })));
const AdminAuditPage = lazy(() => import('./features/admin/AdminAuditPage.js').then((m) => ({ default: m.AdminAuditPage })));
const AdminServicesPage = lazy(() => import('./features/admin/AdminServicesPage.js').then((m) => ({ default: m.AdminServicesPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function RouteLoadingFallback() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
        </div>
      </div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest animate-pulse">
        Loading JanDastavej...
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CitizenAuthProvider>
          <SessionReuseProvider>
            <BrowserRouter>
              <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                  {/* Citizen Layout */}
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/services/:slug" element={<ServiceDetailPage />} />
                    <Route path="/services/:slug/apply" element={<ServiceBundleFormPage />} />
                    <Route path="/services/:slug/bundle/:bundleId" element={<ServiceBundlePreviewPage />} />
                    <Route path="/documents" element={<LibraryPage />} />
                    <Route path="/documents/:slug" element={<DocumentDetailPage />} />
                    <Route path="/create/:templateId" element={<DynamicFormPage />} />
                    <Route path="/preview/:sessionId" element={<PreviewPage />} />
                    <Route path="/my-documents" element={<MyDocumentsPage />} />
                    <Route path="/submit-format" element={<SubmitDocumentPage />} />

                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route path="/admin/templates" element={<AdminTemplatesPage />} />
                    <Route path="/admin/templates/:id" element={<AdminTemplateEditorPage />} />
                    <Route path="/admin/services" element={<AdminServicesPage />} />
                    <Route path="/admin/submissions" element={<AdminSubmissionsPage />} />
                    <Route path="/admin/submissions/:id" element={<AdminSubmissionReviewPage />} />
                    <Route path="/admin/audit" element={<AdminAuditPage />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </SessionReuseProvider>
        </CitizenAuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
