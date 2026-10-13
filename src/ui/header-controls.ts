import { SlideData } from '../slides/slide-data';
import { PresentationController } from '../controller/presentation-controller';

export class HeaderControls {
  private container: HTMLElement;
  private controller: PresentationController;

  private counterEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;
  private progressBarEl: HTMLElement | null = null;
  private prevBtn: HTMLButtonElement | null = null;
  private nextBtn: HTMLButtonElement | null = null;
  private snapBtn: HTMLButtonElement | null = null;
  private motionBtn: HTMLButtonElement | null = null;
  private keysBtn: HTMLButtonElement | null = null;
  private keysModal: HTMLElement | null = null;
  private recordBtn: HTMLButtonElement | null = null;
  private durationSelect: HTMLSelectElement | null = null;

  constructor(container: HTMLElement, controller: PresentationController) {
    this.container = container;
    this.controller = controller;

    this.render();
    this.bindEvents();
    this.update(this.controller.slides[0], 0);
  }

  private render(): void {
    this.container.innerHTML = `
      <header class="site-header" role="banner">
        <div class="header-left">
          <div class="brand-monogram">
            <span class="brand-dot"></span>
            <span class="brand-name">OBJECTS IN MOTION</span>
            <span class="brand-sub">EST. 2026 / STUDY 04</span>
          </div>
        </div>

        <div class="header-center" aria-live="off">
          <div class="slide-indicator">
            <span class="slide-indicator-num" id="hdr-slide-num">01 / 06</span>
            <span class="slide-indicator-sep">·</span>
            <span class="slide-indicator-title" id="hdr-slide-title">OPENING</span>
          </div>
        </div>

        <div class="header-right">
          <nav class="nav-controls" aria-label="Presentation controls">
            <button type="button" class="btn-ctrl btn-snap" id="btn-hdr-snap" title="Toggle scroll snap" aria-pressed="true" aria-label="Toggle scroll snapping">
              SNAP
            </button>
            <button type="button" class="btn-ctrl btn-motion" id="btn-hdr-motion" title="Toggle reduced motion" aria-pressed="false" aria-label="Toggle reduced motion">
              MOTION
            </button>
            <button type="button" class="btn-ctrl btn-keys" id="btn-hdr-keys" title="View keyboard shortcuts" aria-label="Keyboard shortcuts" aria-haspopup="dialog">
              KEYS
            </button>
            <select id="record-duration-select" class="select-duration" aria-label="Slide duration for recording" title="Slide duration">
              <option value="3500">3.5s</option>
              <option value="5000">5.0s</option>
              <option value="2000">2.0s</option>
            </select>
            <button type="button" class="btn-ctrl btn-record" id="btn-hdr-record" aria-label="Record presentation" title="Record presentation to short video">
              <svg class="rec-icon" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                <circle cx="5" cy="5" r="4" fill="currentColor"/>
              </svg>
              <span>Record presentation</span>
            </button>

            <div class="nav-arrows" role="group" aria-label="Slide navigation">
              <button type="button" class="btn-nav btn-prev" id="btn-hdr-prev" aria-label="Previous slide" title="Previous slide (ArrowUp / PageUp)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button type="button" class="btn-nav btn-next" id="btn-hdr-next" aria-label="Next slide" title="Next slide (ArrowDown / PageDown)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </nav>
        </div>

        <!-- Progress meter line -->
        <div class="header-progress" role="progressbar" aria-valuemin="1" aria-valuemax="6" aria-valuenow="1" aria-label="Presentation reading progress">
          <div class="progress-bar" id="hdr-progress-bar"></div>
        </div>
      </header>

      <!-- Keyboard shortcuts dialog -->
      <dialog class="keys-dialog" id="keys-dialog" aria-label="Keyboard navigation guide">
        <div class="dialog-content">
          <div class="dialog-header">
            <h3>KEYBOARD SHORTCUTS</h3>
            <button type="button" class="dialog-close" id="dialog-close" aria-label="Close shortcuts dialog">✕</button>
          </div>
          <dl class="shortcut-list">
            <div class="shortcut-item"><dt><kbd>↓</kbd> / <kbd>Space</kbd> / <kbd>j</kbd></dt><dd>Next slide</dd></div>
            <div class="shortcut-item"><dt><kbd>↑</kbd> / <kbd>Shift+Space</kbd> / <kbd>k</kbd></dt><dd>Previous slide</dd></div>
            <div class="shortcut-item"><dt><kbd>Home</kbd></dt><dd>First slide</dd></div>
            <div class="shortcut-item"><dt><kbd>End</kbd></dt><dd>Last slide</dd></div>
            <div class="shortcut-item"><dt><kbd>r</kbd></dt><dd>Restart presentation</dd></div>
            <div class="shortcut-item"><dt><kbd>m</kbd></dt><dd>Toggle reduced motion</dd></div>
          </dl>
          <p class="dialog-note">Press <kbd>Esc</kbd> to close.</p>
        </div>
      </dialog>
    `;

    this.counterEl = this.container.querySelector('#hdr-slide-num');
    this.titleEl = this.container.querySelector('#hdr-slide-title');
    this.progressBarEl = this.container.querySelector('#hdr-progress-bar');
    this.prevBtn = this.container.querySelector('#btn-hdr-prev');
    this.nextBtn = this.container.querySelector('#btn-hdr-next');
    this.snapBtn = this.container.querySelector('#btn-hdr-snap');
    this.motionBtn = this.container.querySelector('#btn-hdr-motion');
    this.keysBtn = this.container.querySelector('#btn-hdr-keys');
    this.keysModal = this.container.querySelector('#keys-dialog');
    this.recordBtn = this.container.querySelector('#btn-hdr-record');
    this.durationSelect = this.container.querySelector('#record-duration-select');
  }

  private bindEvents(): void {
    this.prevBtn?.addEventListener('click', () => this.controller.prev());
    this.nextBtn?.addEventListener('click', () => this.controller.next());

    this.snapBtn?.addEventListener('click', () => {
      this.controller.toggleSnap();
      this.updateSnapState();
    });

    this.motionBtn?.addEventListener('click', () => {
      this.controller.toggleReducedMotion();
      this.updateMotionState();
    });

    this.keysBtn?.addEventListener('click', () => {
      (this.keysModal as HTMLDialogElement)?.showModal?.();
    });

    this.container.querySelector('#dialog-close')?.addEventListener('click', () => {
      (this.keysModal as HTMLDialogElement)?.close?.();
    });

    this.keysModal?.addEventListener('click', (e) => {
      if (e.target === this.keysModal) {
        (this.keysModal as HTMLDialogElement)?.close?.();
      }
    });

    this.updateSnapState();
    this.updateMotionState();
  }

  public update(slide: SlideData, index: number): void {
    const total = this.controller.slides.length;
    const formattedNum = `0${index + 1} / 0${total}`;

    if (this.counterEl) {
      this.counterEl.textContent = formattedNum;
    }

    if (this.titleEl) {
      this.titleEl.textContent = slide.title.toUpperCase();
    }

    if (this.progressBarEl) {
      const pct = ((index + 1) / total) * 100;
      this.progressBarEl.style.width = `${pct}%`;
      const progContainer = this.container.querySelector('.header-progress');
      progContainer?.setAttribute('aria-valuenow', (index + 1).toString());
    }

    if (this.prevBtn) {
      this.prevBtn.disabled = index === 0;
      this.prevBtn.setAttribute('aria-disabled', (index === 0).toString());
    }

    if (this.nextBtn) {
      this.nextBtn.disabled = index === total - 1;
      this.nextBtn.setAttribute('aria-disabled', (index === total - 1).toString());
    }
  }

  public updateSnapState(): void {
    if (this.snapBtn) {
      const isSnap = this.controller.isSnapEnabled;
      this.snapBtn.textContent = isSnap ? 'SNAP: ON' : 'SNAP: OFF';
      this.snapBtn.setAttribute('aria-pressed', isSnap.toString());
      this.snapBtn.classList.toggle('active', isSnap);
    }
  }

  public updateMotionState(): void {
    if (this.motionBtn) {
      const isReduced = this.controller.isReducedMotion;
      this.motionBtn.textContent = isReduced ? 'MOTION: REDUCED' : 'MOTION: FLUID';
      this.motionBtn.setAttribute('aria-pressed', isReduced.toString());
      this.motionBtn.classList.toggle('active', isReduced);
    }
  }

  public getRecordButton(): HTMLButtonElement | null {
    return this.recordBtn;
  }

  public getDurationSelect(): HTMLSelectElement | null {
    return this.durationSelect;
  }
}
