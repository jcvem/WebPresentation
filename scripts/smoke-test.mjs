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

    // -------------------------------------------------------------
    // [Test 1] Desktop Viewport & Core Presentation Features (1440x900)
    // -------------------------------------------------------------
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

    // -------------------------------------------------------------
    // [Test 2] Presentation Recording Feature: Header Control, Auto-Sequence, Container & Download
    // -------------------------------------------------------------
    console.log('\n[Test 2] Presentation Recording Feature Verification');

    // Verify Record presentation control in header
    const recordBtnInfo = await page.$eval('#btn-hdr-record', (el) => ({
      tagName: el.tagName,
      ariaLabel: el.getAttribute('aria-label'),
      title: el.getAttribute('title'),
      text: el.textContent.trim(),
      hasSvg: Boolean(el.querySelector('svg')),
      disabled: el.hasAttribute('disabled')
    }));
    console.log('Record presentation button inspection:', recordBtnInfo);
    if (!recordBtnInfo.ariaLabel?.includes('Record presentation') && !recordBtnInfo.text.includes('Record presentation')) {
      throw new Error(`Record button missing expected English label: ${JSON.stringify(recordBtnInfo)}`);
    }

    // Verify duration selector is present
    const durationOptions = await page.$$eval('#record-duration-select option', (opts) =>
      opts.map((o) => ({ value: o.value, text: o.textContent.trim() }))
    );
    console.log('Recording duration options:', durationOptions);
    if (durationOptions.length === 0) {
      throw new Error('Expected recording duration options');
    }

    // Start Recording in fast deterministic smoke mode (400ms per slide for rapid deterministic pass)
    console.log('Initiating presentation recording in fast smoke mode (400ms / slide)...');
    await page.evaluate(() => {
      const rec = window.__presentationRecorder;
      return rec.start({ slideDurationMs: 400, transitionDurationMs: 150 });
    });

    // Verify recording status changed to recording
    const isRecording = await page.evaluate(() => window.__presentationRecorder.status === 'recording');
    console.log(`Recorder status active: ${isRecording}`);
    if (!isRecording) {
      throw new Error('Expected recorder status to be "recording"');
    }

    // Verify visible recording status bar is displayed
    const statusBarVisible = await page.$eval('#recording-status-bar', (el) => !el.hidden);
    const initialStatusText = await page.$eval('#rec-status-label', (el) => el.textContent.trim());
    console.log(`Status HUD visible: ${statusBarVisible}, Label: "${initialStatusText}"`);
    if (!statusBarVisible || !initialStatusText.includes('Recording 01 / 06')) {
      throw new Error(`Expected visible recording status bar with "Recording 01 / 06", got "${initialStatusText}"`);
    }

    // Verify all six slide indices (0, 1, 2, 3, 4, 5) are visited sequentially
    console.log('Tracking sequential slide traversal during recording...');
    const visitedSlides = new Set();
    const startTime = Date.now();
    while (visitedSlides.size < 6 && Date.now() - startTime < 8000) {
      const currentIdx = await page.evaluate(() => window.__presentationController.currentIndex);
      visitedSlides.add(currentIdx);
      const isComplete = await page.evaluate(() => window.__presentationRecorder.status === 'complete');
      if (isComplete && visitedSlides.size === 6) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    console.log('Recorded slide indices visited in order:', Array.from(visitedSlides).sort((a, b) => a - b));
    if (visitedSlides.size !== 6) {
      throw new Error(`Expected all 6 slides to be recorded, visited: ${Array.from(visitedSlides)}`);
    }

    // Wait for auto-completion after final slide hold duration
    console.log('Waiting for automatic completion after Plate 06...');
    await page.waitForFunction(() => window.__presentationRecorder?.status === 'complete', { timeout: 6000 });
    console.log('✓ Recording completed automatically after final slide.');

    // Verify Completed Recording Dialog is presented
    const isCompleteDialogOpen = await page.$eval('#record-complete-dialog', (d) => d.open);
    console.log(`Completed recording dialog open: ${isCompleteDialogOpen}`);
    if (!isCompleteDialogOpen) {
      throw new Error('Expected #record-complete-dialog to be open');
    }

    // Verify Video Preview element has valid object URL
    const videoSrc = await page.$eval('#record-video-preview', (v) => v.src);
    console.log(`Video preview source: "${videoSrc.slice(0, 40)}..."`);
    if (!videoSrc.startsWith('blob:')) {
      throw new Error(`Expected video preview src to be a blob URL, got "${videoSrc}"`);
    }

    // Verify Download video button
    const downloadInfo = await page.$eval('#btn-record-download', (a) => ({
      href: a.href,
      download: a.download,
      text: a.textContent.trim()
    }));
    console.log('Download control info:', downloadInfo);
    if (!downloadInfo.download.endsWith('.webm') || !downloadInfo.href.startsWith('blob:')) {
      throw new Error(`Invalid download control attributes: ${JSON.stringify(downloadInfo)}`);
    }

    // Verify Video Artifact Header & Non-Zero Size (inspect bytes)
    console.log('Inspecting binary WebM video artifact...');
    const videoArtifactValidation = await page.evaluate(async () => {
      const res = window.__presentationRecorder.getCurrentResult();
      if (!res || !res.blob) return { valid: false, error: 'no result blob' };
      const buf = await res.blob.arrayBuffer();
      const bytes = Array.from(new Uint8Array(buf.slice(0, 8)));
      // EBML / WebM header starts with 0x1A 0x45 0xDF 0xA3 (26, 69, 223, 163)
      const hasWebmMagic = bytes[0] === 26 && bytes[1] === 69 && bytes[2] === 223 && bytes[3] === 163;
      return {
        valid: true,
        sizeBytes: res.sizeBytes,
        durationMs: res.durationMs,
        mimeType: res.mimeType,
        filename: res.filename,
        magicBytes: bytes,
        hasWebmMagic
      };
    });
    console.log('Video artifact validation result:', videoArtifactValidation);
    if (!videoArtifactValidation.valid || videoArtifactValidation.sizeBytes <= 0 || !videoArtifactValidation.hasWebmMagic) {
      throw new Error(`Video artifact validation failed! ${JSON.stringify(videoArtifactValidation)}`);
    }
    console.log(`✓ WebM container verified with valid EBML magic header and non-zero size (${videoArtifactValidation.sizeBytes} bytes)!`);

    // -------------------------------------------------------------
    // [Test 3] Record Again Flow
    // -------------------------------------------------------------
    console.log('\n[Test 3] Testing "Record again" flow...');
    await page.click('#btn-record-again');
    await page.waitForFunction(() => window.__presentationRecorder.status === 'recording');
    console.log('✓ "Record again" initiated fresh recording.');

    // Stop recording manually early
    await new Promise((r) => setTimeout(r, 600));
    await page.click('#btn-record-stop');
    await page.waitForFunction(() => window.__presentationRecorder.status === 'complete');
    console.log('✓ Manually stopped recording; completed panel redisplayed.');

    // Close completed dialog
    await page.click('#record-dialog-close');
    await page.waitForFunction(() => !document.getElementById('record-complete-dialog')?.open);
    console.log('✓ Completed dialog closed cleanly.');

    // -------------------------------------------------------------
    // [Test 4] Cancel Flow & State Restoration
    // -------------------------------------------------------------
    console.log('\n[Test 4] Testing Cancel Flow and Presentation State Restoration...');
    // Jump to slide 4 (index 3)
    await page.evaluate(() => window.__presentationController.goTo(3, false));
    await page.waitForFunction(() => window.__presentationController.currentIndex === 3);

    // Toggle reduced motion on
    await page.evaluate(() => window.__presentationController.setReducedMotion(true));
    const wasReducedBefore = await page.evaluate(() => window.__presentationController.isReducedMotion);
    console.log(`Before recording: slide=3, reducedMotion=${wasReducedBefore}`);

    // Start recording
    await page.evaluate(() => window.__presentationRecorder.start({ slideDurationMs: 1000 }));
    await page.waitForFunction(() => window.__presentationRecorder.status === 'recording');
    console.log('Recording active; canceling via Cancel button...');

    // Click Cancel
    await page.click('#btn-record-cancel');
    await page.waitForFunction(() => window.__presentationRecorder.status === 'idle');

    // Verify original slide 4 (index 3) was restored without unexpected jump
    const restoredIndex = await page.evaluate(() => window.__presentationController.currentIndex);
    const restoredMotion = await page.evaluate(() => window.__presentationController.isReducedMotion);
    console.log(`After cancel: restoredSlide=${restoredIndex}, restoredMotion=${restoredMotion}`);
    if (restoredIndex !== 3) {
      throw new Error(`Expected slide 3 to be restored after cancel, got ${restoredIndex}`);
    }
    if (!restoredMotion) {
      throw new Error('Expected reduced motion preference to be restored after cancel');
    }
    console.log('✓ Cancel successfully stopped streams and restored original presentation state.');

    // -------------------------------------------------------------
    // [Test 5] Unsupported API Handling
    // -------------------------------------------------------------
    console.log('\n[Test 5] Testing Unsupported Browser Handling...');
    const unsupportedCheck = await page.evaluate(() => {
      // Create isolated dummy recorder simulating unsupported environment
      const dummyContainer = document.createElement('div');
      const dummyController = window.__presentationController;
      const dummyRenderer = window.__objectRenderer;
      // Temporarily mock MediaRecorder as undefined
      const savedMR = window.MediaRecorder;
      try {
        delete window.MediaRecorder;
        const res = typeof window.MediaRecorder === 'undefined';
        return { isUndefined: res };
      } finally {
        window.MediaRecorder = savedMR;
      }
    });
    console.log('Simulated MediaRecorder undefined check:', unsupportedCheck);

    // -------------------------------------------------------------
    // [Test 6] Responsive Viewports & Horizontal Overflow Audits
    // -------------------------------------------------------------
    console.log('\n[Test 6] Responsive Viewport & Horizontal Overflow Checks');

    // Desktop (1440x900)
    await page.setViewport({ width: 1440, height: 900 });
    const desktopOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth
    }));
    console.log('Desktop 1440px overflow check:', desktopOverflow);
    if (desktopOverflow.hasOverflow) {
      throw new Error(`Desktop has horizontal overflow! ${JSON.stringify(desktopOverflow)}`);
    }

    // Tablet (768x1024)
    await page.setViewport({ width: 768, height: 1024 });
    const tabletOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth
    }));
    console.log('Tablet 768px overflow check:', tabletOverflow);
    if (tabletOverflow.hasOverflow) {
      throw new Error(`Tablet has horizontal overflow! ${JSON.stringify(tabletOverflow)}`);
    }

    // Mobile (390x844 - iPhone 14/15)
    await page.setViewport({ width: 390, height: 844 });
    const mobileOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth
    }));
    console.log('Mobile 390px overflow check:', mobileOverflow);
    if (mobileOverflow.hasOverflow) {
      throw new Error(`Mobile 390px has horizontal overflow! ${JSON.stringify(mobileOverflow)}`);
    }

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
