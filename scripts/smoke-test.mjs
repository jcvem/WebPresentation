import puppeteer from 'puppeteer-core';
import { preview } from 'vite';

async function runSmokeTest() {
  console.log('--- Starting Deterministic Browser Smoke Test ---');

  // 1. Start Vite preview server on dedicated port 5199
  const previewServer = await preview({
    preview: {
      port: 5199,
      host: '127.0.0.1'
    }
  });

  const url = 'http://127.0.0.1:5199';
  console.log(`Preview server running at ${url}`);

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  console.log(`Launching Chrome at ${chromePath}...`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });

  try {
    const page = await browser.newPage();

    // 2. Desktop Test (1440x900)
    console.log('\n[Test 1] Desktop Viewport (1440x900)');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Verify Title
    const title = await page.title();
    console.log(`Page title: "${title}"`);
    if (!title.includes('Objects in Motion')) {
      throw new Error(`Expected title to include "Objects in Motion", got "${title}"`);
    }

    // Verify 6 slides rendered
    const slideCount = await page.$$eval('.slide', (els) => els.length);
    console.log(`Rendered slides count: ${slideCount}`);
    if (slideCount !== 6) {
      throw new Error(`Expected 6 slides, found ${slideCount}`);
    }

    // Verify 3D Canvas
    const canvasDimensions = await page.$eval('#object-canvas', (c) => ({
      width: c.width,
      height: c.height,
      clientWidth: c.clientWidth,
      clientHeight: c.clientHeight
    }));
    console.log('Canvas dimensions:', canvasDimensions);
    if (canvasDimensions.width <= 0 || canvasDimensions.height <= 0) {
      throw new Error('Canvas dimensions are non-positive');
    }

    // Verify Initial Indicator
    let indicatorText = await page.$eval('#hdr-slide-num', (el) => el.textContent.trim());
    console.log(`Initial slide indicator: "${indicatorText}"`);
    if (indicatorText !== '01 / 06') {
      throw new Error(`Expected initial indicator "01 / 06", got "${indicatorText}"`);
    }

    // Verify Screen Reader Announcer
    const announcerText = await page.$eval('#slide-announcer', (el) => el.textContent.trim());
    console.log(`Screen reader announcement: "${announcerText}"`);
    if (!announcerText.includes('Slide 1 of 6')) {
      throw new Error(`Expected announcer to have "Slide 1 of 6", got "${announcerText}"`);
    }

    // Verify Next Button Click Navigation
    console.log('Testing Next button navigation...');
    await page.click('#btn-hdr-next');
    await page.waitForFunction(() => document.getElementById('hdr-slide-num')?.textContent?.trim() === '02 / 06');
    indicatorText = await page.$eval('#hdr-slide-num', (el) => el.textContent.trim());
    console.log(`After Next click, indicator is: "${indicatorText}"`);

    // Verify Keyboard Navigation (ArrowDown)
    console.log('Testing Keyboard ArrowDown navigation...');
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => document.getElementById('hdr-slide-num')?.textContent?.trim() === '03 / 06');
    indicatorText = await page.$eval('#hdr-slide-num', (el) => el.textContent.trim());
    console.log(`After ArrowDown, indicator is: "${indicatorText}"`);

    // Verify Slide 4 System Assemblies
    console.log('Testing Slide 4 (System exploded parts)...');
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => document.getElementById('hdr-slide-num')?.textContent?.trim() === '04 / 06');
    const systemParts = await page.$$eval('.system-part-card', (els) => els.length);
    console.log(`Slide 4 system assemblies count: ${systemParts}`);
    if (systemParts !== 3) {
      throw new Error(`Expected 3 labeled assemblies, got ${systemParts}`);
    }

    // Advance to Slide 5 and Slide 6
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => document.getElementById('hdr-slide-num')?.textContent?.trim() === '05 / 06');

    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => document.getElementById('hdr-slide-num')?.textContent?.trim() === '06 / 06');
    indicatorText = await page.$eval('#hdr-slide-num', (el) => el.textContent.trim());
    console.log(`Reached closing slide: "${indicatorText}"`);

    // Verify Restart Button on Slide 6
    console.log('Testing Restart action on closing slide...');
    await page.click('#btn-restart-action');
    await page.waitForFunction(() => document.getElementById('hdr-slide-num')?.textContent?.trim() === '01 / 06');
    indicatorText = await page.$eval('#hdr-slide-num', (el) => el.textContent.trim());
    console.log(`After restart, indicator reset to: "${indicatorText}"`);

    // Verify Reduced Motion Toggle
    console.log('Testing Reduced Motion toggle button...');
    await page.click('#btn-hdr-motion');
    const hasReducedMotionClass = await page.evaluate(() => document.documentElement.classList.contains('reduced-motion'));
    console.log(`Document has 'reduced-motion' class: ${hasReducedMotionClass}`);
    if (!hasReducedMotionClass) {
      throw new Error('Expected documentElement to have reduced-motion class');
    }

    // Check Desktop Horizontal Overflow
    const desktopOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth
    }));
    console.log('Desktop 1440px overflow check:', desktopOverflow);
    if (desktopOverflow.hasOverflow) {
      throw new Error(`Desktop has horizontal overflow! scrollWidth: ${desktopOverflow.scrollWidth}, innerWidth: ${desktopOverflow.innerWidth}`);
    }

    // 3. Tablet Viewport (768x1024)
    console.log('\n[Test 2] Tablet Viewport (768x1024)');
    await page.setViewport({ width: 768, height: 1024 });
    await page.reload({ waitUntil: 'networkidle0' });

    const tabletOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth
    }));
    console.log('Tablet 768px overflow check:', tabletOverflow);
    if (tabletOverflow.hasOverflow) {
      throw new Error(`Tablet has horizontal overflow! scrollWidth: ${tabletOverflow.scrollWidth}, innerWidth: ${tabletOverflow.innerWidth}`);
    }

    // 4. Mobile Viewport (390x844 - iPhone 14/15)
    console.log('\n[Test 3] Mobile Viewport (390x844)');
    await page.setViewport({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'networkidle0' });

    const mobileOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth
    }));
    console.log('Mobile 390px overflow check:', mobileOverflow);
    if (mobileOverflow.hasOverflow) {
      throw new Error(`Mobile 390px has horizontal overflow! scrollWidth: ${mobileOverflow.scrollWidth}, innerWidth: ${mobileOverflow.innerWidth}`);
    }

    // Check touch target sizes on mobile
    const navButtons = await page.$$eval('.btn-nav, .btn-ctrl, .action-btn', (els) => {
      return els.map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          id: el.id || el.className,
          w: Math.round(rect.width),
          h: Math.round(rect.height)
        };
      });
    });
    console.log(`Audited ${navButtons.length} interactive buttons on mobile; sample sizes:`, navButtons.slice(0, 4));

    console.log('\n✓ ALL BROWSER SMOKE TESTS PASSED DETERMINISTICALLY!');
  } finally {
    await browser.close();
    previewServer.httpServer.close();
  }
}

runSmokeTest().catch((err) => {
  console.error('\n❌ SMOKE TEST FAILED:', err);
  process.exit(1);
});
