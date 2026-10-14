import { SlideData } from '../slides/slide-data';
import { PresentationController } from '../controller/presentation-controller';
import { I18nManager } from '../i18n/i18n-manager';

export class HeaderControls {
  private container: HTMLElement;
  private controller: PresentationController;
  private i18n?: I18nManager;

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
  private fontBtn: HTMLButtonElement | null = null;
  private themeBtn: HTMLButtonElement | null = null;
  private studioBtn: HTMLButtonElement | null = null;
  private langBtn: HTMLButtonElement | null = null;
  private controlToggleBtn: HTMLButtonElement | null = null;
  private controlPopoverEl: HTMLElement | null = null;
  private onFontsClick?: () => void;
  private onThemeClick?: () => void;
  private onStudioClick?: () => void;
  private onLangClick?: () => void;

  constructor(container: HTMLElement, controller: PresentationController, i18n?: I18nManager) {
    this.container = container;
    this.controller = controller;
    this.i18n = i18n;

    this.render();
    this.bindEvents();
    this.update(this.controller.slides[0], 0);

    if (this.i18n) {
      this.updateLanguage(this.i18n);
    }
  }

  private render(): void {
    const isZh = this.i18n?.isZh() ?? false;
    const langLabel = isZh ? 'EN' : '繁中';
    const fontsLabel = isZh ? '字型' : 'FONTS';
    const themeLabel = isZh ? '色彩' : 'COLORS';
    const controlLabel = isZh ? '控制' : 'CONTROL';
    const brandName = isZh ? '動態物件' : 'SUBJECTS IN MOTION';
    const brandSub = isZh ? '由 / VEM 工作室' : 'by / VEM Studio';

    this.container.innerHTML = `
      <header class="site-header" role="banner">
        <div class="header-left">
          <div class="brand-monogram">
            <span class="brand-dot"></span>
            <span class="brand-name" id="hdr-brand-name">${brandName}</span>
            <span class="brand-sub" id="hdr-brand-sub">${brandSub}</span>
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
            <!-- Language Switcher Button directly on Top Bar -->
            <button 
              type="button" 
              class="btn-ctrl btn-lang" 
              id="btn-hdr-lang" 
              title="Switch language / 切換語言" 
              aria-label="Toggle language between English and Traditional Chinese">
              <span class="ctrl-icon-txt" id="hdr-lang-txt">${langLabel}</span>
            </button>

            <!-- Fonts Palette Button directly on Top Bar -->
            <button 
              type="button" 
              class="btn-ctrl btn-fonts-bar" 
              id="btn-hdr-fonts" 
              title="Select Google Fonts typography" 
              aria-label="Select typography palette">
              <span class="ctrl-icon-txt">Aa</span>
              <span class="ctrl-btn-label" id="hdr-fonts-label">${fontsLabel}</span>
            </button>

            <!-- Color Themes Button directly on Top Bar -->
            <button 
              type="button" 
              class="btn-ctrl btn-colors-bar" 
              id="btn-hdr-theme" 
              title="Select Color Themes and palettes" 
              aria-label="Select color theme palette">
              <span class="ctrl-icon-txt">🎨</span>
              <span class="ctrl-btn-label" id="hdr-theme-label">${themeLabel}</span>
            </button>

            <!-- Consolidated CONTROL dropdown menu -->
            <div class="control-menu-container">
              <button 
                type="button" 
                class="btn-ctrl btn-control-toggle" 
                id="btn-hdr-control" 
                title="Presentation controls and options" 
                aria-haspopup="menu" 
                aria-expanded="false" 
                aria-label="Toggle presentation controls menu">
                <svg class="ctrl-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
                </svg>
                <span class="ctrl-rec-pulse" id="ctrl-rec-pulse" style="display:none;" aria-hidden="true"></span>
                <span id="hdr-control-label">${controlLabel}</span>
                <svg class="ctrl-chevron" width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                  <path d="M1.5 2.5L4 5L6.5 2.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>

              <div class="control-menu-popover" id="control-menu-popover" role="menu" aria-label="Controls and settings menu">
                <div class="menu-group">
                  <div class="menu-group-header" id="menu-grp-design">DESIGN & AUTHORING</div>
                  <button type="button" class="ctrl-menu-item btn-studio" id="btn-hdr-studio" role="menuitem" aria-pressed="false" title="Open Presentation Authoring Studio">
                    <span class="ctrl-menu-icon">✏️</span>
                    <span class="ctrl-menu-title" id="menu-title-studio">STUDIO MAKER</span>
                    <span class="ctrl-menu-badge" id="menu-studio-badge">OFF</span>
                  </button>
                  <button type="button" class="ctrl-menu-item btn-fonts" id="btn-menu-fonts" role="menuitem" title="Select Google Fonts typography">
                    <span class="ctrl-menu-icon">Aa</span>
                    <span class="ctrl-menu-title" id="menu-title-fonts">FONTS PALETTE</span>
                    <span class="ctrl-menu-hint">Google Fonts</span>
                  </button>
                  <button type="button" class="ctrl-menu-item btn-theme" id="btn-menu-theme" role="menuitem" title="Select Color Themes and palettes">
                    <span class="ctrl-menu-icon">🎨</span>
                    <span class="ctrl-menu-title" id="menu-title-theme">COLOR THEMES</span>
                    <span class="ctrl-menu-hint">Obsidian, Cobalt...</span>
                  </button>
                </div>

                <div class="menu-group">
                  <div class="menu-group-header" id="menu-grp-nav">NAVIGATION & MOTION</div>
                  <button type="button" class="ctrl-menu-item btn-snap" id="btn-hdr-snap" role="menuitem" title="Toggle scroll snap" aria-pressed="true">
                    <span class="ctrl-menu-icon">⚡</span>
                    <span class="ctrl-menu-title" id="menu-title-snap">SNAP: ON</span>
                    <span class="ctrl-menu-hint" id="menu-hint-snap">Page Snapping</span>
                  </button>
                  <button type="button" class="ctrl-menu-item btn-motion" id="btn-hdr-motion" role="menuitem" title="Toggle reduced motion" aria-pressed="false">
                    <span class="ctrl-menu-icon">〰️</span>
                    <span class="ctrl-menu-title" id="menu-title-motion">MOTION: FLUID</span>
                    <span class="ctrl-menu-hint" id="menu-hint-motion">WebGL Kinetic</span>
                  </button>
                </div>

                <div class="menu-group menu-group-recording">
                  <div class="menu-group-header" id="menu-grp-rec">RECORDING</div>
                  <button type="button" class="ctrl-menu-item btn-record" id="btn-hdr-record" role="menuitem" aria-label="Record presentation" title="Record presentation to short video">
                    <span class="ctrl-menu-icon rec-icon">
                      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4" fill="currentColor"/></svg>
                    </span>
                    <span class="ctrl-menu-title" id="rec-btn-label">Record presentation</span>
                  </button>
                  <div class="menu-row-duration">
                    <span class="menu-duration-label" id="menu-duration-label">Slide Pace:</span>
                    <select id="record-duration-select" class="select-duration" aria-label="Slide duration for recording" title="Slide duration">
                      <option value="3500">3.5s (Default)</option>
                      <option value="5000">5.0s (Paced)</option>
                      <option value="2000">2.0s (Fast)</option>
                    </select>
                  </div>
                  <!-- Embedded Recording Status HUD away into CONTROL -->
                  <div class="recording-status-bar" id="recording-status-bar" role="status" aria-live="polite" hidden>
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
                  </div>
                </div>

                <div class="menu-group menu-group-footer">
                  <button type="button" class="ctrl-menu-item btn-keys" id="btn-hdr-keys" role="menuitem" title="View keyboard shortcuts" aria-haspopup="dialog">
                    <span class="ctrl-menu-icon">⌨️</span>
                    <span class="ctrl-menu-title" id="menu-title-keys">KEYBOARD SHORTCUTS</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Slide Navigation Arrows -->
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
            <h3 id="keys-dialog-heading">KEYBOARD SHORTCUTS</h3>
            <button type="button" class="dialog-close" id="dialog-close" aria-label="Close shortcuts dialog">✕</button>
          </div>
          <dl class="shortcut-list" id="shortcut-list-el">
            <div class="shortcut-item"><dt><kbd>↓</kbd></dt><dd id="sc-next">Next slide</dd></div>
            <div class="shortcut-item"><dt><kbd>↑</kbd></dt><dd id="sc-prev">Previous slide</dd></div>
            <div class="shortcut-item"><dt><kbd>r</kbd> / <kbd>R</kbd></dt><dd id="sc-restart">Restart presentation</dd></div>
            <div class="shortcut-item"><dt><kbd>m</kbd> / <kbd>M</kbd></dt><dd id="sc-motion">Toggle reduced motion</dd></div>
          </dl>
          <p class="dialog-note" id="sc-note">Press <kbd>Esc</kbd> to close.</p>
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
    this.fontBtn = this.container.querySelector('#btn-hdr-fonts');
    this.themeBtn = this.container.querySelector('#btn-hdr-theme');
    this.studioBtn = this.container.querySelector('#btn-hdr-studio');
    this.langBtn = this.container.querySelector('#btn-hdr-lang');
    this.controlToggleBtn = this.container.querySelector('#btn-hdr-control');
    this.controlPopoverEl = this.container.querySelector('#control-menu-popover');
  }

  private bindEvents(): void {
    this.prevBtn?.addEventListener('click', () => this.controller.prev());
    this.nextBtn?.addEventListener('click', () => this.controller.next());

    const toggleControlMenu = (force?: boolean) => {
      const willOpen = force !== undefined ? force : !this.controlPopoverEl?.classList.contains('open');
      this.controlPopoverEl?.classList.toggle('open', willOpen);
      this.controlToggleBtn?.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      this.controlToggleBtn?.classList.toggle('active', willOpen);
    };

    this.controlToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleControlMenu();
    });

    document.addEventListener('click', (e) => {
      if (this.controlPopoverEl?.classList.contains('open')) {
        const container = this.container.querySelector('.control-menu-container');
        if (container && !container.contains(e.target as Node)) {
          toggleControlMenu(false);
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.controlPopoverEl?.classList.contains('open')) {
        toggleControlMenu(false);
      }
    });

    this.snapBtn?.addEventListener('click', () => {
      this.controller.toggleSnap();
      this.updateSnapState();
    });

    this.motionBtn?.addEventListener('click', () => {
      this.controller.toggleReducedMotion();
      this.updateMotionState();
    });

    this.langBtn?.addEventListener('click', () => {
      this.onLangClick?.();
    });

    // Top-bar Fonts button
    this.fontBtn?.addEventListener('click', () => {
      toggleControlMenu(false);
      this.onFontsClick?.();
    });

    // In-menu Fonts item fallback
    this.container.querySelector('#btn-menu-fonts')?.addEventListener('click', () => {
      toggleControlMenu(false);
      this.onFontsClick?.();
    });

    // Top-bar Theme/Colors button
    this.themeBtn?.addEventListener('click', () => {
      toggleControlMenu(false);
      this.onThemeClick?.();
    });

    // In-menu Theme item fallback
    this.container.querySelector('#btn-menu-theme')?.addEventListener('click', () => {
      toggleControlMenu(false);
      this.onThemeClick?.();
    });

    this.studioBtn?.addEventListener('click', () => {
      toggleControlMenu(false);
      this.onStudioClick?.();
    });

    this.keysBtn?.addEventListener('click', () => {
      toggleControlMenu(false);
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
      const isZh = this.i18n?.isZh() ?? false;
      this.snapBtn.textContent = isSnap ? (isZh ? '對齊：開啟' : 'SNAP: ON') : (isZh ? '對齊：關閉' : 'SNAP: OFF');
      this.snapBtn.setAttribute('aria-pressed', isSnap.toString());
      this.snapBtn.classList.toggle('active', isSnap);
    }
  }

  public updateMotionState(): void {
    if (this.motionBtn) {
      const isReduced = this.controller.isReducedMotion;
      const isZh = this.i18n?.isZh() ?? false;
      this.motionBtn.textContent = isReduced ? (isZh ? '動態：減弱' : 'MOTION: REDUCED') : (isZh ? '動態：流暢' : 'MOTION: FLUID');
      this.motionBtn.setAttribute('aria-pressed', isReduced.toString());
      this.motionBtn.classList.toggle('active', isReduced);
    }
  }

  public updateLanguage(i18n: I18nManager): void {
    this.i18n = i18n;
    const isZh = i18n.isZh();

    const langTxt = this.container.querySelector('#hdr-lang-txt');
    if (langTxt) langTxt.textContent = isZh ? 'EN' : '繁中';

    const fontsLabel = this.container.querySelector('#hdr-fonts-label');
    if (fontsLabel) fontsLabel.textContent = i18n.t('fontsBtn');

    const themeLabel = this.container.querySelector('#hdr-theme-label');
    if (themeLabel) themeLabel.textContent = i18n.t('colorsBtn');

    const ctrlLabel = this.container.querySelector('#hdr-control-label');
    if (ctrlLabel) ctrlLabel.textContent = i18n.t('controlBtn');

    const brandName = this.container.querySelector('#hdr-brand-name');
    if (brandName) brandName.textContent = i18n.t('brandName');

    const brandSub = this.container.querySelector('#hdr-brand-sub');
    if (brandSub) brandSub.textContent = i18n.t('brandSub');

    // Menu headers & labels
    const grpDesign = this.container.querySelector('#menu-grp-design');
    if (grpDesign) grpDesign.textContent = i18n.t('menuGroupDesign');

    const titleStudio = this.container.querySelector('#menu-title-studio');
    if (titleStudio) titleStudio.textContent = i18n.t('menuStudioTitle');

    const titleFonts = this.container.querySelector('#menu-title-fonts');
    if (titleFonts) titleFonts.textContent = i18n.t('menuFontsTitle');

    const titleTheme = this.container.querySelector('#menu-title-theme');
    if (titleTheme) titleTheme.textContent = i18n.t('menuThemeTitle');

    const grpNav = this.container.querySelector('#menu-grp-nav');
    if (grpNav) grpNav.textContent = i18n.t('menuGroupNav');

    const grpRec = this.container.querySelector('#menu-grp-rec');
    if (grpRec) grpRec.textContent = i18n.t('menuGroupRecording');

    const recBtnLabel = this.container.querySelector('#rec-btn-label');
    if (recBtnLabel) recBtnLabel.textContent = i18n.t('menuRecordTitle');

    const durationLabel = this.container.querySelector('#menu-duration-label');
    if (durationLabel) durationLabel.textContent = i18n.t('menuSlidePace');

    const titleKeys = this.container.querySelector('#menu-title-keys');
    if (titleKeys) titleKeys.textContent = i18n.t('menuGroupShortcuts');

    // Shortcuts dialog
    const keysHeading = this.container.querySelector('#keys-dialog-heading');
    if (keysHeading) keysHeading.textContent = i18n.t('shortcutsHeading');

    const scNext = this.container.querySelector('#sc-next');
    if (scNext) scNext.textContent = i18n.t('shortcutNext');

    const scPrev = this.container.querySelector('#sc-prev');
    if (scPrev) scPrev.textContent = i18n.t('shortcutPrev');

    const scRestart = this.container.querySelector('#sc-restart');
    if (scRestart) scRestart.textContent = i18n.t('shortcutRestart');

    const scMotion = this.container.querySelector('#sc-motion');
    if (scMotion) scMotion.textContent = i18n.t('shortcutMotion');

    const scNote = this.container.querySelector('#sc-note');
    if (scNote) scNote.innerHTML = isZh ? '按 <kbd>Esc</kbd> 鍵即可關閉。' : 'Press <kbd>Esc</kbd> to close.';

    this.updateSnapState();
    this.updateMotionState();
    const curSlide = this.controller.slides[this.controller.currentIndex];
    if (curSlide) {
      this.update(curSlide, this.controller.currentIndex);
    }
  }

  public getRecordButton(): HTMLButtonElement | null {
    return this.recordBtn;
  }

  public getDurationSelect(): HTMLSelectElement | null {
    return this.durationSelect;
  }

  public setOnFontsClick(cb: () => void): void {
    this.onFontsClick = cb;
  }

  public setOnThemeClick(cb: () => void): void {
    this.onThemeClick = cb;
  }

  public setOnStudioClick(cb: () => void): void {
    this.onStudioClick = cb;
  }

  public setOnLangClick(cb: () => void): void {
    this.onLangClick = cb;
  }

  public updateStudioState(isActive: boolean): void {
    if (this.studioBtn) {
      const isZh = this.i18n?.isZh() ?? false;
      this.studioBtn.textContent = isActive ? (isZh ? '工坊：開啟' : 'STUDIO: ON') : (isZh ? '工坊' : 'STUDIO');
      this.studioBtn.setAttribute('aria-pressed', isActive.toString());
      this.studioBtn.classList.toggle('active', isActive);
    }
  }
}
