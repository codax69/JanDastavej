import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from './App';

describe('App component', () => {
  it('renders brand heading', async () => {
    render(<App />);
    const headings = await screen.findAllByText(/JanDastavej/i);
    expect(headings.length).toBeGreaterThan(0);
  });
});
