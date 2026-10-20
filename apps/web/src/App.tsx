import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './context/LanguageContext.js';
import { SessionReuseProvider } from './context/SessionReuseContext.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { LandingPage } from './features/documents/LandingPage.js';
import { LibraryPage } from './features/documents/LibraryPage.js';
import { DocumentDetailPage } from './features/documents/DocumentDetailPage.js';
import { DynamicFormPage } from './features/generation/DynamicFormPage.js';
import { PreviewPage } from './features/preview/PreviewPage.js';

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
        <SessionReuseProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/documents" element={<LibraryPage />} />
                <Route path="/documents/:slug" element={<DocumentDetailPage />} />
                <Route path="/create/:templateId" element={<DynamicFormPage />} />
                <Route path="/preview/:sessionId" element={<PreviewPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SessionReuseProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
