import { describe, it, expect } from 'vitest';
import { PKG_NAME } from './index.js';

describe('shared package', () => {
  it('exports package name', () => {
    expect(PKG_NAME).toBe('@jandastavej/shared');
  });
});
