// Screenshot each .frame element from the mockup HTML and save to mockups/screenshots/
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 600, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  const htmlPath = 'file://' + path.resolve('E:/Project Repo/thcms/mockups/tier4-mockups.html').replace(/\\/g, '/');
  await page.goto(htmlPath);
  await page.waitForLoadState('networkidle');

  // Capture each frame
  const sections = [
    { sel: 'h2.section:nth-of-type(1) + .grid .frame', name: 'tier4-admin-programs.png' },
    { sel: 'h2.section:nth-of-type(2) + .grid .frame', name: 'tier4-admin-finance.png' },
    { sel: 'h2.section:nth-of-type(3) + .grid .frame', name: 'tier4-admin-invoices.png' },
    { sel: 'h2.section:nth-of-type(4) + .grid .frame', name: 'tier4-hr-claims.png' },
    { sel: 'h2.section:nth-of-type(5) + .grid .frame', name: 'tier4-participant-class-detail.png' },
  ];

  for (const s of sections) {
    const el = await page.$(s.sel);
    if (!el) { console.error('Not found:', s.sel); continue; }
    const out = path.resolve('E:/Project Repo/thcms/mockups/screenshots', s.name);
    await el.screenshot({ path: out });
    console.log('Saved', s.name, fs.statSync(out).size, 'bytes');
  }

  await browser.close();
})();