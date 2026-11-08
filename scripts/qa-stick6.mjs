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
  await page.waitForTimeout(15000);
  await page.evaluate(() => {
    (window).__log = [];
    window.addEventListener('pointerdown', (e) => {
      const path = e.composedPath().slice(0, 5).map((n) => `${n.tagName?.toLowerCase?.() || '?'}${n.className ? '.' + String(n.className).split(' ')[0] : ''}`);
      (window).__log.push({ t: 'down', target: `${e.target.tagName?.toLowerCase?.()}.${String(e.target.className).split(' ')[0]}`, path });
    }, { capture: true });
  });
  const box = await page.locator('.tc-stick').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.waitForTimeout(300);
  console.log('TARGET LOG:', JSON.stringify(await page.evaluate(() => (window).__log), null, 1));
  console.log('elementFromPoint now:', await page.evaluate(() => { const el = document.elementFromPoint(82, 188); return el ? `${el.tagName}.${el.className}`.slice(0, 60) : 'null'; }));
  await page.mouse.up();
  await browser.close();
};
run().catch((e) => { console.error('crashed:', e.message); process.exit(1); });
