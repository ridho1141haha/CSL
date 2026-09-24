// Measure headless render loop rate on the deployed scene (SwiftShader).
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';

const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2000);

  // rAF rate on the menu (canvas may not be mounted yet)
  const menuRaf = await page.evaluate(() => new Promise((res) => {
    let n = 0; const t0 = performance.now();
    const loop = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(loop); else res(n); };
    requestAnimationFrame(loop);
  }));
  console.log('MENU rAF / 2s:', menuRaf);

  // enter game
  await page.evaluate(() => {
    const save = { version: 2, savedAt: Date.now(), clock: { day: 0, minutes: 432 }, visitedZones: ['courtyard'], player: { hp: 100, focus: 100, x: 7, z: 29 }, stats: { academic: 60, violence: 5, diplomacy: 8, reputation: 0 }, story: { chapter: 1, beat: 'ch1_explore', route: 'none', flags: ['opening_complete'], choices: {} }, relationships: { aris: 0, siti: 0, bimo: 0, budi: 0 }, visitedNpc: {}, talkCounts: {}, quests: { explore_school: 'active' }, inventory: [], scene: 'campus' };
    localStorage.setItem('csl-save-v2:auto', JSON.stringify(save));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.locator('.menu-nav button').nth(1).click({ force: true });
  await page.waitForTimeout(3000);

  const gameRaf = await page.evaluate(() => new Promise((res) => {
    let n = 0; const t0 = performance.now();
    const loop = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(loop); else res(n); };
    requestAnimationFrame(loop);
  }));
  console.log('GAMEPLAY rAF / 2s:', gameRaf);
  console.log('visibilityState:', await page.evaluate(() => document.visibilityState));
  console.log('hasFocus:', await page.evaluate(() => document.hasFocus()));

  await browser.close();
};

run().catch((e) => { console.error('crashed:', e.message); process.exit(1); });
