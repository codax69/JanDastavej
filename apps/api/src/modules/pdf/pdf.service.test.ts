import { afterEach, describe, expect, it, vi } from 'vitest';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { closePdfWorker, generateDocumentPdf, warmUpPdfWorker } from './pdf.service.js';

function createContext(newPage?: () => Promise<Page>): BrowserContext {
  return {
    close: vi.fn().mockResolvedValue(undefined),
    ...(newPage ? { newPage: vi.fn(newPage) } : {}),
  } as unknown as BrowserContext;
}

function createBrowser(newContext: () => Promise<BrowserContext>): Browser {
  return {
    isConnected: vi.fn(() => true),
    newContext: vi.fn(newContext),
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  } as unknown as Browser;
}

afterEach(async () => {
  await closePdfWorker();
  vi.restoreAllMocks();
});

describe('PDF worker lifecycle', () => {
  it('closes a browser when context initialization fails and retries cleanly', async () => {
    const failedBrowser = createBrowser(() => Promise.reject(new Error('context creation failed')));
    const context = createContext();
    const retryBrowser = createBrowser(async () => context);
    const launchSpy = vi
      .spyOn(chromium, 'launch')
      .mockResolvedValueOnce(failedBrowser)
      .mockResolvedValueOnce(retryBrowser);

    await warmUpPdfWorker();

    expect(failedBrowser.close).toHaveBeenCalledOnce();

    await warmUpPdfWorker();

    expect(launchSpy).toHaveBeenCalledTimes(2);
    expect(retryBrowser.newContext).toHaveBeenCalledOnce();
    await closePdfWorker();
    expect(retryBrowser.close).toHaveBeenCalledOnce();
  });

  it('waits for in-flight initialization before closing cached browser resources', async () => {
    let resolveLaunch: (browser: Browser) => void = () => undefined;
    const launchPromise = new Promise<Browser>((resolve) => {
      resolveLaunch = resolve;
    });
    vi.spyOn(chromium, 'launch').mockReturnValue(launchPromise);

    const context = createContext();
    const browser = createBrowser(async () => context);
    const warmUp = warmUpPdfWorker();
    let closeReturned = false;
    const close = closePdfWorker().then(() => {
      closeReturned = true;
    });

    await Promise.resolve();
    expect(closeReturned).toBe(false);

    resolveLaunch(browser);
    await Promise.all([warmUp, close]);

    expect(context.close).toHaveBeenCalledOnce();
    expect(browser.close).toHaveBeenCalledOnce();
  });

  it('drains active PDF jobs and rejects new work while closing', async () => {
    let markContentStarted: () => void = () => undefined;
    const contentStarted = new Promise<void>((resolve) => {
      markContentStarted = resolve;
    });
    let finishContent: () => void = () => undefined;
    const contentBarrier = new Promise<void>((resolve) => {
      finishContent = resolve;
    });
    const page = {
      setDefaultTimeout: vi.fn(),
      setContent: vi.fn(async () => {
        markContentStarted();
        await contentBarrier;
      }),
      pdf: vi.fn().mockResolvedValue(Buffer.from('pdf')),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;
    const context = createContext(async () => page);
    const browser = createBrowser(async () => context);
    const launchSpy = vi.spyOn(chromium, 'launch').mockResolvedValue(browser);

    const generation = generateDocumentPdf('<p>document</p>');
    await contentStarted;

    let closeReturned = false;
    const closing = closePdfWorker().then(() => {
      closeReturned = true;
    });

    await expect(generateDocumentPdf('<p>new document</p>')).rejects.toThrow(
      'PDF worker is shutting down'
    );
    await warmUpPdfWorker();

    expect(launchSpy).toHaveBeenCalledOnce();
    expect(closeReturned).toBe(false);
    expect(context.close).not.toHaveBeenCalled();

    finishContent();
    await Promise.all([generation, closing]);

    expect(page.close).toHaveBeenCalledOnce();
    expect(context.close).toHaveBeenCalledOnce();
    expect(browser.close).toHaveBeenCalledOnce();
  });
});
