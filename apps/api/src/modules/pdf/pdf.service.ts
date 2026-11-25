import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { escapeHtml, getDocumentStyles } from '@jandastavej/shared';
import { logger } from '../../config/logger.js';

const parsedLimit = Number.parseInt(process.env.PDF_CONCURRENCY_LIMIT || '3', 10);
const MAX_CONCURRENT_PDF_JOBS = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 3;
const DOCUMENT_STYLES = getDocumentStyles();

const CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-software-rasterizer',
  '--no-zygote',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-ipc-flooding-protection',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-sync',
  '--disable-translate',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-first-run',
  '--safebrowsing-disable-auto-update',
];

let browserInstance: Browser | null = null;
let sharedContext: BrowserContext | null = null;
let browserLaunchPromise: Promise<BrowserContext> | null = null;
let activePdfJobs = 0;
let activePdfJobsDrain: Promise<void> | null = null;
let resolveActivePdfJobsDrain: (() => void) | null = null;
let isClosing = false;
let closePromise: Promise<void> | null = null;

function waitForActivePdfJobs(): Promise<void> {
  if (activePdfJobs === 0) {
    return Promise.resolve();
  }

  if (!activePdfJobsDrain) {
    activePdfJobsDrain = new Promise((resolve) => {
      resolveActivePdfJobsDrain = resolve;
    });
  }

  return activePdfJobsDrain;
}

function finishPdfJob(): void {
  activePdfJobs--;
  if (activePdfJobs === 0) {
    const resolve = resolveActivePdfJobsDrain;
    activePdfJobsDrain = null;
    resolveActivePdfJobsDrain = null;
    resolve?.();
  }
}

function buildPdfHtml(bodyHtml: string, title: string): string {
  return `<!doctype html>
<html lang="gu">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>${DOCUMENT_STYLES}</style>
  </head>
  <body>${bodyHtml}</body>
</html>`;
}

async function getPdfContext(): Promise<BrowserContext> {
  if (browserInstance?.isConnected() && sharedContext) {
    return sharedContext;
  }

  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  browserLaunchPromise = (async () => {
    const executablePath =
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      process.env.CHROMIUM_PATH ||
      undefined;

    const launchedBrowser = await chromium.launch({
      executablePath,
      headless: true,
      env: {
        ...process.env,
        DBUS_SESSION_BUS_ADDRESS: '/dev/null',
      },
      args: CHROMIUM_ARGS,
    });

    browserInstance = launchedBrowser;
    sharedContext = null;
    launchedBrowser.on('disconnected', () => {
      if (browserInstance === launchedBrowser) {
        browserInstance = null;
        sharedContext = null;
      }
    });

    try {
      const context = await launchedBrowser.newContext({
        javaScriptEnabled: false, // Strict: no client JS execution needed for static printing
        offline: true, // SSRF prevention: disallow all outbound network calls
      });

      if (!launchedBrowser.isConnected()) {
        throw new Error('Chromium disconnected while initializing the PDF context');
      }

      sharedContext = context;
      logger.info(
        `Playwright Chromium browser initialized for PDF generation (binary: ${executablePath || 'bundled'})`
      );

      return context;
    } catch (err) {
      if (browserInstance === launchedBrowser) {
        browserInstance = null;
        sharedContext = null;
      }
      await launchedBrowser.close().catch((closeErr) => {
        logger.warn({ err: closeErr }, 'Failed to close Chromium after PDF context initialization failed');
      });
      throw err;
    }
  })();

  try {
    return await browserLaunchPromise;
  } finally {
    browserLaunchPromise = null;
  }
}

export async function warmUpPdfWorker(): Promise<void> {
  if (isClosing) {
    return;
  }

  try {
    await getPdfContext();
  } catch (err) {
    logger.warn({ err }, 'PDF worker warm-up failed (will retry lazily on first PDF request)');
  }
}

export async function generateDocumentPdf(
  bodyHtml: string,
  title = 'JanDastavej Document'
): Promise<Buffer> {
  if (isClosing) {
    throw new Error('PDF worker is shutting down.');
  }

  if (activePdfJobs >= MAX_CONCURRENT_PDF_JOBS) {
    throw new Error('PDF worker concurrency limit reached. Please retry in a few moments.');
  }

  activePdfJobs++;
  let page: Page | null = null;

  try {
    const context = await getPdfContext();
    page = await context.newPage();
    page.setDefaultTimeout(30000);

    await page.setContent(buildPdfHtml(bodyHtml, title), {
      waitUntil: 'domcontentloaded',
      timeout: 8000,
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (page) await page.close().catch(() => {});
    finishPdfJob();
  }
}

export function closePdfWorker(): Promise<void> {
  if (closePromise) {
    return closePromise;
  }

  isClosing = true;
  closePromise = (async () => {
    try {
      if (browserLaunchPromise) {
        await browserLaunchPromise.catch((err) => {
          logger.warn({ err }, 'PDF worker initialization failed before shutdown');
        });
      }

      await waitForActivePdfJobs();

      const context = sharedContext;
      const browser = browserInstance;
      sharedContext = null;
      browserInstance = null;

      if (context) {
        await context.close().catch((err) => {
          logger.warn({ err }, 'Failed to close PDF browser context');
        });
      }

      if (browser) {
        await browser.close().catch((err) => {
          logger.warn({ err }, 'Failed to close PDF browser');
        });
      }
    } finally {
      isClosing = false;
      closePromise = null;
    }
  })();

  return closePromise;
}
