// QA: v0.16.1 — "arah hadap karakter mengikuti kamera".
// GAMEPLAY idle: simulates a REAL mouse drag on the orbit camera (the same
// drag-look path a player uses) with NO movement keys held, then polls until
// the body's playerPos.facing converges to camForwardAngle(camState.yaw).
// COMBAT idle: squares up to the ENEMY even with the camera dragged away.
// Reuses the qa-walk boot (save → LANJUTKAN).
// Run: node scripts/qa-face.mjs  (preview server on :4173)
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';

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

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

setTimeout(() => { console.error('WATCHDOG: qa-face exceeded 300s — aborting'); process.exit(2); }, 300_000).unref?.();

const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu'] });
  const step = (m) => console.log(`STEP: ${m}`);
  const errors = [];
  const results = [];
  const ok = (name, pass, detail = '') => {
    results.push({ name, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ` — ${detail}` : ''}`);
  };

  const ctx = await browser.newContext({ viewport: { width: 480, height: 270 }, locale: 'id-ID' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${String(e).slice(0, 300)}`));

  const state = () => page.evaluate(() => ({
    facing: window.__csl.pos().facing,
    target: window.__csl.camFacingTarget(),
    yaw: window.__csl.camYaw(),
    mode: window.__csl.mode(),
  }));

  // poll until |facing - target| < tol (idle turn is rate*dt per rendered
  // frame; headless SwiftShader renders at ~1-2 FPS so give a long deadline)
  const waitConverged = async (p, tol, deadlineMs = 15000) => {
    const t0 = Date.now();
    let last = null;
    while (Date.now() - t0 < deadlineMs) {
      last = await p.evaluate(() => ({
        facing: window.__csl.pos().facing,
        target: window.__csl.camFacingTarget(),
      }));
      if (Math.abs(wrap(last.facing - last.target)) < tol) return { converged: true, ...last };
      await p.waitForTimeout(250);
    }
    return { converged: false, ...last };
  };

  // real camera drag: LMB hold + horizontal move (drag-look) — rotates yaw
  const dragCamera = async (p, dxPx) => {
    await p.mouse.move(240, 135);
    await p.mouse.down();
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await p.mouse.move(240 + (dxPx * i) / steps, 135);
      await p.waitForTimeout(40);
    }
    await p.mouse.up();
    await p.waitForTimeout(150);
  };

  step('boot desktop ctx');
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.evaluate(() => localStorage.setItem('csl.settings.v1', JSON.stringify({ quality: 'low' })));
  await page.evaluate((s) => localStorage.setItem('csl-save-v2:auto', JSON.stringify(s)), save(7 * 60 + 12));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.locator('.menu-nav button').nth(1).click({ force: true, timeout: 60000 });
  let bootOk = false;
  for (let i = 0; i < 30; i++) {
    if (await page.evaluate(() => window.__csl.mode()) === 'GAMEPLAY') { bootOk = true; break; }
    await page.waitForTimeout(1000);
  }
  ok('boot: GAMEPLAY', bootOk);
  await page.evaluate(() => window.__csl.teleport(7, 36)); // open ground
  for (let i = 0; i < 30; i++) {
    if (await page.evaluate(() => window.__csl.pos().y) < 0.5) break;
    await page.waitForTimeout(1000);
  }

  // ---- GAMEPLAY idle: camera drag right (+300px → yaw -= ~2.4 rad) ----
  const s0 = await state();
  await dragCamera(page, 300);
  const g1 = await waitConverged(page, 0.3);
  const turned = g1.converged ? Math.abs(wrap(g1.facing - s0.facing)) : 0;
  ok('gameplay idle: body turns with camera (right drag)', g1.converged && turned > 0.8,
    `yaw Δ=${wrap((await state()).yaw - s0.yaw).toFixed(2)} rad, facing ${s0.facing.toFixed(2)} → ${g1.facing.toFixed(2)}, target ${g1.target.toFixed(2)}`);

  // ---- and back the other way (catches a sign error in the mapping) ----
  const s1 = await state();
  await dragCamera(page, -420);
  const g2 = await waitConverged(page, 0.3);
  ok('gameplay idle: follows camera back (left drag)', g2.converged,
    `facing ${s1.facing.toFixed(2)} → ${g2.facing.toFixed(2)}, target ${g2.target.toFixed(2)}`);

  // ---- COMBAT idle: squares up to the ENEMY (brawler rule) ----
  // Camera-follow is a GAMEPLAY-only rule; in combat the hit/block cones read
  // playerPos.facing, so idle must track the enemy. Drag the camera SOMEWHERE
  // ELSE first — the body must go to the enemy anyway.
  step('combat facing test');
  await page.evaluate(() => window.__csl.startCombat('stair_fight'));
  await page.waitForTimeout(500);
  const cs = await state();
  ok('combat: starts', cs.mode === 'COMBAT', `mode=${cs.mode}`);
  const waitEnemyFacing = async (p, tol, deadlineMs = 15000) => {
    const t0 = Date.now();
    let last = null;
    while (Date.now() - t0 < deadlineMs) {
      last = await p.evaluate(() => {
        const pos = window.__csl.pos();
        const en = window.__csl.enemy();
        return { facing: pos.facing, x: pos.x, z: pos.z, ex: en.x, ez: en.z };
      });
      const want = Math.atan2(last.ex - last.x, last.ez - last.z);
      if (Math.abs(wrap(last.facing - want)) < tol) return { converged: true, want, ...last };
      await p.waitForTimeout(250);
    }
    const want = Math.atan2(last.ex - last.x, last.ez - last.z);
    return { converged: false, want, ...last };
  };
  const c0 = await state();
  await dragCamera(page, 260);
  const c1 = await waitEnemyFacing(page, 0.35);
  ok('combat idle: body squares up to the ENEMY (camera dragged away)', c1.converged,
    `facing ${c0.facing.toFixed(2)} → ${c1.facing.toFixed(2)}, enemy dir ${c1.want.toFixed(2)}`);

  await ctx.close();
  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\nFACE_QA: ${results.length - failed.length}/${results.length} pass`);
  console.log(`CONSOLE_ERRORS: ${errors.length === 0 ? 'none' : errors.join(' | ')}`);
  process.exit(failed.length || errors.length ? 1 : 0);
};

run().catch((e) => { console.error('QA crashed:', e); process.exit(1); });
