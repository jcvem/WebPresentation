// MIME detection, formatting, and container verification utilities

export const CANDIDATE_MIME_TYPES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4;codecs=avc1',
  'video/mp4'
] as const;

/**
 * Selects the optimal supported video MIME type available in the current browser.
 */
export function getSupportedMimeType(
  mediaRecorderClass: typeof MediaRecorder | undefined = typeof MediaRecorder !== 'undefined' ? MediaRecorder : undefined
): string | null {
  if (!mediaRecorderClass || typeof mediaRecorderClass.isTypeSupported !== 'function') {
    return null;
  }

  for (const mime of CANDIDATE_MIME_TYPES) {
    try {
      if (mediaRecorderClass.isTypeSupported(mime)) {
        return mime;
      }
    } catch {
      // Continue checking next candidate if type check throws
    }
  }

  return null;
}

/**
 * Determines whether the current environment supports native canvas video recording.
 */
export function isRecordingSupported(
  targetWindow: { MediaRecorder?: typeof MediaRecorder; HTMLCanvasElement?: { prototype: unknown } } = typeof window !== 'undefined' ? window : {}
): boolean {
  if (!targetWindow || !targetWindow.MediaRecorder) {
    return false;
  }

  const canvasProto = targetWindow.HTMLCanvasElement?.prototype as { captureStream?: unknown; mozCaptureStream?: unknown } | undefined;
  if (!canvasProto) {
    return false;
  }

  const hasCaptureStream = typeof canvasProto.captureStream === 'function' || typeof canvasProto.mozCaptureStream === 'function';
  if (!hasCaptureStream) {
    return false;
  }

  const mime = getSupportedMimeType(targetWindow.MediaRecorder);
  return mime !== null;
}

/**
 * Formats a clean, descriptive recording export filename.
 * Example: objects-in-motion-presentation-20261013-080438.webm
 */
export function generateRecordingFilename(mimeType: string, date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  const timestamp = `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
  const ext = mimeType.toLowerCase().includes('mp4') ? 'mp4' : 'webm';
  return `objects-in-motion-presentation-${timestamp}.${ext}`;
}

/**
 * Formats byte size into human-readable unit (e.g. "1.42 MB").
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const clampedI = Math.min(i, units.length - 1);
  const val = bytes / Math.pow(1024, clampedI);
  return `${val.toFixed(clampedI === 0 ? 0 : 2)} ${units[clampedI]}`;
}

/**
 * Formats duration milliseconds into "MM:SS" string.
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Verifies that the provided binary buffer contains a valid EBML/WebM magic container header.
 * First 4 bytes must be 0x1A 0x45 0xDF 0xA3.
 */
export function hasValidWebmHeader(buffer: ArrayBuffer): boolean {
  if (!buffer || buffer.byteLength < 4) {
    return false;
  }
  const view = new Uint8Array(buffer);
  return view[0] === 0x1a && view[1] === 0x45 && view[2] === 0xdf && view[3] === 0xa3;
}
