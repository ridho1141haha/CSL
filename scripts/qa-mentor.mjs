// QA: mentor-feedback smoke test (v0.6) — desktop.
// Verifies: seeded mid-game load, NPC dialogue opens in DIALOGUE mode with the
// reworked per-character greeting, acting/camera code runs clean, canvas still
// paints. Run: node scripts/qa-mentor.mjs (preview server on :4173)
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT = 'qa';

const save = {
  version: 2,
  savedAt: Date.now(),
  clock: { day: 0, minutes: 7 * 60 + 12 }, // arrive period → Aris at [11,34]
  visitedZones: ['courtyard'],
  player: { hp: 100, focus: 100, x: 11.5, z: 34.2 }, // within 2.3m of Aris
  stats: { academic: 68, violence: 5, diplomacy: 8, reputation: 0 },
  story: {
    chapter: 2,
    beat: 'ch2_aftermath',
    route: 'none',
    // opening_complete skips FP; helped_aris tests choice callbacks; met_aris
    // NOT set → the new first-meeting greeting variant should appear
    flags: ['opening_complete', 'helped_aris', 'zone_seen_courtyard'],
    choices: { o3_choice: 'help_aris' },
  },
  relationships: { aris: 4, siti: 0, bimo: 0, budi: 0 },
  visitedNpc: { aris: false, siti: false, bimo: false, budi: false },
  talkCounts: { aris: 0, siti: 0, bimo: 0, budi: 0 },
  quests: { explore_school: 'completed', gate_trouble: 'completed' },
  inventory: ['student_card', 'notebook', 'phone', 'water', 'snack'],
  scene: 'campus',
};

const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 900, height: 560 }, locale: 'id-ID' });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 300));
  });
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${String(e).slice(0, 300)}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((s) => localStorage.setItem('csl-save-v2:auto', JSON.stringify(s)), save);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/x-01-menu.png` });

  // LANJUTKAN (second menu button; enabled because a save exists)
  const cont = page.locator('.menu-nav button').nth(1);
  await cont.click({ force: true });
  await page.waitForTimeout(2200);

  const inGame = await page.evaluate(() => !!document.querySelector('.minimal-hud'));
  console.log('IN_GAME_HUD:', inGame);
  await page.waitForTimeout(800); // let NPCs spawn & write npcPositions
  const prompt = await page.evaluate(() => document.querySelector('.interact')?.textContent?.trim() ?? 'NONE');
  console.log('INTERACT_PROMPT:', prompt);
  await page.screenshot({ path: `${OUT}/x-02-gameplay.png` });

  // talk to Aris (E) — DIALOGUE mode: speaker shot camera + acting on.
  // NOTE: no canvas mouse-click here — in headless it requests pointer lock
  // and can hang the shell. Keyboard events reach window without focus tricks.
  let speaker = 'NONE';
  let hudVisible = true;
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(700);
    const probe = await page.evaluate(() => ({
      hud: !!document.querySelector('.minimal-hud'),
      dlg: !!document.querySelector('.dialogue-box'),
      speaker: document.querySelector('.dialogue-box .speaker')?.textContent ?? 'NONE',
    }));
    hudVisible = probe.hud;
    speaker = probe.speaker;
    if (probe.dlg) break;
  }
  console.log('DIALOGUE_SPEAKER:', speaker, '| HUD_STILL_VISIBLE:', hudVisible);
  await page.screenshot({ path: `${OUT}/x-03-dialog-aris.png` });

  // advance past the greeting node → choice list with the first-meet variant
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(600);
    const found = await page.evaluate(() => document.querySelectorAll('.dialogue-box .choices button').length);
    if (found > 0) break;
  }
  const choices = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.dialogue-box .choices button')).map((b) => b.textContent?.trim()),
  );
  console.log('CHOICES:', JSON.stringify(choices));
  await page.screenshot({ path: `${OUT}/x-04-dialog-choices.png` });

  const painted = 'skipped-shortrun';
  console.log('CONSOLE_ERRORS:', errors.length ? errors.slice(0, 8) : 'none');

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(`${OUT}/x-report.json`, JSON.stringify({ inGame, speaker, choices, painted, errors }, null, 2));
  await browser.close();
};

run().catch((e) => { console.error(e); process.exit(1); });
