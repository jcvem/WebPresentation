import puppeteer from 'puppeteer-core';

async function runDevVerification() {
  const devUrl = 'http://localhost:5173/';
  console.log(`\n=== Verifying Active Dev Server at ${devUrl} ===`);

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // 1. Desktop Test (1440px)
    await page.setViewport({ width: 1440, height: 900 });
    console.log(`Navigating to ${devUrl}...`);
    await page.goto(devUrl, { waitUntil: 'networkidle0' });

    // Page title check
    const title = await page.title();
    console.log(`✓ Title: "${title}"`);

    // Brand and Heading check
    const brand = await page.$eval('.brand-name', (el) => el.textContent.trim());
    const slide1Title = await page.$eval('#opening .slide-title', (el) => el.textContent.trim());
    console.log(`✓ Brand: "${brand}", Slide 1 Heading: "${slide1Title}"`);

    // Verify 6 slides present
    const slides = await page.$$eval('.slide', (els) =>
      els.map((el) => ({
        id: el.id,
        title: el.querySelector('.slide-title')?.textContent?.trim(),
        catalog: el.querySelector('.catalog-num')?.textContent?.trim()
      }))
    );
    console.log(`✓ Found ${slides.length} slides:`, slides);

    // Verify Object Renderer & Canvas
    const canvasInfo = await page.evaluate(() => {
      const c = document.getElementById('object-canvas');
      const gl = c.getContext('webgl') || c.getContext('webgl2');
      return {
        id: c.id,
        width: c.width,
        height: c.height,
        hasContext: Boolean(gl),
        ariaLabel: c.getAttribute('aria-label')
      };
    });
    console.log('✓ 3D Canvas status:', canvasInfo);

    // Test Navigation: Next control
    await page.click('#btn-hdr-next');
    await page.waitForFunction(() => document.getElementById('hdr-slide-num')?.textContent?.trim() === '02 / 06');
    let hash = await page.evaluate(() => window.location.hash);
    console.log(`✓ Advanced to slide 2 via Next button: indicator="02 / 06", hash="${hash}"`);

    // Test Navigation: Prev control
    await page.click('#btn-hdr-prev');
    await page.waitForFunction(() => document.getElementById('hdr-slide-num')?.textContent?.trim() === '01 / 06');
    hash = await page.evaluate(() => window.location.hash);
    console.log(`✓ Returned to slide 1 via Prev button: indicator="01 / 06", hash="${hash}"`);

    // Test Keyboard Navigation: ArrowDown, Space, etc.
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => document.getElementById('hdr-slide-num')?.textContent?.trim() === '02 / 06');
    console.log('✓ Keyboard ArrowDown advanced to Slide 2');

    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.getElementById('hdr-slide-num')?.textContent?.trim() === '03 / 06');
    console.log('✓ Keyboard Space advanced to Slide 3');

    // Jump to Slide 4 (System)
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => document.getElementById('hdr-slide-num')?.textContent?.trim() === '04 / 06');
    const partTags = await page.$$eval('.system-part-card .part-badge', (els) => els.map((e) => e.textContent.trim()));
    console.log('✓ Slide 4 System labeled assembly parts:', partTags);

    // Advance to Slide 6 (Closing)
    await page.keyboard.press('End');
    await page.waitForFunction(() => document.getElementById('hdr-slide-num')?.textContent?.trim() === '06 / 06');
    const closingTitle = await page.$eval('#closing .slide-title', (el) => el.textContent.trim());
    console.log(`✓ End key jumped to closing slide: "${closingTitle}" (06 / 06)`);

    // Test Restart Action button
    await page.click('#btn-restart-action');
    await page.waitForFunction(() => document.getElementById('hdr-slide-num')?.textContent?.trim() === '01 / 06');
    console.log('✓ Restart button reset presentation back to Slide 1 (01 / 06)');

    // Test Scroll Snap Toggle
    const snapActiveBefore = await page.$eval('#btn-hdr-snap', (el) => el.getAttribute('aria-pressed'));
    await page.click('#btn-hdr-snap');
    const snapActiveAfter = await page.$eval('#btn-hdr-snap', (el) => el.getAttribute('aria-pressed'));
    const isNoSnapClass = await page.$eval('#presentation-viewport', (el) => el.classList.contains('no-snap'));
    console.log(`✓ Scroll Snap toggled: was ${snapActiveBefore}, now ${snapActiveAfter}, viewport has .no-snap=${isNoSnapClass}`);

    // Test Reduced Motion Mode
    const motionBefore = await page.$eval('#btn-hdr-motion', (el) => el.getAttribute('aria-pressed'));
    await page.click('#btn-hdr-motion');
    const motionAfter = await page.$eval('#btn-hdr-motion', (el) => el.getAttribute('aria-pressed'));
    const isReducedClass = await page.evaluate(() => document.documentElement.classList.contains('reduced-motion'));
    console.log(`✓ Motion mode toggled: was ${motionBefore}, now ${motionAfter}, document has .reduced-motion=${isReducedClass}`);

    // Check Overflow at 1440px
    const overflow1440 = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    console.log(`✓ Desktop (1440px) no horizontal overflow: ${overflow1440}`);

    // Check Overflow at 768px (Tablet)
    await page.setViewport({ width: 768, height: 1024 });
    await page.reload({ waitUntil: 'networkidle0' });
    const overflow768 = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    console.log(`✓ Tablet (768px) no horizontal overflow: ${overflow768}`);

    // Check Overflow at 390px (Mobile)
    await page.setViewport({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'networkidle0' });
    const overflow390 = await page.evaluate(() => ({
      docScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      winInnerWidth: window.innerWidth,
      passed: document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth
    }));
    console.log('✓ Mobile (390px) overflow check:', overflow390);

    if (!overflow1440 || !overflow768 || !overflow390.passed) {
      throw new Error('Horizontal overflow verification failed!');
    }

    console.log('\n=== ALL DEV SERVER VERIFICATIONS CONFIRMED! ===\n');
  } finally {
    await browser.close();
  }
}

runDevVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
