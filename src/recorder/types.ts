// Typed models for presentation recording

export type RecordingStatus = 'idle' | 'preparing' | 'recording' | 'complete' | 'error' | 'unsupported';

export interface RecordingSettings {
  slideDurationMs: number;
  outputWidth: number;
  outputHeight: number;
  fps: number;
  transitionDurationMs?: number;
}

export interface RecordingResult {
  blobUrl: string;
  blob: Blob;
  mimeType: string;
  durationMs: number;
  sizeBytes: number;
  filename: string;
}

export type RecordingLifecycleEvent =
  | { type: 'status_change'; status: RecordingStatus; previousStatus: RecordingStatus; error?: string }
  | { type: 'slide_change'; slideIndex: number; totalSlides: number }
  | { type: 'tick'; elapsedMs: number; totalEstimatedMs: number }
  | { type: 'complete'; result: RecordingResult }
  | { type: 'cancel' }
  | { type: 'error'; error: Error };

export type RecordingLifecycleListener = (event: RecordingLifecycleEvent) => void;
