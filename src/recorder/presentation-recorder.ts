import { SlideData } from '../slides/slide-data';
import { PresentationController } from '../controller/presentation-controller';
import { ObjectRenderer } from '../renderer/object-renderer';
import {
  RecordingStatus,
  RecordingSettings,
  RecordingResult,
  RecordingLifecycleEvent,
  RecordingLifecycleListener
} from './types';
import {
  getSupportedMimeType,
  isRecordingSupported,
  generateRecordingFilename
} from './mime-utils';
import { CompositionRenderer } from './composition-renderer';

export interface RecorderOptions {
  slides: SlideData[];
  controller: PresentationController;
  objectRenderer: ObjectRenderer;
  settings?: Partial<RecordingSettings>;
}

export const DEFAULT_SETTINGS: RecordingSettings = {
  slideDurationMs: 3500,
  transitionDurationMs: 600,
  outputWidth: 1280,
  outputHeight: 720,
  fps: 30
};

export class PresentationRecorder {
  public slides: SlideData[];
  public controller: PresentationController;
  public objectRenderer: ObjectRenderer;
  public settings: RecordingSettings;
  public status: RecordingStatus = 'idle';
  private fonts: { displayFont?: string; bodyFont?: string; displayWeight?: number; bodyWeight?: number } = {
    displayFont: 'Syne',
    bodyFont: 'Space Grotesk',
    displayWeight: 700,
    bodyWeight: 400
  };

  private currentResult: RecordingResult | null = null;
  private listeners: Set<RecordingLifecycleListener> = new Set();

  private originalSlideIndex: number = 0;
  private originalReducedMotion: boolean = false;

  private compositionRenderer: CompositionRenderer | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];

  private animationFrameId: number | null = null;
  private timerId: number | null = null;
  private startTime: number = 0;
  private activeSlideIndex: number = 0;
  private transitionStartTime: number = 0;
  private isTransitioning: boolean = false;

  constructor(options: RecorderOptions) {
    this.slides = options.slides;
    this.controller = options.controller;
    this.objectRenderer = options.objectRenderer;
    this.settings = { ...DEFAULT_SETTINGS, ...options.settings };

    if (!isRecordingSupported()) {
      this.status = 'unsupported';
    }
  }

  public updateSlides(newSlides: SlideData[]): void {
    this.slides = newSlides;
  }

  public setFonts(
    displayFont: string,
    bodyFont: string,
    displayWeight: number = 700,
    bodyWeight: number = 400
  ): void {
    this.fonts = { displayFont, bodyFont, displayWeight, bodyWeight };
    if (this.compositionRenderer) {
      this.compositionRenderer.setFonts(displayFont, bodyFont, displayWeight, bodyWeight);
    }
  }

  public subscribe(listener: RecordingLifecycleListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: RecordingLifecycleEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in recording lifecycle listener:', err);
      }
    }
  }

  private setStatus(newStatus: RecordingStatus, error?: string): void {
    const prev = this.status;
    this.status = newStatus;
    this.emit({
      type: 'status_change',
      status: newStatus,
      previousStatus: prev,
      error
    });
  }

  public updateSettings(partial: Partial<RecordingSettings>): void {
    if (this.status === 'recording' || this.status === 'preparing') {
      console.warn('Cannot change recording settings while recording is active.');
      return;
    }
    this.settings = { ...this.settings, ...partial };
  }

  public async start(customSettings?: Partial<RecordingSettings>): Promise<void> {
    if (customSettings) {
      this.updateSettings(customSettings);
    }

    if (!isRecordingSupported()) {
      this.setStatus('unsupported', 'MediaRecorder or canvas captureStream is unsupported in this browser.');
      throw new Error('Recording unsupported in this browser.');
    }

    if (this.status === 'recording' || this.status === 'preparing') {
      console.warn('Recording is already in progress.');
      return;
    }

    // Clean previous result if any
    this.revokeCurrentResult();

    this.setStatus('preparing');

    // 1. Capture original user presentation state
    this.originalSlideIndex = this.controller.currentIndex;
    this.originalReducedMotion = this.controller.isReducedMotion;

    // In recording mode, enforce smooth kinetic animation so video is visually rich
    if (this.originalReducedMotion) {
      this.controller.setReducedMotion(false);
      this.objectRenderer.setReducedMotion(false);
    }

    // 2. Setup Composition Canvas & Stream
    try {
      this.compositionRenderer = new CompositionRenderer(this.settings, this.fonts);
      this.mediaStream = this.compositionRenderer.captureStream(this.settings.fps);

      const mimeType = getSupportedMimeType() || 'video/webm';
      this.recordedChunks = [];

      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType,
        videoBitsPerSecond: 2_500_000
      });

      this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onerror = (e: Event) => {
        const error = new Error(`MediaRecorder error: ${(e as ErrorEvent).message || 'unknown'}`);
        this.handleFailure(error);
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecorderStopped(mimeType);
      };

      // 3. Move presentation to Slide 1 (index 0)
      this.activeSlideIndex = 0;
      this.controller.goTo(0, false);
      this.objectRenderer.setPose(this.slides[0].pose, true);

      // Start MediaRecorder (slice every 500ms for continuous streaming chunks)
      this.mediaRecorder.start(500);
      this.startTime = performance.now();
      this.transitionStartTime = 0;
      this.isTransitioning = false;

      this.setStatus('recording');
      this.emit({
        type: 'slide_change',
        slideIndex: 0,
        totalSlides: this.slides.length
      });

      // 4. Start deterministic sequence loop and frame renderer
      this.startSequenceLoop();
      this.startRenderLoop();
    } catch (err) {
      this.handleFailure(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private startRenderLoop(): void {
    const render = (time: number) => {
      if (this.status !== 'recording') return;

      const currentSlide = this.slides[this.activeSlideIndex];
      let nextSlide: SlideData | null = null;
      let transitionProgress = 0;

      if (this.isTransitioning && this.activeSlideIndex < this.slides.length - 1) {
        nextSlide = this.slides[this.activeSlideIndex + 1];
        const transDur = this.settings.transitionDurationMs || 600;
        const elapsedTrans = time - this.transitionStartTime;
        transitionProgress = Math.min(1.0, Math.max(0.0, elapsedTrans / transDur));
      }

      const elapsedMs = time - this.startTime;
      const totalEstimatedMs = this.slides.length * this.settings.slideDurationMs;

      // Render composite frame
      this.compositionRenderer?.renderFrame(
        currentSlide,
        nextSlide,
        transitionProgress,
        this.activeSlideIndex,
        this.slides.length,
        this.objectRenderer.getCanvas()
      );

      // Emit tick
      this.emit({
        type: 'tick',
        elapsedMs,
        totalEstimatedMs
      });

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  private startSequenceLoop(): void {
    const holdDuration = this.settings.slideDurationMs;
    const transDuration = this.settings.transitionDurationMs || 600;

    const scheduleNextSlide = () => {
      this.timerId = window.setTimeout(() => {
        if (this.status !== 'recording') return;

        if (this.activeSlideIndex < this.slides.length - 1) {
          // Begin transition to next slide
          this.isTransitioning = true;
          this.transitionStartTime = performance.now();

          // Advance live controller
          const nextIdx = this.activeSlideIndex + 1;
          this.controller.goTo(nextIdx, true);
          this.objectRenderer.setPose(this.slides[nextIdx].pose, false);

          // Complete transition phase
          this.timerId = window.setTimeout(() => {
            if (this.status !== 'recording') return;
            this.activeSlideIndex = nextIdx;
            this.isTransitioning = false;
            this.emit({
              type: 'slide_change',
              slideIndex: this.activeSlideIndex,
              totalSlides: this.slides.length
            });
            scheduleNextSlide();
          }, transDuration);
        } else {
          // Final slide complete!
          this.stop();
        }
      }, holdDuration);
    };

    scheduleNextSlide();
  }

  public stop(): void {
    if (this.status !== 'recording' && this.status !== 'preparing') {
      return;
    }

    this.clearTimers();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (err) {
        console.warn('Error while stopping MediaRecorder:', err);
      }
    }
  }

  public cancel(): void {
    this.clearTimers();
    this.stopMediaStream();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.ondataavailable = null;
        this.mediaRecorder.onstop = null;
        this.mediaRecorder.stop();
      } catch {
        // Ignored
      }
    }

    this.recordedChunks = [];
    this.cleanupCompositionRenderer();

    // Restore user presentation state
    this.controller.goTo(this.originalSlideIndex, false);
    if (this.originalReducedMotion) {
      this.controller.setReducedMotion(true);
      this.objectRenderer.setReducedMotion(true);
    }

    this.setStatus('idle');
    this.emit({ type: 'cancel' });
  }

  public reset(): void {
    this.revokeCurrentResult();
    this.setStatus('idle');
  }

  public revokeCurrentResult(): void {
    if (this.currentResult) {
      try {
        URL.revokeObjectURL(this.currentResult.blobUrl);
      } catch {
        // Ignored
      }
      this.currentResult = null;
    }
  }

  public getCurrentResult(): RecordingResult | null {
    return this.currentResult;
  }

  private handleRecorderStopped(mimeType: string): void {
    this.stopMediaStream();
    this.cleanupCompositionRenderer();

    const durationMs = Math.round(performance.now() - this.startTime);
    const blob = new Blob(this.recordedChunks, { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const filename = generateRecordingFilename(mimeType);

    const result: RecordingResult = {
      blobUrl,
      blob,
      mimeType,
      durationMs,
      sizeBytes: blob.size,
      filename
    };

    this.currentResult = result;

    // Restore motion preference if previously reduced
    if (this.originalReducedMotion) {
      this.controller.setReducedMotion(true);
      this.objectRenderer.setReducedMotion(true);
    }

    this.setStatus('complete');
    this.emit({
      type: 'complete',
      result
    });
  }

  private handleFailure(error: Error): void {
    this.clearTimers();
    this.stopMediaStream();
    this.cleanupCompositionRenderer();

    // Restore state
    this.controller.goTo(this.originalSlideIndex, false);
    if (this.originalReducedMotion) {
      this.controller.setReducedMotion(true);
      this.objectRenderer.setReducedMotion(true);
    }

    this.setStatus('error', error.message);
    this.emit({
      type: 'error',
      error
    });
  }

  private clearTimers(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private stopMediaStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignored
        }
      });
      this.mediaStream = null;
    }
  }

  private cleanupCompositionRenderer(): void {
    if (this.compositionRenderer) {
      this.compositionRenderer.destroy();
      this.compositionRenderer = null;
    }
  }

  public destroy(): void {
    this.cancel();
    this.revokeCurrentResult();
    this.listeners.clear();
  }
}
