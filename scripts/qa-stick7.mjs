import { chromium } from '@playwright/test';
const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 480, height: 270 }, locale: 'id-ID', hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36' });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' });
  console.log('VIEWPORT:', JSON.stringify(await page.evaluate(() => ({ inner: [innerWidth, innerHeight], dpr: devicePixelRatio, vv: visualViewport ? [visualViewport.width, visualViewport.height, visualViewport.scale] : null }))));
  await browser.close();
};
run().catch((e) => { console.error('crashed:', e.message); process.exit(1); });
