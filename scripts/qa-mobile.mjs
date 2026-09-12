// QA: mobile emulation — blank-world regression + touch controls presence.
// Run: node scripts/qa-mobile.mjs  (preview server must be running on :4173)
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT = 'qa';

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    ...devices['Pixel 7'],
    locale: 'id-ID',
  });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 300));
  });
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${String(e).slice(0, 300)}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/m-01-menu.png` });

  // start new game — the .menu button (header chip has the same text)
  const start = page.locator('.menu button.active').first();
  if (await start.count()) {
    await start.click({ force: true });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `${OUT}/m-02-prolog.png` });
    // advance a few dialogue lines
    for (let i = 0; i < 6; i++) {
      await page.mouse.click(200, 450);
      await page.waitForTimeout(700);
    }
    await page.screenshot({ path: `${OUT}/m-03-dialog.png` });
  }

  // WebGL canvas actually painting? sample center pixel via canvas readback
  const painted = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return 'no-canvas';
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'no-gl';
    const px = new Uint8Array(4);
    // read a few spots; any non-uniform variance means geometry drew
    const samples = [];
    for (const [x, y] of [[0.5, 0.3], [0.3, 0.6], [0.7, 0.6], [0.5, 0.75]]) {
      gl.readPixels(Math.floor(c.width * x), Math.floor(c.height * y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      samples.push(Array.from(px).join(','));
    }
    return samples.join(' | ');
  });

  console.log('CANVAS_SAMPLES:', painted);
  console.log('CONSOLE_ERRORS:', errors.length ? errors.slice(0, 6) : 'none');

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(`${OUT}/m-report.json`, JSON.stringify({ painted, errors }, null, 2));
  await browser.close();
};

run().catch((e) => { console.error(e); process.exit(1); });
