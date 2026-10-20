import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './context/LanguageContext.js';
import { SessionReuseProvider } from './context/SessionReuseContext.js';
import { CitizenAuthProvider } from './context/CitizenAuthContext.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { LandingPage } from './features/documents/LandingPage.js';
import { LibraryPage } from './features/documents/LibraryPage.js';
import { DocumentDetailPage } from './features/documents/DocumentDetailPage.js';
import { DynamicFormPage } from './features/generation/DynamicFormPage.js';
import { PreviewPage } from './features/preview/PreviewPage.js';
import { MyDocumentsPage } from './features/documents/MyDocumentsPage.js';
import { AdminLoginPage } from './features/admin/AdminLoginPage.js';
import { AdminTemplatesPage } from './features/admin/AdminTemplatesPage.js';
import { AdminTemplateEditorPage } from './features/admin/AdminTemplateEditorPage.js';
import { AdminAuditPage } from './features/admin/AdminAuditPage.js';
import { SubmitDocumentPage } from './features/submissions/SubmitDocumentPage.js';
import { AdminSubmissionsPage } from './features/admin/AdminSubmissionsPage.js';
import { AdminSubmissionReviewPage } from './features/admin/AdminSubmissionReviewPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CitizenAuthProvider>
          <SessionReuseProvider>
            <BrowserRouter>
              <Routes>
                {/* Citizen Layout */}
                <Route element={<AppLayout />}>
                  <Route path="/" element={<LandingPage />} />
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
                  <Route path="/admin/submissions" element={<AdminSubmissionsPage />} />
                  <Route path="/admin/submissions/:id" element={<AdminSubmissionReviewPage />} />
                  <Route path="/admin/audit" element={<AdminAuditPage />} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </SessionReuseProvider>
        </CitizenAuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
