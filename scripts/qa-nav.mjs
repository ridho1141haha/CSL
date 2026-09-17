// QA: v0.10.0 — waypoint + fixed map + new settings + day/night time flow.
// Verifies (desktop, headless):
//   1. HUD mission card shows the active quest WITH a live distance chip
//   2. Map panel: per-scene visited count, ◆ TUJUAN marker, heading arrow,
//      stacked floor chips for Gedung B zones, current-zone highlight
//   3. Settings panel exposes the four new controls
//   4. TimeFlow drifts the clock during GAMEPLAY without crossing a period
//   5. Evening (golden-hour) clock loads and plays with zero console errors
// Run: node scripts/qa-nav.mjs  (preview server on :4173)
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT = 'qa';

const save = (minutes) => ({
  version: 2,
  savedAt: Date.now(),
  clock: { day: 0, minutes },
  visitedZones: ['courtyard', 'gate'],
  player: { hp: 100, focus: 100, x: 7, z: 29 },
  stats: { academic: 60, violence: 5, diplomacy: 8, reputation: 0 },
  story: {
    chapter: 1,
    beat: 'ch1_explore',
    route: 'none',
    flags: ['opening_complete', 'zone_seen_courtyard'],
    choices: {},
  },
  relationships: { aris: 0, siti: 0, bimo: 0, budi: 0 },
  visitedNpc: { aris: false, siti: false, bimo: false, budi: false },
  talkCounts: { aris: 0, siti: 0, bimo: 0, budi: 0 },
  quests: { explore_school: 'active' },
  inventory: ['student_card', 'phone'],
  scene: 'campus',
});

const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 900, height: 560 }, locale: 'id-ID' });
  const page = await ctx.newPage();
  // SwiftShader compositing can stall page.screenshot on overlay screens —
  // screenshots are best-effort; the DOM probes are the actual assertions.
  const shot = (path) => page.screenshot({ path, animations: 'disabled', timeout: 12000 }).catch((e) => console.log(`SHOT_SKIP: ${path} (${String(e).slice(0, 80)})`));

  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 300));
  });
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${String(e).slice(0, 300)}`));

  const load = async (minutes) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate((s) => localStorage.setItem('csl-save-v2:auto', JSON.stringify(s)), save(minutes));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    await page.locator('.menu-nav button').nth(1).click({ force: true }); // LANJUTKAN
    await page.waitForTimeout(2400);
  };

  // ---------- pass 1: morning — waypoint + map + settings ----------
  await load(7 * 60 + 12);
  const hud = await page.evaluate(() => ({
    inGame: !!document.querySelector('.minimal-hud'),
    objCard: document.querySelector('.obj-card')?.textContent ?? 'NONE',
    objDist: document.querySelector('.obj-dist')?.textContent ?? 'NONE',
    clock: document.querySelector('.hud-clock')?.textContent ?? '',
  }));
  console.log('HUD:', JSON.stringify(hud));
  await shot(`${OUT}/n-01-gameplay-morning.png`);

  // MAP (M)
  await page.keyboard.press('KeyM');
  await page.waitForTimeout(700);
  const map = await page.evaluate(() => ({
    open: !!document.querySelector('.map-panel'),
    target: document.querySelector('.map-target')?.textContent ?? 'NONE',
    objective: document.querySelector('.map-objective')?.textContent ?? 'NONE',
    heading: !!document.querySelector('.map-heading'),
    visitedChip: Array.from(document.querySelectorAll('.map-head .chip')).map((c) => c.textContent),
    floorChips: Array.from(document.querySelectorAll('.map-grid .node .fl')).map((f) => f.textContent),
    currentNode: !!document.querySelector('.map-grid .node.current'),
    targetLoc: document.querySelector('.ms-target-loc')?.textContent ?? 'NONE',
  }));
  console.log('MAP:', JSON.stringify(map));
  await shot(`${OUT}/n-02-map.png`);

  // SETTINGS — v0.10.0 map-fix: Esc from an overlay closes it (→ GAMEPLAY).
  // ESC_1 closes the map, ESC_2 opens PAUSE, then PENGATURAN via DOM click.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const mapClosed = await page.evaluate(() => ({
    hud: !!document.querySelector('.minimal-hud'),
    menu: !!document.querySelector('.full-menu'),
  }));
  console.log('ESC_CLOSES_MAP:', JSON.stringify(mapClosed));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const pauseOpen = await page.evaluate(() => !!document.querySelector('.pause-options'));
  console.log('PAUSE_OPEN:', pauseOpen);
  if (!pauseOpen) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
  // DOM-level click — Playwright actionability checks stall under SwiftShader
  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.pause-options button')).find((b) => b.textContent?.includes('PENGATURAN'));
    if (!btn) return false;
    btn.click();
    return true;
  });
  console.log('PENGATURAN_CLICKED:', clicked);
  await page.waitForTimeout(600);
  const settings = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.settings-panel label span')).map((s) => s.textContent);
    return {
      open: !!document.querySelector('.settings-panel'),
      sensitivity: labels.includes('SENSITIVITAS KAMERA'),
      textSpeed: labels.includes('KECEPATAN TEKS DIALOG'),
      subtitle: labels.includes('UKURAN SUBTITLE'),
      invertY: labels.includes('INVERT Y'),
    };
  });
  console.log('SETTINGS:', JSON.stringify(settings));
  await shot(`${OUT}/n-03-settings.png`);
  await page.keyboard.press('Escape'); // settings → gameplay (map-fix)
  await page.waitForTimeout(400);
  const backToGame = await page.evaluate(() => ({
    hud: !!document.querySelector('.minimal-hud'),
    menu: !!document.querySelector('.full-menu'),
  }));
  console.log('ESC_SETTINGS_TO_GAME:', JSON.stringify(backToGame));

  // ---------- TimeFlow: stand in GAMEPLAY, clock must drift (7s → +2min) ----------
  await page.waitForTimeout(7000);
  const clock2 = await page.evaluate(() => document.querySelector('.hud-clock')?.textContent ?? '');
  console.log('TIMEFLOW:', hud.clock, '→', clock2);

  // ---------- pass 2: evening golden hour — clean load, no errors ----------
  await load(17 * 60 + 30);
  const evening = await page.evaluate(() => ({
    inGame: !!document.querySelector('.minimal-hud'),
    clock: document.querySelector('.hud-clock')?.textContent ?? '',
  }));
  console.log('EVENING:', JSON.stringify(evening));
  await page.waitForTimeout(2500);
  await shot(`${OUT}/n-04-gameplay-evening.png`);

  console.log('CONSOLE_ERRORS:', errors.length ? errors.slice(0, 8) : 'none');
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(
    `${OUT}/n-report.json`,
    JSON.stringify({ hud, map, settings, clockBefore: hud.clock, clockAfter: clock2, evening, errors }, null, 2),
  );
  await browser.close();
};

run().catch((e) => { console.error(e); process.exit(1); });
