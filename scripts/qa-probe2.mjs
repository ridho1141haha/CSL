import { chromium } from '@playwright/test';
const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  page.on('pageerror', (e) => console.log('[PAGEERROR]', String(e).slice(0, 200)));
  await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('csl.settings.v1', JSON.stringify({ quality: 'low' }));
    const save = { version: 2, savedAt: Date.now(), clock: { day: 0, minutes: 432 }, visitedZones: ['courtyard'], player: { hp: 100, focus: 100, x: 7, z: 29 }, stats: { academic: 60, violence: 5, diplomacy: 8, reputation: 0 }, story: { chapter: 1, beat: 'ch1_explore', route: 'none', flags: ['opening_complete'], choices: {} }, relationships: { aris: 0, siti: 0, bimo: 0, budi: 0 }, visitedNpc: {}, talkCounts: {}, quests: { explore_school: 'active' }, inventory: [], scene: 'campus' };
    localStorage.setItem('csl-save-v2:auto', JSON.stringify(save));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(3000);
    const txt = await page.evaluate(() => document.body.innerText.slice(0, 120).replace(/\n/g, ' | '));
    console.log(`t=${(i + 1) * 3}s:`, txt.slice(0, 100));
    if (!txt.includes('MENYIAPKAN')) break;
  }
  console.log('menu-nav count:', await page.locator('.menu-nav button').count());
  await browser.close();
};
run().catch((e) => { console.error('crashed:', e.message); process.exit(1); });
