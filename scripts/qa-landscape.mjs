// QA landscape: joystick + action buttons + gameplay start
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';

const run = async () => {
  const browser = await chromium.launch();
  // landscape phone — explicit viewport (device `landscape` flag is unreliable
  // with headless shell)
  const ctx = await browser.newContext({
    viewport: { width: 915, height: 412 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: devices['Pixel 7'].userAgent,
    locale: 'id-ID',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  page.on('crash', () => errors.push('PAGE_CRASHED'));

  // keep the sim honest: fail fast on navigation issues
  page.setDefaultTimeout(5000);

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  const start = page.locator('.menu button.active').first();
  await start.click({ force: true });
  await page.waitForTimeout(3000);

  // advance opening: keep clicking; when a choice appears pick option 2; loop
  // until the joystick (GAMEPLAY indicator) appears or we run out of patience
  let stickBox = null;
  for (let i = 0; i < 40 && !stickBox; i++) {
    try {
      const choice = page.locator('.choices button').first();
      const hasChoice = (await choice.count()) > 0;
      if (hasChoice) {
        await choice.tap({ timeout: 3000 }).catch(() => choice.click({ force: true, timeout: 3000 }).catch(() => {}));
      } else {
        // tap low-left on the dialogue overlay (canvas center taps can grab
        // pointer-lock paths in headless)
        await page.touchscreen.tap(300, 200);
      }
      await page.waitForTimeout(260);
      stickBox = await page.locator('.tc-stick').boundingBox().catch(() => null);
      console.log(`iter ${i}: choice=${hasChoice} stick=${!!stickBox}`);
    } catch (e) {
      console.log(`iter ${i} error:`, String(e).slice(0, 120));
      break;
    }
  }
  await page.screenshot({ path: 'qa/l-01-gameplay.png' });

  // try joystick drag (bottom-left area)
  if (stickBox) {
    const cx = stickBox.x + stickBox.width / 2;
    const cy = stickBox.y + stickBox.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 30, cy - 40, { steps: 8 }); // forward-left
    await page.waitForTimeout(900);
    await page.screenshot({ path: 'qa/l-02-joystick.png' });
    await page.mouse.up();
  }

  console.log("STICK_VISIBLE:", !!stickBox);
  console.log('PAGE_ERRORS:', errors.length ? errors : 'none');
  await browser.close();
};

run().catch((e) => { console.error(e); process.exit(1); });
