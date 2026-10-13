import { SlideData } from '../slides/slide-data';
import { RecordingSettings } from './types';

export class CompositionRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(settings: RecordingSettings) {
    this.width = settings.outputWidth;
    this.height = settings.outputHeight;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.id = 'composition-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.left = '-99999px';
    this.canvas.style.top = '-99999px';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.opacity = '0';
    this.canvas.setAttribute('aria-hidden', 'true');

    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(this.canvas);
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not acquire 2D rendering context for composition canvas.');
    }
    this.ctx = ctx;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public captureStream(fps: number): MediaStream {
    return this.canvas.captureStream(fps);
  }

  public renderFrame(
    currentSlide: SlideData,
    nextSlide: SlideData | null,
    transitionProgress: number,
    slideIndex: number,
    totalSlides: number,
    webglCanvas: HTMLCanvasElement | null
  ): void {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;
    const s = W / 1280; // Scale relative to 1280x720 base

    // 1. Dark Obsidian Canvas Base
    ctx.fillStyle = '#090a0d';
    ctx.fillRect(0, 0, W, H);

    // 2. Architectural Reticle & Crosshairs
    this.drawReticle(ctx, W, H, s);

    // 3. Render 3D Kinetic Subject (from WebGL canvas)
    if (webglCanvas && webglCanvas.width > 0 && webglCanvas.height > 0) {
      const dim = Math.min(W * 0.64, H * 0.94);
      const cx = W * 0.65;
      const cy = H * 0.52;
      ctx.drawImage(webglCanvas, cx - dim / 2, cy - dim / 2, dim, dim);
    }

    // 4. Header Bar & Progress Rail
    this.drawHeader(ctx, currentSlide, slideIndex, totalSlides, transitionProgress, W, s);

    // 5. Editorial Content (with smooth cross-fade during transitions)
    const contentX = 54 * s;
    const contentW = W * 0.42;
    const contentY = 88 * s;

    if (nextSlide && transitionProgress > 0) {
      // Outgoing slide
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - transitionProgress);
      this.drawSlideEditorial(ctx, currentSlide, contentX, contentY, contentW, H, s);
      ctx.restore();

      // Incoming slide
      ctx.save();
      ctx.globalAlpha = Math.min(1, transitionProgress);
      this.drawSlideEditorial(ctx, nextSlide, contentX, contentY, contentW, H, s);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = 1.0;
      this.drawSlideEditorial(ctx, currentSlide, contentX, contentY, contentW, H, s);
      ctx.restore();
    }
  }

  private drawReticle(ctx: CanvasRenderingContext2D, W: number, H: number, s: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    // Center vertical and horizontal hairlines
    const cx = W * 0.65;
    const cy = H * 0.52;

    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, H);
    ctx.moveTo(0, cy);
    ctx.lineTo(W, cy);
    ctx.stroke();

    // Concentric calibration rings
    ctx.beginPath();
    ctx.arc(cx, cy, 180 * s, 0, Math.PI * 2);
    ctx.arc(cx, cy, 320 * s, 0, Math.PI * 2);
    ctx.stroke();

    // Left division rule separating text from 3D zone
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(W * 0.49, 48 * s);
    ctx.lineTo(W * 0.49, H - 48 * s);
    ctx.stroke();

    ctx.restore();
  }

  private drawHeader(
    ctx: CanvasRenderingContext2D,
    currentSlide: SlideData,
    slideIndex: number,
    totalSlides: number,
    transitionProgress: number,
    W: number,
    s: number
  ): void {
    const headerH = 46 * s;

    // Header background & border
    ctx.fillStyle = 'rgba(9, 10, 13, 0.92)';
    ctx.fillRect(0, 0, W, headerH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, headerH);
    ctx.lineTo(W, headerH);
    ctx.stroke();

    // Left brand dot + name
    ctx.fillStyle = '#e05a36';
    ctx.beginPath();
    ctx.arc(42 * s, headerH / 2, 3.5 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f0eee9';
    ctx.font = `700 ${Math.round(12 * s)}px 'Syne', -apple-system, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('OBJECTS IN MOTION', 54 * s, headerH / 2);

    ctx.fillStyle = '#525866';
    ctx.font = `500 ${Math.round(10 * s)}px 'JetBrains Mono', monospace`;
    ctx.fillText('EST. 2026 / STUDY 04', 216 * s, headerH / 2);

    // Center slide indicator
    const currentNumStr = `0${slideIndex + 1}`;
    const totalNumStr = `0${totalSlides}`;
    ctx.fillStyle = '#e05a36';
    ctx.font = `600 ${Math.round(11 * s)}px 'JetBrains Mono', monospace`;
    ctx.fillText(`${currentNumStr} / ${totalNumStr}`, W * 0.48, headerH / 2);

    ctx.fillStyle = '#525866';
    ctx.fillText('·', W * 0.48 + 58 * s, headerH / 2);

    ctx.fillStyle = '#8e94a0';
    ctx.font = `600 ${Math.round(11 * s)}px 'JetBrains Mono', monospace`;
    ctx.fillText(currentSlide.title.toUpperCase(), W * 0.48 + 72 * s, headerH / 2);

    // Right export badge
    ctx.fillStyle = '#525866';
    ctx.font = `500 ${Math.round(10 * s)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'right';
    ctx.fillText('KINETIC MONOGRAPH RECORDING', W - 36 * s, headerH / 2);
    ctx.textAlign = 'left';

    // Progress bar along header bottom edge
    const progTrackH = 2 * s;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, headerH - progTrackH, W, progTrackH);

    const progressRatio = (slideIndex + Math.max(0, transitionProgress)) / totalSlides;
    ctx.fillStyle = '#e05a36';
    ctx.fillRect(0, headerH - progTrackH, W * Math.min(1, Math.max(0.01, progressRatio)), progTrackH);
  }

  private drawSlideEditorial(
    ctx: CanvasRenderingContext2D,
    slide: SlideData,
    x: number,
    y: number,
    maxWidth: number,
    H: number,
    s: number
  ): void {
    let curY = y;

    // 1. Catalog Plate Badge
    ctx.font = `600 ${Math.round(12 * s)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#e05a36';
    ctx.textBaseline = 'top';
    ctx.fillText(slide.catalogNumber, x, curY);

    // Rule separator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 115 * s, curY + 7 * s);
    ctx.lineTo(x + 145 * s, curY + 7 * s);
    ctx.stroke();

    // Super title
    ctx.font = `600 ${Math.round(10 * s)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#525866';
    ctx.fillText(slide.superTitle.toUpperCase(), x + 155 * s, curY + 1 * s);

    curY += 28 * s;

    // 2. Slide Title
    ctx.font = `700 ${Math.round(38 * s)}px 'Syne', -apple-system, sans-serif`;
    ctx.fillStyle = '#f0eee9';
    curY = this.drawWrappedText(ctx, slide.title, x, curY, maxWidth, 44 * s);
    curY += 12 * s;

    // 3. Slide Thesis
    ctx.font = `400 ${Math.round(15 * s)}px 'Space Grotesk', -apple-system, sans-serif`;
    ctx.fillStyle = '#8e94a0';
    curY = this.drawWrappedText(ctx, slide.thesis, x, curY, maxWidth, 23 * s);
    curY += 22 * s;

    // 4. Slide Specific Content Block
    if (slide.body) {
      // Plate 2: Body text with cinnabar accent bar
      ctx.fillStyle = '#e05a36';
      ctx.fillRect(x, curY, 3 * s, 48 * s);

      ctx.font = `400 ${Math.round(13.5 * s)}px 'Space Grotesk', -apple-system, sans-serif`;
      ctx.fillStyle = '#f0eee9';
      this.drawWrappedText(ctx, slide.body, x + 14 * s, curY, maxWidth - 16 * s, 20 * s);
    } else if (slide.sequence) {
      // Plate 3: Motion Sequence Steps
      let stepY = curY;
      for (const step of slide.sequence) {
        ctx.fillStyle = 'rgba(17, 19, 23, 0.55)';
        ctx.fillRect(x, stepY, maxWidth, 38 * s);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeRect(x, stepY, maxWidth, 38 * s);

        ctx.font = `600 ${Math.round(11 * s)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#e05a36';
        ctx.fillText(step.index, x + 10 * s, stepY + 8 * s);

        ctx.font = `600 ${Math.round(12 * s)}px 'Syne', sans-serif`;
        ctx.fillStyle = '#f0eee9';
        ctx.fillText(step.title.toUpperCase(), x + 38 * s, stepY + 6 * s);

        ctx.font = `400 ${Math.round(11 * s)}px 'Space Grotesk', sans-serif`;
        ctx.fillStyle = '#8e94a0';
        ctx.fillText(step.detail, x + 38 * s, stepY + 21 * s);

        stepY += 44 * s;
      }
    } else if (slide.components) {
      // Plate 4: Constituent Assemblies
      let compY = curY;
      for (const comp of slide.components) {
        ctx.fillStyle = 'rgba(17, 19, 23, 0.65)';
        ctx.fillRect(x, compY, maxWidth, 40 * s);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeRect(x, compY, maxWidth, 40 * s);

        // Badge
        ctx.fillStyle = 'rgba(224, 90, 54, 0.16)';
        ctx.fillRect(x + 8 * s, compY + 8 * s, 22 * s, 22 * s);
        ctx.strokeStyle = 'rgba(224, 90, 54, 0.40)';
        ctx.strokeRect(x + 8 * s, compY + 8 * s, 22 * s, 22 * s);
        ctx.font = `700 ${Math.round(11 * s)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#e05a36';
        ctx.fillText(comp.tag, x + 14 * s, compY + 13 * s);

        ctx.font = `600 ${Math.round(12 * s)}px 'Syne', sans-serif`;
        ctx.fillStyle = '#f0eee9';
        ctx.fillText(comp.name, x + 38 * s, compY + 8 * s);

        ctx.font = `400 ${Math.round(11 * s)}px 'Space Grotesk', sans-serif`;
        ctx.fillStyle = '#8e94a0';
        ctx.fillText(comp.description, x + 38 * s, compY + 23 * s);

        compY += 46 * s;
      }
    } else if (slide.takeaway) {
      // Plate 5 & 6: Takeaways
      ctx.fillStyle = 'rgba(17, 19, 23, 0.45)';
      ctx.fillRect(x, curY, maxWidth, 58 * s);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, curY);
      ctx.lineTo(x, curY + 58 * s);
      ctx.stroke();

      ctx.font = `400 ${Math.round(13.5 * s)}px 'Space Grotesk', -apple-system, sans-serif`;
      ctx.fillStyle = '#f0eee9';
      this.drawWrappedText(ctx, slide.takeaway, x + 14 * s, curY + 8 * s, maxWidth - 24 * s, 19 * s);
    }

    // 5. Technical Metadata Items (Footer)
    if (slide.metadata && slide.metadata.length > 0) {
      const footerY = H - 62 * s;

      // Divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, footerY);
      ctx.lineTo(x + maxWidth, footerY);
      ctx.stroke();

      let metaX = x;
      for (const item of slide.metadata) {
        ctx.font = `500 ${Math.round(9 * s)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#525866';
        ctx.fillText(item.label, metaX, footerY + 12 * s);

        ctx.font = `600 ${Math.round(11 * s)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#8e94a0';
        ctx.fillText(item.value, metaX, footerY + 26 * s);

        metaX += 130 * s;
      }
    }
  }

  private drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): number {
    const words = text.split(' ');
    let line = '';
    let curY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, curY);
        line = words[n] + ' ';
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, curY);
    return curY + lineHeight;
  }

  public destroy(): void {
    if (this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
  }
}
