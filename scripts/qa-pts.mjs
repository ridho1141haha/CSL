// QA: v0.18.0 — PTS mini-game end-to-end (headless, real build).
// Verifies:
//   1. Load tepat sebelum montase PTS (beat ch1_pts, bond_pts_done absen)
//      → montage_pts menyala → node ch1_pts_exam (mode CINEMATIC)
//   2. Advance → __exam__ → mode EXAM (quiz UI tampil, "SOAL 1/5")
//   3. ESC no-op saat EXAM (ujian wajib — tidak bisa ditinggalkan)
//   4. Quiz playable: 5 soal, 3 benar → layar hasil "Jawaban benar: 3 / 5 ·
//      Akademik +9 · Fokus +4" (dihitung scoreStudy — bukan nilai kanon)
//   5. LANJUTKAN → montase hasil KANON ch1_pts_1 (Pak Budi, Ren 98) →
//      advance sampai ch1_pts_5 → beat ch1_break (cabang cerita utuh)
//   6. Autosave ch1_pts_5: stats.academic = 60+9+3 = 72, focus 50+4 = 54,
//      flag pts_quiz_done TERSIMPAN (PTS tidak akan diulang setelah load)
//   7. Mobile (390×844): quiz tampil satu kolom, bisa dijawab (touch)
// Run: node scripts/qa-pts.mjs  (preview server on :4173)
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT = 'qa';

const save = () => ({
  version: 2,
  savedAt: Date.now(),
  clock: { day: 1, minutes: 7 * 60 + 30 },
  visitedZones: ['courtyard'],
  player: { hp: 100, focus: 50, x: 7, z: 29 },
  stats: { academic: 60, violence: 5, diplomacy: 8, reputation: 0 },
  story: {
    chapter: 1,
    beat: 'ch1_pts',
    route: 'none',
    // bond_pts_done ABSEN → montase PTS boleh menyala; pts_quiz_done ABSEN → quiz wajib
    flags: ['opening_complete', 'bond_lib_done', 'zone_seen_courtyard'],
    choices: {},
  },
  relationships: { aris: 0, siti: 0, bimo: 0, budi: 0 },
  visitedNpc: { aris: false, siti: false, bimo: false, budi: false },
  talkCounts: { aris: 0, siti: 0, bimo: 0, budi: 0 },
  quests: { explore_school: 'completed' },
  inventory: ['student_card', 'phone'],
  scene: 'campus',
});

const results = [];
const check = (name, ok, extra = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}${extra ? ` — ${extra}` : ''}`);
};

// Semua interaksi DOM pakai evaluate-click (el.click()) — CDP mouse di headless
// ~1FPS retarget hit-test ke <body> (pelajaran qa-walk v0.16.0).
const makeApi = (page) => ({
  csl: (expr) => page.evaluate((e) => window.__csl?.[e]?.(), expr),
  eyebrow: () => page.evaluate(() => document.querySelector('.study-panel .eyebrow')?.textContent ?? ''),
  clickOption: async (pat) => {
    await page.waitForFunction(
      (p) => [...document.querySelectorAll('.study-options button')].some((b) => new RegExp(p).test(b.textContent ?? '')),
      pat,
      { timeout: 20000, polling: 250 },
    );
    await page.evaluate((p) => {
      [...document.querySelectorAll('.study-options button')].find((b) => new RegExp(p).test(b.textContent ?? ''))?.click();
    }, pat);
  },
  clickButton: async (pat) => {
    await page.waitForFunction(
      (p) => [...document.querySelectorAll('.study-panel button')].some((b) => new RegExp(p).test(b.textContent ?? '')),
      pat,
      { timeout: 20000, polling: 250 },
    );
    await page.evaluate((p) => {
      [...document.querySelectorAll('.study-panel button')].find((b) => new RegExp(p).test(b.textContent ?? ''))?.click();
    }, pat);
  },
  // advance dialog sinematik sampai tertutup (null) — klik .cinematic; klik
  // pertama per node menyelesaikan typewriter, berikutnya memajukan node.
  drainDialogue: async (maxClicks = 16) => {
    for (let i = 0; i < maxClicks; i++) {
      const node = await page.evaluate(() => window.__csl?.dialogue?.());
      if (!node) return true;
      await page.evaluate(() => document.querySelector('.cinematic')?.click());
      await page.waitForTimeout(400);
    }
    return (await page.evaluate(() => window.__csl?.dialogue?.())) === null;
  },
  waitDialogue: (node, timeout = 25000) =>
    page.waitForFunction((n) => window.__csl?.dialogue?.() === n, node, { timeout, polling: 250 }).then(() => true).catch(() => false),
  waitMode: (mode, timeout = 15000) =>
    page.waitForFunction((m) => window.__csl?.mode?.() === m, mode, { timeout, polling: 250 }).then(() => true).catch(() => false),
  waitEyebrow: (frag, timeout = 20000) =>
    page.waitForFunction((f) => (document.querySelector('.study-panel .eyebrow')?.textContent ?? '').includes(f), frag, { timeout, polling: 250 }).then(() => true).catch(() => false),
});

const run = async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu'] });

  // ---------------------------------------------------------------- desktop
  const ctx = await browser.newContext({ viewport: { width: 900, height: 560 }, locale: 'id-ID' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${String(e).slice(0, 300)}`));
  const api = makeApi(page);

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((s) => localStorage.setItem('csl-save-v2:auto', JSON.stringify(s)), save());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await page.locator('.menu-nav button').nth(1).click({ force: true }); // LANJUTKAN
  await page.waitForTimeout(2400);

  // 1) montase PTS menyala otomatis → node ujian
  check('montage_pts → ch1_pts_exam terbuka (cinematic)', await api.waitDialogue('ch1_pts_exam'), `dialogue=${await api.csl('dialogue')} mode=${await api.csl('mode')}`);

  // 2) advance → __exam__ → mode EXAM + quiz UI
  await page.evaluate(() => document.querySelector('.cinematic')?.click());
  check('mode EXAM tercapai', await api.waitMode('EXAM'), `mode=${await api.csl('mode')}`);
  const ui = await page.evaluate(() => ({
    panel: !!document.querySelector('.study-panel'),
    eyebrow: document.querySelector('.study-panel .eyebrow')?.textContent ?? '',
    options: document.querySelectorAll('.study-options button').length,
  }));
  check('quiz UI tampil (SOAL 1/5, 4 opsi)', ui.panel && ui.eyebrow.includes('SOAL 1/5') && ui.options === 4, ui.eyebrow);

  // 3) ESC no-op saat EXAM
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  check('ESC saat EXAM no-op (ujian wajib)', (await api.csl('mode')) === 'EXAM');

  // 4) jawab 5 soal: benar, benar, SALAH, benar, SALAH → 3/5 (wait deterministik per soal)
  const answers = [
    [/^90$/, 'SOAL 2/5'],                  // pts_math_1 ✓
    [/^Nominal$/, 'SOAL 3/5'],             // pts_ind_1 ✓
    [/^He don't like school/, 'SOAL 4/5'], // pts_eng_1 ✗ (salah)
    [/^Bandung$/, 'SOAL 5/5'],             // pts_geo_1 ✓
    [/^Produsen$/, 'SELESAI'],             // pts_bio_1 ✗ (salah)
  ];
  let allAdvanced = true;
  for (const [re, next] of answers) {
    await api.clickOption(re);
    const ok = await api.waitEyebrow(next);
    if (!ok) allAdvanced = false;
  }
  const res = await page.evaluate(() => document.querySelector('.study-panel')?.textContent ?? '');
  check('quiz terjawab sampai selesai (5/5 soal)', allAdvanced && res.includes('SELESAI'), (await api.eyebrow()));
  check('layar hasil: 3/5 · Akademik +9 · Fokus +4 (bukan nilai kanon)', res.includes('Jawaban benar: 3 / 5') && res.includes('Akademik +9') && res.includes('Fokus +4'), res.replace(/\s+/g, ' ').slice(0, 140));

  // 5) LANJUTKAN → montase hasil kanon → drain → beat ch1_break
  await api.clickButton('LANJUTKAN');
  check('quiz selesai → montase hasil kanon ch1_pts_1 terbuka', await api.waitDialogue('ch1_pts_1'), `dialogue=${await api.csl('dialogue')} mode=${await api.csl('mode')}`);
  const drained = await api.drainDialogue();
  check('montase hasil selesai → beat ch1_break (cabang cerita utuh)', drained && (await api.csl('beat')) === 'ch1_break', `beat=${await api.csl('beat')} node=${await api.csl('dialogue')}`);

  // 6) autosave ch1_pts_5: stat + flag tersimpan
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('csl-save-v2:auto') ?? '{}'));
  check('autosave: academic 60+9+3=72, focus 50+4=54', saved.stats?.academic === 72 && saved.player?.focus === 54, `academic=${saved.stats?.academic} focus=${saved.player?.focus}`);
  check('autosave: flag pts_quiz_done tersimpan (PTS tak diulang setelah load)', Array.isArray(saved.story?.flags) && saved.story.flags.includes('pts_quiz_done'), (saved.story?.flags ?? []).join(','));
  await page.screenshot({ path: `${OUT}/pts-01-after-results.png`, animations: 'disabled', timeout: 12000 }).catch(() => console.log('SHOT_SKIP: pts-01'));

  // ---------------------------------------------------------------- mobile
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'id-ID' });
  const mpage = await mctx.newPage();
  mpage.on('console', (m) => { if (m.type() === 'error') errors.push(`MOBILE: ${m.text().slice(0, 300)}`); });
  const mapi = makeApi(mpage);
  await mpage.goto(BASE, { waitUntil: 'networkidle' });
  await mpage.evaluate((s) => localStorage.setItem('csl-save-v2:auto', JSON.stringify(s)), save());
  await mpage.reload({ waitUntil: 'networkidle' });
  await mpage.waitForTimeout(2200);
  await mpage.locator('.menu-nav button').nth(1).click({ force: true });
  await mpage.waitForTimeout(2600);
  check('mobile: montase PTS menyala setelah load', await mapi.waitDialogue('ch1_pts_exam', 25000), `dialogue=${await mapi.csl('dialogue')} mode=${await mapi.csl('mode')}`);
  await mpage.evaluate(() => document.querySelector('.cinematic')?.click());
  check('mobile: mode EXAM tercapai', await mapi.waitMode('EXAM'), `mode=${await mapi.csl('mode')}`);
  const mui = await mpage.evaluate(() => {
    const grid = document.querySelector('.study-options');
    const cols = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0;
    const btn = document.querySelector('.study-options button');
    const r = btn ? btn.getBoundingClientRect() : { width: 0, height: 0 };
    return { cols, w: Math.round(r.width), h: Math.round(r.height) };
  });
  check('mobile: quiz 1 kolom, tombol touch-friendly (≥44px, tanpa hover)', mui.cols === 1 && mui.h >= 44, JSON.stringify(mui));
  await mapi.clickOption(/^90$/);
  check('mobile: jawaban tap lanjut ke soal 2', await mapi.waitEyebrow('SOAL 2/5'), await mapi.eyebrow());
  await mpage.screenshot({ path: `${OUT}/pts-02-mobile.png`, animations: 'disabled', timeout: 12000 }).catch(() => console.log('SHOT_SKIP: pts-02'));

  const realErrors = errors.filter((e) => !e.includes('SwiftShader'));
  check('CONSOLE_ERRORS none', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

  await browser.close();
  const pass = results.filter(Boolean).length;
  console.log(`\nPTS_QA: ${pass}/${results.length} pass`);
  process.exit(pass === results.length ? 0 : 1);
};

run().catch((e) => { console.error('FATAL:', e); process.exit(1); });
