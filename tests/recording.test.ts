import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSupportedMimeType,
  isRecordingSupported,
  generateRecordingFilename,
  formatBytes,
  formatDuration,
  hasValidWebmHeader,
  CANDIDATE_MIME_TYPES
} from '../src/recorder/mime-utils';
import { PresentationRecorder } from '../src/recorder/presentation-recorder';
import { CompositionRenderer } from '../src/recorder/composition-renderer';
import { PresentationController } from '../src/controller/presentation-controller';
import { ObjectRenderer } from '../src/renderer/object-renderer';
import { SLIDES } from '../src/slides/slide-data';
import { RecordingLifecycleEvent } from '../src/recorder/types';
import { CURATED_THEMES } from '../src/themes/theme-manager';

describe('MIME Selection & Utilities', () => {
  it('should select VP9 when available as highest priority', () => {
    const mockMR = {
      isTypeSupported: (type: string) => type === 'video/webm;codecs=vp9' || type === 'video/webm'
    } as unknown as typeof MediaRecorder;

    const mime = getSupportedMimeType(mockMR);
    expect(mime).toBe('video/webm;codecs=vp9');
  });

  it('should fall back to VP8 when VP9 is unsupported', () => {
    const mockMR = {
      isTypeSupported: (type: string) => type === 'video/webm;codecs=vp8' || type === 'video/webm'
    } as unknown as typeof MediaRecorder;

    const mime = getSupportedMimeType(mockMR);
    expect(mime).toBe('video/webm;codecs=vp8');
  });

  it('should fall back to generic video/webm when codecs are not supported', () => {
    const mockMR = {
      isTypeSupported: (type: string) => type === 'video/webm'
    } as unknown as typeof MediaRecorder;

    const mime = getSupportedMimeType(mockMR);
    expect(mime).toBe('video/webm');
  });

  it('should fall back to MP4 when WebM is completely unsupported', () => {
    const mockMR = {
      isTypeSupported: (type: string) => type === 'video/mp4;codecs=avc1'
    } as unknown as typeof MediaRecorder;

    const mime = getSupportedMimeType(mockMR);
    expect(mime).toBe('video/mp4;codecs=avc1');
  });

  it('should return null when no candidate format is supported', () => {
    const mockMR = {
      isTypeSupported: () => false
    } as unknown as typeof MediaRecorder;

    const mime = getSupportedMimeType(mockMR);
    expect(mime).toBeNull();
  });

  it('should return null when MediaRecorder is undefined or missing isTypeSupported', () => {
    expect(getSupportedMimeType(undefined)).toBeNull();
    expect(getSupportedMimeType({} as unknown as typeof MediaRecorder)).toBeNull();
  });
});

describe('Browser Capability & Unsupported Detection', () => {
  it('should report supported when MediaRecorder and captureStream are present with a valid MIME', () => {
    const mockWin = {
      MediaRecorder: {
        isTypeSupported: (t: string) => t === 'video/webm'
      } as unknown as typeof MediaRecorder,
      HTMLCanvasElement: {
        prototype: {
          captureStream: () => ({} as MediaStream)
        }
      } as unknown as typeof HTMLCanvasElement
    };

    expect(isRecordingSupported(mockWin)).toBe(true);
  });

  it('should report unsupported when MediaRecorder is absent', () => {
    const mockWin = {
      HTMLCanvasElement: {
        prototype: {
          captureStream: () => ({} as MediaStream)
        }
      } as unknown as typeof HTMLCanvasElement
    };

    expect(isRecordingSupported(mockWin)).toBe(false);
  });

  it('should report unsupported when captureStream is absent', () => {
    const mockWin = {
      MediaRecorder: {
        isTypeSupported: () => true
      } as unknown as typeof MediaRecorder,
      HTMLCanvasElement: {
        prototype: {}
      } as unknown as typeof HTMLCanvasElement
    };

    expect(isRecordingSupported(mockWin)).toBe(false);
  });

  it('should report unsupported when no MIME type is accepted', () => {
    const mockWin = {
      MediaRecorder: {
        isTypeSupported: () => false
      } as unknown as typeof MediaRecorder,
      HTMLCanvasElement: {
        prototype: {
          captureStream: () => ({} as MediaStream)
        }
      } as unknown as typeof HTMLCanvasElement
    };

    expect(isRecordingSupported(mockWin)).toBe(false);
  });
});

describe('Filename & Format Utilities', () => {
  it('should generate consistent timestamped WebM filenames', () => {
    const fixedDate = new Date(2026, 9, 13, 8, 4, 38); // Oct 13, 2026 08:04:38
    const filename = generateRecordingFilename('video/webm;codecs=vp9', fixedDate);
    expect(filename).toBe('objects-in-motion-presentation-20261013-080438.webm');
  });

  it('should generate MP4 extension when MP4 MIME is supplied', () => {
    const fixedDate = new Date(2026, 9, 13, 8, 4, 38);
    const filename = generateRecordingFilename('video/mp4;codecs=avc1', fixedDate);
    expect(filename).toBe('objects-in-motion-presentation-20261013-080438.mp4');
  });

  it('should format bytes accurately', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.50 KB');
    expect(formatBytes(1048576 * 2.5)).toBe('2.50 MB');
  });

  it('should format duration into MM:SS accurately', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(4200)).toBe('00:04');
    expect(formatDuration(65000)).toBe('01:05');
    expect(formatDuration(125000)).toBe('02:05');
  });

  it('should validate EBML/WebM magic header', () => {
    const validHeader = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81]);
    expect(hasValidWebmHeader(validHeader.buffer)).toBe(true);

    const invalidHeader = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    expect(hasValidWebmHeader(invalidHeader.buffer)).toBe(false);

    const empty = new Uint8Array([]);
    expect(hasValidWebmHeader(empty.buffer)).toBe(false);
  });
});

describe('PresentationRecorder Lifecycle, Transitions & Cleanup', () => {
  let container: HTMLElement;
  let slideElements: HTMLElement[];
  let controller: PresentationController;
  let objectRenderer: ObjectRenderer;
  let mockCanvas: HTMLCanvasElement;
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  class MockMediaStream {
    public tracks: Array<{ stop: () => void }> = [{ stop: vi.fn() }];
    getTracks() {
      return this.tracks;
    }
  }

  class MockMediaRecorder {
    public state: 'inactive' | 'recording' | 'paused' = 'inactive';
    public ondataavailable: ((e: { data: Blob }) => void) | null = null;
    public onstop: (() => void) | null = null;
    public onerror: ((e: ErrorEvent) => void) | null = null;
    public static isTypeSupported = vi.fn().mockReturnValue(true);

    constructor(public stream: MediaStream, public options?: MediaRecorderOptions) {}

    start(_timeslice?: number) {
      this.state = 'recording';
    }

    stop() {
      this.state = 'inactive';
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob(['mock-video-bytes'], { type: 'video/webm' }) });
      }
      if (this.onstop) {
        this.onstop();
      }
    }
  }

  beforeEach(() => {
    vi.useFakeTimers();

    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'presentation-viewport';
    document.body.appendChild(container);

    slideElements = SLIDES.map((slide) => {
      const el = document.createElement('section');
      el.className = 'slide';
      el.id = slide.id;
      el.dataset.index = slide.index.toString();
      el.scrollIntoView = vi.fn();
      container.appendChild(el);
      return el;
    });

    controller = new PresentationController({
      slides: SLIDES,
      container,
      slideElements
    });

    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 400;
    mockCanvas.height = 400;
    objectRenderer = new ObjectRenderer(mockCanvas, SLIDES[0].pose);

    // Mock 2D Canvas context for happy-dom
    const mockCtx2D = {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 50 }),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn()
    };
    (HTMLCanvasElement.prototype as any).getContext = vi.fn().mockImplementation((type: string) => {
      if (type === '2d') return mockCtx2D;
      return null;
    });

    // Mock HTMLCanvasElement.prototype.captureStream
    (HTMLCanvasElement.prototype as any).captureStream = vi.fn().mockImplementation(() => new MockMediaStream());

    // Mock MediaRecorder globally
    (window as any).MediaRecorder = MockMediaRecorder;

    // Mock URL.createObjectURL and URL.revokeObjectURL
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-video-url');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('should initialize with status idle when recording is supported', () => {
    const recorder = new PresentationRecorder({
      slides: SLIDES,
      controller,
      objectRenderer
    });

    expect(recorder.status).toBe('idle');
  });

  it('should initialize with status unsupported when MediaRecorder is absent', async () => {
    const savedMR = (window as any).MediaRecorder;
    delete (window as any).MediaRecorder;

    const recorder = new PresentationRecorder({
      slides: SLIDES,
      controller,
      objectRenderer
    });

    expect(recorder.status).toBe('unsupported');

    // Attempting to start should reject
    await expect(recorder.start()).rejects.toThrow();

    (window as any).MediaRecorder = savedMR;
  });

  it('should transition through states and notify lifecycle listeners', async () => {
    const recorder = new PresentationRecorder({
      slides: SLIDES,
      controller,
      objectRenderer,
      settings: {
        slideDurationMs: 1000,
        transitionDurationMs: 200,
        outputWidth: 640,
        outputHeight: 360,
        fps: 30
      }
    });

    const events: RecordingLifecycleEvent[] = [];
    recorder.subscribe((e) => events.push(e));

    const startPromise = recorder.start();
    await vi.advanceTimersByTimeAsync(10);
    await startPromise;

    expect(recorder.status).toBe('recording');
    expect(events.some((e) => e.type === 'status_change' && e.status === 'recording')).toBe(true);

    recorder.stop();
    await vi.advanceTimersByTimeAsync(10);

    expect(recorder.status).toBe('complete');
    expect(events.some((e) => e.type === 'complete')).toBe(true);
    expect(recorder.getCurrentResult()).not.toBeNull();
    expect(recorder.getCurrentResult()?.blobUrl).toBe('blob:http://localhost/mock-video-url');
  });

  it('should advance deterministically through all 6 slides in order and auto-complete', async () => {
    const slideDurationMs = 500;
    const transitionDurationMs = 100;

    const recorder = new PresentationRecorder({
      slides: SLIDES,
      controller,
      objectRenderer,
      settings: {
        slideDurationMs,
        transitionDurationMs,
        outputWidth: 640,
        outputHeight: 360,
        fps: 30
      }
    });

    const visitedIndices: number[] = [];
    recorder.subscribe((e) => {
      if (e.type === 'slide_change') {
        visitedIndices.push(e.slideIndex);
      }
    });

    await recorder.start();
    expect(visitedIndices).toEqual([0]);

    // Advance through each slide step
    for (let i = 1; i < SLIDES.length; i++) {
      await vi.advanceTimersByTimeAsync(slideDurationMs + transitionDurationMs + 10);
      expect(visitedIndices).toContain(i);
    }

    // After final slide hold time, recording should automatically complete
    await vi.advanceTimersByTimeAsync(slideDurationMs + 50);

    expect(recorder.status).toBe('complete');
    expect(visitedIndices).toEqual([0, 1, 2, 3, 4, 5]);
    expect(recorder.getCurrentResult()).toBeDefined();
  });

  it('should cancel recording, stop streams, and restore original slide and motion', async () => {
    controller.goTo(3, false);
    controller.setReducedMotion(true);

    expect(controller.currentIndex).toBe(3);
    expect(controller.isReducedMotion).toBe(true);

    const recorder = new PresentationRecorder({
      slides: SLIDES,
      controller,
      objectRenderer,
      settings: {
        slideDurationMs: 1000,
        transitionDurationMs: 200
      }
    });

    await recorder.start();
    expect(controller.currentIndex).toBe(0);
    // Motion is temporarily set to fluid during recording for 3D kinetic capture
    expect(controller.isReducedMotion).toBe(false);

    // Cancel flow
    recorder.cancel();

    expect(recorder.status).toBe('idle');
    // Original slide 3 restored!
    expect(controller.currentIndex).toBe(3);
    // Original reduced motion restored!
    expect(controller.isReducedMotion).toBe(true);
  });

  it('should revoke object URLs on cleanup and reset', async () => {
    const recorder = new PresentationRecorder({
      slides: SLIDES,
      controller,
      objectRenderer,
      settings: { slideDurationMs: 100 }
    });

    await recorder.start();
    recorder.stop();
    await vi.advanceTimersByTimeAsync(10);

    expect(recorder.getCurrentResult()).not.toBeNull();
    const createdUrl = recorder.getCurrentResult()?.blobUrl;
    expect(createdUrl).toBe('blob:http://localhost/mock-video-url');

    // Revoke via reset
    recorder.reset();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/mock-video-url');
    expect(recorder.getCurrentResult()).toBeNull();
    expect(recorder.status).toBe('idle');
  });

  it('should accept and synchronize dynamic color themes in PresentationRecorder and CompositionRenderer', async () => {
    const cobaltTheme = CURATED_THEMES.find((t) => t.id === 'ceramic-cobalt')!;
    expect(cobaltTheme).toBeDefined();

    const recorder = new PresentationRecorder({
      slides: SLIDES,
      controller,
      objectRenderer,
      theme: cobaltTheme,
      settings: { slideDurationMs: 100 }
    });

    expect(recorder.getTheme().id).toBe('ceramic-cobalt');
    expect(recorder.theme.colors.bgPrimary).toBe('#f8f9fa');

    // Switch theme to onyx-emerald
    const emeraldTheme = CURATED_THEMES.find((t) => t.id === 'onyx-emerald')!;
    recorder.setTheme(emeraldTheme);
    expect(recorder.getTheme().id).toBe('onyx-emerald');
    expect(recorder.theme.colors.accent).toBe('#059669');

    // Direct CompositionRenderer verification
    const compRenderer = new CompositionRenderer(
      {
        slideDurationMs: 100,
        transitionDurationMs: 50,
        outputWidth: 640,
        outputHeight: 360,
        fps: 30
      },
      undefined,
      cobaltTheme
    );

    expect(compRenderer.getTheme().id).toBe('ceramic-cobalt');
    compRenderer.setTheme(emeraldTheme);
    expect(compRenderer.getTheme().id).toBe('onyx-emerald');
    compRenderer.destroy();
  });
});
