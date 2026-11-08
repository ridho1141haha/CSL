import { chromium } from '@playwright/test';
const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 480, height: 270 } });
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
  const track = await page.evaluate(() => new Promise((res) => {
    const events = [];
    let lastY = 99, respawns = 0;
    const t0 = performance.now();
    const loop = () => {
      const y = window.__csl.pos().y;
      if (y < -1.5 && lastY >= -1.5) respawns++;
      if (frames++ % 1 === 0 && (y < -1.5 || Math.abs(y - lastY) > 0.3)) events.push(`y=${y.toFixed(2)}@${(performance.now()-t0)|0}ms`);
      lastY = y;
      if (performance.now() - t0 < 15000) requestAnimationFrame(loop);
      else res({ respawns, events: events.slice(0, 30), finalY: y, frames });
    };
    let frames = 0;
    requestAnimationFrame(loop);
  }));
  console.log('FALL TRACK:', JSON.stringify(track, null, 1).slice(0, 900));
  await browser.close();
};
run().catch((e) => { console.error('crashed:', e.message); process.exit(1); });
