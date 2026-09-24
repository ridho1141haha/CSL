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
  const out = await page.evaluate(async () => {
    const stick = document.querySelector('.tc-stick');
    const r = stick.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const mk = (type, x, y) => new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 42, pointerType: 'mouse', isPrimary: true, clientX: x, clientY: y, buttons: 1 });
    stick.dispatchEvent(mk('pointerdown', cx, cy));
    await new Promise((r2) => setTimeout(r2, 120));
    for (let i = 1; i <= 4; i++) {
      stick.dispatchEvent(mk('pointermove', cx, cy - i * 12));
      await new Promise((r2) => setTimeout(r2, 120));
    }
    const axesAfter = JSON.stringify(window.__csl.axes());
    stick.dispatchEvent(mk('pointerup', cx, cy - 48));
    return { axesAfter };
  });
  console.log('SYNTH RESULT:', JSON.stringify(out));
  await browser.close();
};
run().catch((e) => { console.error('crashed:', e.message); process.exit(1); });
