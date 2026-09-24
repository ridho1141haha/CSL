import { chromium } from '@playwright/test';
const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 480, height: 270 } });
  page.on('pageerror', (e) => console.log('[PAGEERROR]', String(e).slice(0, 200)));
  await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('csl.settings.v1', JSON.stringify({ quality: 'low' }));
    const save = { version: 2, savedAt: Date.now(), clock: { day: 0, minutes: 432 }, visitedZones: ['courtyard'], player: { hp: 100, focus: 100, x: 7, z: 29 }, stats: { academic: 60, violence: 5, diplomacy: 8, reputation: 0 }, story: { chapter: 1, beat: 'ch1_explore', route: 'none', flags: ['opening_complete'], choices: {} }, relationships: { aris: 0, siti: 0, bimo: 0, budi: 0 }, visitedNpc: {}, talkCounts: {}, quests: { explore_school: 'active' }, inventory: [], scene: 'campus' };
    localStorage.setItem('csl-save-v2:auto', JSON.stringify(save));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.menu-nav button').nth(1).click({ force: true, timeout: 60000 });
  for (let i = 0; i < 30; i++) {
    if (await page.evaluate(() => window.__csl.mode()) === 'GAMEPLAY') break;
    await page.waitForTimeout(1000);
  }
  console.log('mode:', await page.evaluate(() => window.__csl.mode()));
  // baseline: count frames + y for 3s
  const base = await page.evaluate(() => new Promise((res) => {
    let frames = 0; const ys = [];
    const t0 = performance.now();
    const loop = () => {
      frames++;
      ys.push(+window.__csl.pos().y.toFixed(3));
      if (performance.now() - t0 < 3000) requestAnimationFrame(loop);
      else res({ frames, ymin: Math.min(...ys), ymax: Math.max(...ys) });
    };
    requestAnimationFrame(loop);
  }));
  console.log('BASELINE 3s:', JSON.stringify(base));
  // press Space, track INSIDE the page so not a single frame is missed
  const jump = await page.evaluate(() => new Promise((res) => {
    const ys = []; let frames = 0;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
    setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true })), 50);
    const t0 = performance.now();
    const loop = () => {
      frames++;
      ys.push(+window.__csl.pos().y.toFixed(3));
      if (performance.now() - t0 < 12000) requestAnimationFrame(loop);
      else res({ frames, ymax: Math.max(...ys), ytail: ys.slice(-5) });
    };
    requestAnimationFrame(loop);
  }));
  console.log('JUMP 12s:', JSON.stringify(jump));
  await browser.close();
};
run().catch((e) => { console.error('crashed:', e.message); process.exit(1); });
