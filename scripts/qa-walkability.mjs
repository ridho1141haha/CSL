// ============================================================================
// qa-walkability.mjs (v0.12.0) — bukti fisika konektivitas gedung utama:
//   • lorong lobi → koridor kelas (dulu buntu: inti gudang menutup celah z=21)
//   • koridor → kelas 1-X & ruang guru lewat celah pintu z=14
//   • vestibule tangga belakang → kelas & ruang guru (bukaan baru x=±2, z 4..5.4)
//   • tangga belakang → vestibule (celah dinding utara z=4)
// Prinsip: tembak raycast ke collider RAPIER di dunia yang sedang jalan.
// Ray TIDAK menabrak apa pun = jalur benar-benar tembus; dua kontrol negatif
// memastikan dinding yang memang solid tetap menahan ray.
// Jalankan: node scripts/qa-walkability.mjs (butuh `vite preview` di 4173)
// ============================================================================
import { chromium } from 'playwright';

const URL = process.env.QA_URL || 'http://localhost:4173/';
const results = [];
const errs = [];

function check(name, ok, info = '') {
  results.push({ name, ok, info });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  [' + info + ']' : ''}`);
}

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push(String(e)));

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

// masuk lewat alur resmi: menu utama → MULAI (boot flow utuh, dunia ter-mount
// penuh dengan semua collider). Opening cinematic tidak mengganggu raycast.
await page.waitForFunction(() => !!window.__cslGame, null, { timeout: 60000 });
await page.waitForSelector('.menu-nav button', { timeout: 60000 });
await page.locator('.menu-nav button').first().click({ force: true });

// tunggu world rapier + class Ray terekspos dan collider dunia terdaftar
// (satu RigidBody memuat banyak collider — hitung colliders, bukan bodies)
await page.waitForFunction(() => !!window.__cslWorld && !!window.__cslRayClass, null, { timeout: 60000 });
await page.waitForFunction(() => {
  try { return window.__cslWorld.colliders.len() > 120; } catch { return false; }
}, null, { timeout: 90000 });
await page.waitForTimeout(1200); // beri waktu collider stabil

const ray = async (ox, oy, oz, dx, dy, dz, far) =>
  page.evaluate(([ox, oy, oz, dx, dy, dz, far]) => {
    const world = window.__cslWorld;
    const Ray = window.__cslRayClass;
    const hit = world.castRay(new Ray({ x: ox, y: oy, z: oz }, { x: dx, y: dy, z: dz }), far, true);
    return hit ? { dist: Number(hit.timeOfImpact.toFixed(2)) } : null;
  }, [ox, oy, oz, dx, dy, dz, far]);

// ---- POSITIVE: jalur yang harus TEMBUS
// lobi → celah z=21 → inti lorong: 10m lurus bebas (inti berakhir di dinding
// ruang z=14 — pemain belok barat/timur di koridor strip, itu test 1b)
let h = await ray(0, 1.2, 25, 0, 0, -1, 10.0);
check('lobi → celah z=21 → inti lorong 10m lurus tembus', !h, h ? JSON.stringify(h) : 'clear');

// inti lorong → belok barat di strip z=15 → jalur pintu kelas (x -8.75)
h = await ray(-0.5, 1.2, 15.0, -1, 0, 0, 9);
check('inti lorong → belok barat menuju pintu kelas (z 15)', !h, h ? JSON.stringify(h) : 'clear');

// inti lorong → belok timur di strip z=15 → jalur pintu ruang guru (x 8.75)
h = await ray(0.5, 1.2, 15.0, 1, 0, 0, 9);
check('inti lorong → belok timur menuju ruang guru (z 15)', !h, h ? JSON.stringify(h) : 'clear');

h = await ray(-8.75, 1.2, 15.2, 0, 0, -1, 6);
check('koridor → kelas 1-X lewat celah pintu (x -8.75)', !h, h ? JSON.stringify(h) : 'clear');

h = await ray(8.75, 1.2, 15.2, 0, 0, -1, 6);
check('koridor → ruang guru lewat celah pintu (x 8.75)', !h, h ? JSON.stringify(h) : 'clear');

h = await ray(-1.0, 1.2, 4.7, -1, 0, 0, 5);
check('vestibule → kelas lewat bukaan baru (z 4.7)', !h, h ? JSON.stringify(h) : 'clear');

h = await ray(1.0, 1.2, 4.7, 1, 0, 0, 5);
check('vestibule → ruang guru lewat bukaan baru (z 4.7)', !h, h ? JSON.stringify(h) : 'clear');

h = await ray(0, 1.2, -1.0, 0, 0, 1, 8);
check('tangga belakang → vestibule (celah z=4, x 0)', !h, h ? JSON.stringify(h) : 'clear');

// ---- NEGATIVE controls: dinding yang memang solid HARUS menahan ray
h = await ray(5, 1.2, 15.2, 0, 0, -1, 6);
check('control: dinding ruang z=14 di x=5 tetap solid', !!h, h ? `hit @${h.dist}m` : 'NO HIT (salah!)');

h = await ray(-14, 1.2, 20, -1, 0, 0, 6);
check('control: dinding barat x=-16 tetap solid', !!h, h ? `hit @${h.dist}m` : 'NO HIT (salah!)');

h = await ray(0, 1.2, 18.5, 1, 0, 0, 3.4);
check('control: inti lorong sisi x=+2 tetap solid (z 18.5)', !!h, h ? `hit @${h.dist}m` : 'NO HIT (salah!)');

// ---- staging bab 2: area aktor/prop timur shaft harus bebas tembok
h = await ray(5.2, 1.2, 3.0, 1, 0, 0, 4);
check('staging bab 2: area aktor timur shaft bebas', !h, h ? JSON.stringify(h) : 'clear');

console.log(`\nCONSOLE_ERRORS: ${errs.length ? '\n' + errs.join('\n') : 'none'}`);
const failed = results.filter((r) => !r.ok);
console.log(`SUMMARY: ${results.length - failed.length}/${results.length} checks passed`);
await browser.close();
process.exit(failed.length ? 1 : 0);
