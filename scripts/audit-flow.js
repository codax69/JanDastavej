import { chromium } from 'playwright';

async function audit() {
  console.log('[Audit] Launching Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  
  const screens = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'mobile', width: 360, height: 800 },
  ];

  for (const screen of screens) {
    console.log(`[Audit] Testing viewport: ${screen.name} (${screen.width}x${screen.height})...`);
    const context = await browser.newContext({
      viewport: { width: screen.width, height: screen.height },
    });
    const page = await context.newPage();

    // 1. Landing
    await page.goto('http://localhost:5173/');
    await page.waitForSelector('text=JanDastavej');
    await page.screenshot({ path: `docs/screenshots/${screen.name}_01_landing.png`, fullPage: true });

    // Check horizontal scroll on mobile
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (hasHorizontalOverflow) {
      console.error(`[AUDIT DEFECT] Horizontal overflow detected at ${screen.name}!`);
    } else {
      console.log(`[Audit PASS] No horizontal scroll at ${screen.name}`);
    }

    // 2. Library
    await page.goto('http://localhost:5173/documents');
    await page.waitForSelector('text=સ્વ-ઘોષણાપત્ર');
    await page.screenshot({ path: `docs/screenshots/${screen.name}_02_library.png`, fullPage: true });

    // 3. Document Detail
    await page.goto('http://localhost:5173/documents/sample-declaration');
    await page.waitForSelector('text=દસ્તાવેજનો હેતુ અને ઉપયોગ');
    await page.screenshot({ path: `docs/screenshots/${screen.name}_03_detail.png`, fullPage: true });

    // 4. Dynamic Form
    await page.goto('http://localhost:5173/create/sample-declaration');
    await page.waitForSelector('input[name="fullName"]');

    // Trigger validation error on empty submit
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=આ માહિતી ભરવી આવશ્યક છે.');
    await page.screenshot({ path: `docs/screenshots/${screen.name}_04_form_errors.png`, fullPage: true });

    // Fill form
    await page.fill('input[name="fullName"]', 'કાંતિલાલ મોહનલાલ પટેલ');
    await page.fill('input[name="parentSpouseName"]', 'મોહનલાલ પટેલ');
    await page.fill('input[name="age"]', '52');
    await page.fill('input[name="occupation"]', 'ખેતી');
    await page.fill('textarea[name="address"]', 'પ્લોટ નં ૧૨, સેક્ટર ૭, ગાંધીનગર - ૩૮૨૦૦૭');
    await page.fill('textarea[name="declarationPurpose"]', 'સરકારી કચેરીમાં આવકનો દાખલો મેળવવા માટે આ સ્વ-ઘોષણાપત્ર રજૂ કરું છું.');
    await page.fill('input[name="declarationDate"]', '2026-10-20');
    await page.fill('input[name="place"]', 'ગાંધીનગર');

    // Submit form to preview
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/preview\/.*/);
    await page.waitForSelector('text=દસ્તાવેજ પ્રિવ્યૂ');
    await page.screenshot({ path: `docs/screenshots/${screen.name}_05_preview.png`, fullPage: true });

    // Test Admin screens on desktop
    if (screen.name === 'desktop') {
      await page.goto('http://localhost:5173/admin/login');
      await page.waitForSelector('text=Authorized Staff Sign In');
      await page.screenshot({ path: 'docs/screenshots/desktop_06_admin_login.png', fullPage: true });

      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/admin\/templates/);
      await page.waitForSelector('text=Template Administration');
      await page.screenshot({ path: 'docs/screenshots/desktop_07_admin_templates.png', fullPage: true });

      await page.goto('http://localhost:5173/admin/audit');
      await page.waitForSelector('text=Audit Trail');
      await page.screenshot({ path: 'docs/screenshots/desktop_08_admin_audit.png', fullPage: true });
    }

    await context.close();
  }

  await browser.close();
  console.log('[Audit] All flows verified and screenshots saved.');
}

audit().catch((err) => {
  console.error('[Audit] Failed:', err);
  process.exit(1);
});
