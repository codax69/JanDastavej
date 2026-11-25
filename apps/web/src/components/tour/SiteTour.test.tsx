import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext.js';
import { CitizenAuthProvider } from '../../context/CitizenAuthContext.js';
import { SiteTour } from './SiteTour.js';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="current-route">{location.pathname}</div>;
}

function TestHarness({
  initialRoute = '/',
  hideServiceFilter = false,
}: {
  initialRoute?: string;
  hideServiceFilter?: boolean;
}) {
  return (
    <LanguageProvider>
      <CitizenAuthProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <LocationProbe />
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  <form id="tour-search">Search</form>
                  <section id="tour-citizen-services">Services</section>
                </div>
              }
            />
            <Route
              path="/services"
              element={
                <div id="tour-services">
                  <div
                    id="tour-services-filters"
                    style={{ display: hideServiceFilter ? 'none' : undefined }}
                  >
                    Services Filters
                  </div>
                </div>
              }
            />
            <Route
              path="/documents"
              element={
                <div>
                  <div id="tour-template-library">Filters</div>
                  <div id="tour-library-grid">Grid</div>
                </div>
              }
            />
            <Route path="*" element={<div>Other</div>} />
          </Routes>
          <SiteTour />
        </MemoryRouter>
      </CitizenAuthProvider>
    </LanguageProvider>
  );
}

describe('SiteTour', () => {
  beforeEach(() => {
    localStorage.setItem('jd_preferred_lang', 'en');
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.getClientRects = () =>
      [{ width: 100, height: 40, top: 0, left: 0, bottom: 40, right: 100, x: 0, y: 0, toJSON: () => ({}) }] as unknown as DOMRectList;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: null }), { status: 401 })
    );
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('walks through necessary workflow routes with yellow-bordered bottom box and transition banner', async () => {
    render(<TestHarness initialRoute="/" />);

    await act(async () => {
      window.dispatchEvent(new CustomEvent('jandastavej:start-tour'));
    });

    const dialog = await screen.findByRole('dialog');
    expect(dialog.className).toContain('border-accent');
    expect(screen.getByText('Welcome to JanDastavej')).toBeTruthy();

    // Step 2 on '/'
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    expect(screen.getByText('Popular Citizen Services')).toBeTruthy();

    // Step 3 -> navigates to '/services' with transition banner
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => {
      expect(screen.getByTestId('current-route').textContent).toBe('/services');
      expect(screen.getByRole('status').textContent).toContain('Moved to Citizen Services (/services)');
    });

    // Step 4 -> navigates to '/documents'
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => {
      expect(screen.getByTestId('current-route').textContent).toBe('/documents');
      expect(screen.getByRole('status').textContent).toContain('Moved to Document Library (/documents)');
    });

    // Step 5 (last when signed out) -> Finish button closes tour
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    const finishBtn = screen.getByRole('button', { name: /finish/i });
    fireEvent.click(finishBtn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('highlights the visible primary target and removes it when advancing', async () => {
    render(<TestHarness />);

    await act(async () => {
      window.dispatchEvent(new CustomEvent('jandastavej:start-tour'));
    });

    const primaryTarget = document.getElementById('tour-search');
    await waitFor(() => {
      expect(primaryTarget?.classList.contains('site-tour-highlight')).toBe(true);
    });

    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));

    const nextTarget = document.getElementById('tour-citizen-services');
    await waitFor(() => {
      expect(nextTarget?.classList.contains('site-tour-highlight')).toBe(true);
      expect(primaryTarget?.classList.contains('site-tour-highlight')).toBe(false);
    });
  });

  it('highlights the visible fallback when the primary target is hidden and clears it on close', async () => {
    render(<TestHarness hideServiceFilter />);

    await act(async () => {
      window.dispatchEvent(new CustomEvent('jandastavej:start-tour'));
    });
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));

    const primaryTarget = await screen.findByText('Services Filters');
    const fallbackTarget = document.getElementById('tour-services');
    await waitFor(() => {
      expect(primaryTarget.classList.contains('site-tour-highlight')).toBe(false);
      expect(fallbackTarget?.classList.contains('site-tour-highlight')).toBe(true);
    });

    fireEvent.click(screen.getByRole('button', { name: /close tour/i }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(fallbackTarget?.classList.contains('site-tour-highlight')).toBe(false);
  });

  it('highlights a target that appears while polling', async () => {
    const { container } = render(<TestHarness />);
    document.getElementById('tour-search')?.remove();

    await act(async () => {
      window.dispatchEvent(new CustomEvent('jandastavej:start-tour'));
    });

    expect(container.querySelector('.site-tour-highlight')).toBeNull();

    const target = document.createElement('form');
    target.id = 'tour-search';
    container.append(target);

    await waitFor(() => {
      expect(target.classList.contains('site-tour-highlight')).toBe(true);
    });
  });
});
