import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header.js';
import { Footer } from './Footer.js';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
