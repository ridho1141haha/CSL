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
  const probe = await page.evaluate(() => {
    const stick = document.querySelector('.tc-stick');
    if (!stick) return { err: 'no stick' };
    const r = stick.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const el = document.elementFromPoint(cx, cy);
    const chain = [];
    let n = el;
    while (n && chain.length < 6) { chain.push(`${n.tagName?.toLowerCase?.()}.${(n.className?.toString?.() || '').split(' ')[0]}`); n = n.parentElement; }
    // instrument: count pointer events on window (capture)
    const counts = { down: 0, move: 0, up: 0, pointerTypes: new Set() };
    (window).addEventListener('pointerdown', (e) => { counts.down++; counts.pointerTypes.add(e.pointerType); }, { capture: true });
    (window).addEventListener('pointermove', (e) => { counts.move++; }, { capture: true });
    (window).addEventListener('pointerup', (e) => { counts.up++; }, { capture: true });
    (window).__counts = counts;
    return { rect: { x: r.left, y: r.top, w: r.width, h: r.height }, center: { cx, cy }, hit: el ? `${el.tagName}.${el.className?.toString?.()}` : null, chain };
  });
  console.log('PROBE:', JSON.stringify(probe, null, 1));
  const { cx, cy } = { cx: probe.center.cx, cy: probe.center.cy };
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 4; i++) { await page.mouse.move(cx, cy - i * 10); await page.waitForTimeout(100); }
  await page.mouse.up();
  console.log('COUNTS:', JSON.stringify(await page.evaluate(() => ({ d: window.__counts.down, m: window.__counts.move, u: window.__counts.up, types: [...window.__counts.pointerTypes], axes: window.__csl.axes() }))));
  await browser.close();
};
run().catch((e) => { console.error('crashed:', e.message); process.exit(1); });
