import { chromium } from '@playwright/test';
const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 480, height: 270 }, locale: 'id-ID', hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36' });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('csl.settings.v1', JSON.stringify({ quality: 'low' }));
    const save = { version: 2, savedAt: Date.now(), clock: { day: 0, minutes: 432 }, visitedZones: ['courtyard'], player: { hp: 100, focus: 100, x: 7, z: 29 }, stats: { academic: 60, violence: 5, diplomacy: 8, reputation: 0 }, story: { chapter: 1, beat: 'ch1_explore', route: 'none', flags: ['opening_complete'], choices: {} }, relationships: { aris: 0, siti: 0, bimo: 0, budi: 0 }, visitedNpc: {}, talkCounts: {}, quests: { explore_school: 'active' }, inventory: [], scene: 'campus' };
    localStorage.setItem('csl-save-v2:auto', JSON.stringify(save));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.menu-nav button').nth(1).click({ force: true, timeout: 60000 });
  await page.waitForTimeout(4000);
  // A) real click on PAUSE button (onPointerDown → setMode PAUSE)
  await page.locator('.tc-pause').dispatchEvent('pointerdown');
  await page.waitForTimeout(600);
  const modeA = await page.evaluate(() => window.__csl.mode());
  console.log('A) after pause pointerdown dispatch:', modeA);
  if (modeA === 'PAUSE') {
    // resume via ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
  // B) real Playwright CLICK on pause
  if (modeA !== 'PAUSE') {
    await page.locator('.tc-pause').click({ force: true });
    await page.waitForTimeout(600);
    console.log('B) after real click:', await page.evaluate(() => window.__csl.mode()));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
  // C) React version
  console.log('C) react version:', await page.evaluate(() => { const s = document.querySelector('#root'); return s?._reactRootContainer ? 'legacy' : (Object.keys(s).find((k) => k.startsWith('__reactContainer')) ? 'react18' : 'unknown'); }));
  await browser.close();
};
run().catch((e) => { console.error('crashed:', e.message); process.exit(1); });
