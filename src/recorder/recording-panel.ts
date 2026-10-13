import { PresentationRecorder } from './presentation-recorder';
import { RecordingResult, RecordingStatus } from './types';
import { formatBytes, formatDuration } from './mime-utils';

export class RecordingPanel {
  private recorder: PresentationRecorder;
  private container: HTMLElement;

  private recordBtn: HTMLButtonElement | null = null;
  private durationSelect: HTMLSelectElement | null = null;
  private statusBar: HTMLElement | null = null;
  private statusLabel: HTMLElement | null = null;
  private timeElapsedEl: HTMLElement | null = null;
  private stopBtn: HTMLButtonElement | null = null;
  private cancelBtn: HTMLButtonElement | null = null;

  private completeDialog: HTMLDialogElement | null = null;
  private videoPreview: HTMLVideoElement | null = null;
  private metaDuration: HTMLElement | null = null;
  private metaSize: HTMLElement | null = null;
  private metaFormat: HTMLElement | null = null;
  private downloadBtn: HTMLAnchorElement | null = null;
  private recordAgainBtn: HTMLButtonElement | null = null;
  private dialogCloseBtn: HTMLButtonElement | null = null;
  private unsupportedNotice: HTMLElement | null = null;

  constructor(container: HTMLElement, recorder: PresentationRecorder) {
    this.container = container;
    this.recorder = recorder;

    this.render();
    this.bindEvents();
    this.subscribeRecorder();
    this.updateUIForStatus(this.recorder.status);
  }

  private render(): void {
    const hasExistingStatusBar = typeof document !== 'undefined' && Boolean(document.getElementById('recording-status-bar'));
    const markup = `
      ${
        hasExistingStatusBar
          ? ''
          : `<!-- Visible recording status HUD / bar -->
      <aside class="recording-status-bar" id="recording-status-bar" role="status" aria-live="polite" hidden>
        <div class="recording-status-indicator">
          <span class="rec-pulse-dot" aria-hidden="true"></span>
          <span class="rec-status-label" id="rec-status-label">Recording 01 / 06</span>
        </div>
        <div class="rec-time-meter">
          <span class="rec-time-elapsed" id="rec-time-elapsed">00:00</span>
        </div>
        <div class="rec-status-actions">
          <button type="button" class="rec-status-btn rec-btn-stop" id="btn-record-stop" aria-label="Stop presentation recording">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="4" y="4" width="16" height="16" rx="1" />
            </svg>
            <span>Stop</span>
          </button>
          <button type="button" class="rec-status-btn rec-btn-cancel" id="btn-record-cancel" aria-label="Cancel presentation recording">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span>Cancel</span>
          </button>
        </div>
      </aside>`
      }

      <!-- Unsupported browser quiet notice banner -->
      <div class="record-unsupported-notice" id="record-unsupported-notice" role="alert" hidden>
        <span>Recording unavailable: MediaRecorder or Canvas stream capture is not supported in this browser.</span>
      </div>

      <!-- Completed recording preview & download dialog -->
      <dialog class="keys-dialog record-complete-dialog" id="record-complete-dialog" aria-label="Presentation recording completed">
        <div class="dialog-content record-dialog-content">
          <div class="dialog-header">
            <h3>RECORDING COMPLETE</h3>
            <button type="button" class="dialog-close" id="record-dialog-close" aria-label="Close recording dialog">✕</button>
          </div>

          <div class="record-preview-box">
            <video class="record-video-player" id="record-video-preview" controls playsinline aria-label="Recorded presentation video preview"></video>
          </div>

          <div class="record-specs-grid" aria-label="Video specifications">
            <div class="spec-cell">
              <span class="spec-label">DURATION</span>
              <span class="spec-val" id="record-meta-duration">00:00</span>
            </div>
            <div class="spec-cell">
              <span class="spec-label">FILE SIZE</span>
              <span class="spec-val" id="record-meta-size">0 B</span>
            </div>
            <div class="spec-cell">
              <span class="spec-label">MIME TYPE</span>
              <span class="spec-val" id="record-meta-format">video/webm</span>
            </div>
            <div class="spec-cell">
              <span class="spec-label">DIMENSIONS</span>
              <span class="spec-val">1280 × 720</span>
            </div>
          </div>

          <div class="record-dialog-footer">
            <a class="action-btn action-btn-primary btn-download" id="btn-record-download" href="#" download="presentation.webm" aria-label="Download presentation video">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download video</span>
            </a>
            <button type="button" class="action-btn action-btn-secondary btn-record-again" id="btn-record-again" aria-label="Record presentation again">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Record again</span>
            </button>
          </div>
        </div>
      </dialog>
    `;

    const wrapper = document.createElement('div');
    wrapper.id = 'recording-panel-root';
    wrapper.innerHTML = markup;
    this.container.appendChild(wrapper);

    this.statusBar = document.getElementById('recording-status-bar') || wrapper.querySelector('#recording-status-bar');
    this.statusLabel = document.getElementById('rec-status-label') || wrapper.querySelector('#rec-status-label');
    this.timeElapsedEl = document.getElementById('rec-time-elapsed') || wrapper.querySelector('#rec-time-elapsed');
    this.stopBtn = (document.getElementById('btn-record-stop') || wrapper.querySelector('#btn-record-stop')) as HTMLButtonElement | null;
    this.cancelBtn = (document.getElementById('btn-record-cancel') || wrapper.querySelector('#btn-record-cancel')) as HTMLButtonElement | null;

    this.completeDialog = wrapper.querySelector('#record-complete-dialog');
    this.videoPreview = wrapper.querySelector('#record-video-preview');
    this.metaDuration = wrapper.querySelector('#record-meta-duration');
    this.metaSize = wrapper.querySelector('#record-meta-size');
    this.metaFormat = wrapper.querySelector('#record-meta-format');
    this.downloadBtn = wrapper.querySelector('#btn-record-download');
    this.recordAgainBtn = wrapper.querySelector('#btn-record-again');
    this.dialogCloseBtn = wrapper.querySelector('#record-dialog-close');
    this.unsupportedNotice = wrapper.querySelector('#record-unsupported-notice');
  }

  public attachHeaderControls(recordBtn: HTMLButtonElement, durationSelect: HTMLSelectElement): void {
    this.recordBtn = recordBtn;
    this.durationSelect = durationSelect;

    this.recordBtn.addEventListener('click', () => {
      this.handleRecordButtonClick();
    });

    this.durationSelect.addEventListener('change', () => {
      const dur = parseInt(this.durationSelect?.value || '3500', 10);
      if (!isNaN(dur) && dur > 0) {
        this.recorder.updateSettings({ slideDurationMs: dur });
      }
    });

    this.updateUIForStatus(this.recorder.status);
  }

  private bindEvents(): void {
    this.stopBtn?.addEventListener('click', () => {
      this.recorder.stop();
    });

    this.cancelBtn?.addEventListener('click', () => {
      this.recorder.cancel();
    });

    this.downloadBtn?.addEventListener('click', () => {
      // Allow browser native anchor download
    });

    this.recordAgainBtn?.addEventListener('click', () => {
      this.closeCompleteDialog();
      const dur = parseInt(this.durationSelect?.value || '3500', 10);
      this.recorder.start({ slideDurationMs: isNaN(dur) ? 3500 : dur });
    });

    this.dialogCloseBtn?.addEventListener('click', () => {
      this.closeCompleteDialog();
      this.recorder.reset();
    });

    this.completeDialog?.addEventListener('click', (e) => {
      if (e.target === this.completeDialog) {
        this.closeCompleteDialog();
        this.recorder.reset();
      }
    });
  }

  private subscribeRecorder(): void {
    this.recorder.subscribe((event) => {
      switch (event.type) {
        case 'status_change':
          this.updateUIForStatus(event.status, event.error);
          break;

        case 'slide_change':
          if (this.statusLabel) {
            const num = (event.slideIndex + 1).toString().padStart(2, '0');
            const total = event.totalSlides.toString().padStart(2, '0');
            this.statusLabel.textContent = `Recording ${num} / ${total}`;
          }
          break;

        case 'tick':
          if (this.timeElapsedEl) {
            this.timeElapsedEl.textContent = formatDuration(event.elapsedMs);
          }
          break;

        case 'complete':
          this.presentCompleteDialog(event.result);
          break;

        case 'cancel':
          this.hideStatusBar();
          break;

        case 'error':
          this.hideStatusBar();
          alert(`Recording stopped due to an error: ${event.error.message}`);
          break;
      }
    });
  }

  private handleRecordButtonClick(): void {
    if (this.recorder.status === 'unsupported') {
      if (this.unsupportedNotice) {
        this.unsupportedNotice.hidden = false;
        setTimeout(() => {
          if (this.unsupportedNotice) this.unsupportedNotice.hidden = true;
        }, 5000);
      }
      return;
    }

    if (this.recorder.status === 'recording') {
      this.recorder.stop();
    } else {
      const dur = parseInt(this.durationSelect?.value || '3500', 10);
      this.recorder.start({ slideDurationMs: isNaN(dur) ? 3500 : dur }).catch((err) => {
        console.error('Failed to start recording:', err);
      });
    }
  }

  private updateUIForStatus(status: RecordingStatus, _error?: string): void {
    const recLabel = document.getElementById('rec-btn-label');
    const ctrlToggle = document.getElementById('btn-hdr-control');
    const ctrlPulse = document.getElementById('ctrl-rec-pulse');

    if (this.recordBtn) {
      if (status === 'unsupported') {
        this.recordBtn.disabled = true;
        this.recordBtn.setAttribute('aria-disabled', 'true');
        this.recordBtn.title = 'Recording presentation unavailable: MediaRecorder not supported';
        this.recordBtn.classList.add('disabled');
        if (recLabel) recLabel.textContent = 'Recording Unsupported';
      } else if (status === 'recording' || status === 'preparing') {
        this.recordBtn.disabled = false;
        this.recordBtn.setAttribute('aria-disabled', 'false');
        this.recordBtn.classList.add('active', 'recording');
        this.recordBtn.setAttribute('aria-label', 'Stop presentation recording');
        this.recordBtn.title = 'Click to stop presentation recording';
        if (recLabel) recLabel.textContent = 'Stop recording';
      } else {
        this.recordBtn.disabled = false;
        this.recordBtn.setAttribute('aria-disabled', 'false');
        this.recordBtn.classList.remove('active', 'recording');
        this.recordBtn.setAttribute('aria-label', 'Record presentation');
        this.recordBtn.title = 'Record presentation to short video';
        if (recLabel) recLabel.textContent = 'Record presentation';
      }
    }

    if (status === 'recording' || status === 'preparing') {
      if (this.statusBar) {
        this.statusBar.hidden = false;
      }
      if (this.durationSelect) {
        this.durationSelect.disabled = true;
      }
      if (ctrlToggle) ctrlToggle.classList.add('is-recording');
      if (ctrlPulse) ctrlPulse.style.display = 'inline-block';
    } else {
      this.hideStatusBar();
      if (this.durationSelect) {
        this.durationSelect.disabled = false;
      }
      if (ctrlToggle) ctrlToggle.classList.remove('is-recording');
      if (ctrlPulse) ctrlPulse.style.display = 'none';
    }
  }

  private hideStatusBar(): void {
    if (this.statusBar) {
      this.statusBar.hidden = true;
    }
  }

  private presentCompleteDialog(result: RecordingResult): void {
    this.hideStatusBar();

    if (this.videoPreview) {
      this.videoPreview.src = result.blobUrl;
    }

    if (this.metaDuration) {
      this.metaDuration.textContent = formatDuration(result.durationMs);
    }

    if (this.metaSize) {
      this.metaSize.textContent = formatBytes(result.sizeBytes);
    }

    if (this.metaFormat) {
      this.metaFormat.textContent = result.mimeType.split(';')[0].toUpperCase();
    }

    if (this.downloadBtn) {
      this.downloadBtn.href = result.blobUrl;
      this.downloadBtn.download = result.filename;
    }

    if (this.completeDialog) {
      this.completeDialog.showModal();
    }
  }

  private closeCompleteDialog(): void {
    if (this.videoPreview) {
      this.videoPreview.pause();
      this.videoPreview.removeAttribute('src');
      this.videoPreview.load();
    }

    if (this.completeDialog && this.completeDialog.open) {
      this.completeDialog.close();
    }
  }

  public destroy(): void {
    this.closeCompleteDialog();
    this.recorder.revokeCurrentResult();
    const root = this.container.querySelector('#recording-panel-root');
    root?.remove();
  }
}
