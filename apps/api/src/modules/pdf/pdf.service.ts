import { chromium, Browser } from 'playwright';
import { getDocumentStyles } from '@jandastavej/shared';
import { logger } from '../../config/logger.js';

let browserInstance: Browser | null = null;
let activePdfJobs = 0;
const MAX_CONCURRENT_PDF_JOBS = parseInt(process.env.PDF_CONCURRENCY_LIMIT || '3', 10);

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--disable-translate',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
      ],
    });
    logger.info('Playwright Chromium browser initialized for PDF generation');
  }
  return browserInstance;
}

export async function generateDocumentPdf(bodyHtml: string, title = 'JanDastavej Document'): Promise<Buffer> {
  if (activePdfJobs >= MAX_CONCURRENT_PDF_JOBS) {
    throw new Error('PDF worker concurrency limit reached. Please retry in a few moments.');
  }

  activePdfJobs++;
  let browser: Browser | null = null;
  let context = null;
  let page = null;

  try {
    browser = await getBrowser();
    // Sandboxed browser context with restricted permissions
    context = await browser.newContext({
      javaScriptEnabled: false, // Strict: No client JS execution needed for static template printing!
      offline: true, // SSRF Prevention: Disallow all outbound network calls!
    });

    page = await context.newPage();

    const fullHtml = `
      <!doctype html>
      <html lang="gu">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            ${getDocumentStyles()}
          </style>
        </head>
        <body>
          ${bodyHtml}
        </body>
      </html>
    `;

    await page.setContent(fullHtml, {
      waitUntil: 'load',
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
    activePdfJobs--;
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
  }
}

export async function closePdfWorker(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
}
