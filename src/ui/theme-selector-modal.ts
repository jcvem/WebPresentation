// Color Theme Selector Modal Dialog
import { ThemeManager, ColorTheme } from '../themes/theme-manager';

export class ThemeSelectorModal {
  private container: HTMLElement;
  private themeManager: ThemeManager;
  private dialog: HTMLDialogElement | null = null;

  constructor(container: HTMLElement, themeManager: ThemeManager) {
    this.container = container;
    this.themeManager = themeManager;
    this.render();
    this.bindEvents();
  }

  private render(): void {
    const themes = this.themeManager.getCuratedThemes();
    const current = this.themeManager.getCurrentTheme();

    const themesHtml = themes
      .map(
        (t: ColorTheme) => `
        <button 
          type="button" 
          class="theme-card ${current.id === t.id ? 'active' : ''}" 
          data-theme-id="${t.id}"
          aria-label="Select theme ${t.name}">
          
          <div class="theme-badge-row">
            <div class="theme-badge-left">
              <span class="theme-category">${t.category}</span>
              <span class="theme-mode-pill ${t.mode}">${t.mode.toUpperCase()}</span>
            </div>
            ${current.id === t.id ? '<span class="theme-active-tag">ACTIVE</span>' : ''}
          </div>

          <!-- Visual miniature live preview card -->
          <div class="theme-mini-preview" style="background: ${t.colors.bgPrimary}; border-color: ${t.colors.hairlineStrong};">
            <div class="mini-preview-header" style="border-color: ${t.colors.hairline}; background: ${t.colors.bgSurface};">
              <span class="mini-preview-dot" style="background: ${t.colors.accent};"></span>
              <span class="mini-preview-title" style="color: ${t.colors.textPrimary};">${t.name}</span>
            </div>
            <div class="mini-preview-body">
              <span class="mini-preview-line-accent" style="background: ${t.colors.accent};"></span>
              <span class="mini-preview-line-text" style="background: ${t.colors.textSecondary};"></span>
            </div>
          </div>

          <div class="theme-card-info">
            <h4 class="theme-card-title">${t.name}</h4>
            <p class="theme-card-desc">${t.description}</p>
          </div>

          <!-- Color Swatch Chips -->
          <div class="theme-swatch-row" aria-hidden="true">
            <span class="swatch-chip" style="background: ${t.colors.bgPrimary};" title="Primary Background: ${t.colors.bgPrimary}"></span>
            <span class="swatch-chip" style="background: ${t.colors.bgSurface};" title="Surface: ${t.colors.bgSurface}"></span>
            <span class="swatch-chip" style="background: ${t.colors.accent};" title="Accent: ${t.colors.accent}"></span>
            <span class="swatch-chip" style="background: ${t.colors.textPrimary};" title="Primary Text: ${t.colors.textPrimary}"></span>
          </div>
        </button>
      `
      )
      .join('');

    const modalHtml = `
      <dialog class="theme-selector-dialog" id="theme-dialog" aria-label="Color Themes & Chromatics Selector">
        <div class="theme-dialog-container">
          <header class="theme-dialog-header">
            <div class="theme-dialog-title-group">
              <span class="theme-dialog-badge">COLOR CHROMATICS ENGINE</span>
              <h3 class="theme-dialog-heading">COLOR THEMES & CHROMATIC PALETTES</h3>
              <p class="theme-dialog-sub">Select curated exhibition color identities (including Obsidian/Cadmium and Ceramic/Cobalt) or configure custom palette aesthetics.</p>
            </div>
            <button type="button" class="dialog-close" id="btn-theme-dialog-close" aria-label="Close color themes modal">✕</button>
          </header>

          <div class="theme-dialog-body">
            <!-- Tabs -->
            <div class="font-tabs" role="tablist" aria-label="Theme selection modes">
              <button type="button" class="font-tab active" id="tab-curated-themes" role="tab" aria-selected="true" aria-controls="panel-curated-themes">
                CURATED THEMES
              </button>
              <button type="button" class="font-tab" id="tab-custom-theme" role="tab" aria-selected="false" aria-controls="panel-custom-theme">
                CUSTOM PALETTE BUILDER
              </button>
            </div>

            <!-- Panel 1: Curated Themes -->
            <div class="font-tab-panel active" id="panel-curated-themes" role="tabpanel" aria-labelledby="tab-curated-themes">
              <div class="theme-cards-grid">
                ${themesHtml}
              </div>
            </div>

            <!-- Panel 2: Custom Palette Builder -->
            <div class="font-tab-panel" id="panel-custom-theme" role="tabpanel" aria-labelledby="tab-custom-theme" hidden>
              <div class="custom-theme-builder">
                <div class="custom-inputs-row">
                  <!-- Mode Selection -->
                  <div class="font-input-group">
                    <label for="select-theme-mode" class="font-input-label">BACKGROUND MODE</label>
                    <select id="select-theme-mode" class="studio-select">
                      <option value="dark" ${current.mode === 'dark' ? 'selected' : ''}>Dark (Titanium / Obsidian Substrate)</option>
                      <option value="light" ${current.mode === 'light' ? 'selected' : ''}>Light (Ceramic / Architectural Alabaster)</option>
                    </select>
                  </div>

                  <!-- Accent Color Picker -->
                  <div class="font-input-group">
                    <label for="inp-accent-color" class="font-input-label">ACCENT CHROMATIC COLOR</label>
                    <div class="color-picker-input-group">
                      <input type="color" id="inp-accent-color" class="color-picker-input" value="${current.colors.accent}" aria-label="Choose accent color" />
                      <input type="text" id="inp-accent-hex" class="studio-input" value="${current.colors.accent}" maxlength="7" placeholder="#e05a36" aria-label="Hex accent color code" />
                    </div>
                  </div>
                </div>

                <!-- Quick Swatch Presets -->
                <div class="quick-swatches-section">
                  <span class="quick-swatches-label">POPULAR ARCHITECTURAL ACCENTS:</span>
                  <div class="quick-swatches-list">
                    <button type="button" class="btn-quick-swatch" data-hex="#1e56e3" style="--swatch-c: #1e56e3;">Electric Cobalt</button>
                    <button type="button" class="btn-quick-swatch" data-hex="#e05a36" style="--swatch-c: #e05a36;">Cadmium Orange</button>
                    <button type="button" class="btn-quick-swatch" data-hex="#059669" style="--swatch-c: #059669;">Matrix Emerald</button>
                    <button type="button" class="btn-quick-swatch" data-hex="#dc2626" style="--swatch-c: #dc2626;">Carmine Crimson</button>
                    <button type="button" class="btn-quick-swatch" data-hex="#7c3aed" style="--swatch-c: #7c3aed;">Ultraviolet Amethyst</button>
                    <button type="button" class="btn-quick-swatch" data-hex="#f59e0b" style="--swatch-c: #f59e0b;">Solar Amber</button>
                  </div>
                </div>

                <!-- Custom Theme Actions -->
                <div class="custom-actions-bar">
                  <button type="button" class="btn-studio-action btn-primary" id="btn-apply-custom-theme">
                    Apply Custom Palette
                  </button>
                </div>
              </div>
            </div>
          </div>

          <footer class="theme-dialog-footer">
            <button type="button" class="btn-studio-action" id="btn-reset-theme">Reset to Default</button>
            <button type="button" class="btn-studio-action btn-primary" id="btn-theme-dialog-done">Done</button>
          </footer>
        </div>
      </dialog>
    `;

    const existingDialog = document.getElementById('theme-dialog');
    if (existingDialog) {
      existingDialog.remove();
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    const dialogElement = wrapper.firstElementChild as HTMLDialogElement;
    this.container.appendChild(dialogElement);
    this.dialog = dialogElement;
  }

  private bindEvents(): void {
    if (!this.dialog) return;

    const closeBtn = this.dialog.querySelector('#btn-theme-dialog-close');
    const doneBtn = this.dialog.querySelector('#btn-theme-dialog-done');
    const resetBtn = this.dialog.querySelector('#btn-reset-theme');
    const tabCurated = this.dialog.querySelector('#tab-curated-themes');
    const tabCustom = this.dialog.querySelector('#tab-custom-theme');
    const panelCurated = this.dialog.querySelector('#panel-curated-themes');
    const panelCustom = this.dialog.querySelector('#panel-custom-theme');

    const accentPicker = this.dialog.querySelector('#inp-accent-color') as HTMLInputElement;
    const accentHex = this.dialog.querySelector('#inp-accent-hex') as HTMLInputElement;
    const modeSelect = this.dialog.querySelector('#select-theme-mode') as HTMLSelectElement;
    const applyCustomBtn = this.dialog.querySelector('#btn-apply-custom-theme');

    // Close handlers
    closeBtn?.addEventListener('click', () => this.close());
    doneBtn?.addEventListener('click', () => this.close());

    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) {
        this.close();
      }
    });

    // Reset handler
    resetBtn?.addEventListener('click', () => {
      this.themeManager.resetToDefault();
      this.syncActiveCard();
    });

    // Tab switching
    tabCurated?.addEventListener('click', () => {
      tabCurated.classList.add('active');
      tabCurated.setAttribute('aria-selected', 'true');
      tabCustom?.classList.remove('active');
      tabCustom?.setAttribute('aria-selected', 'false');

      panelCurated?.removeAttribute('hidden');
      panelCurated?.classList.add('active');
      panelCustom?.setAttribute('hidden', '');
      panelCustom?.classList.remove('active');
    });

    tabCustom?.addEventListener('click', () => {
      tabCustom.classList.add('active');
      tabCustom.setAttribute('aria-selected', 'true');
      tabCurated?.classList.remove('active');
      tabCurated?.setAttribute('aria-selected', 'false');

      panelCustom?.removeAttribute('hidden');
      panelCustom?.classList.add('active');
      panelCurated?.setAttribute('hidden', '');
      panelCurated?.classList.remove('active');
    });

    // Curated theme cards
    this.dialog.querySelectorAll<HTMLButtonElement>('.theme-card').forEach((card) => {
      card.addEventListener('click', () => {
        const themeId = card.getAttribute('data-theme-id');
        if (themeId) {
          this.themeManager.selectTheme(themeId);
          this.syncActiveCard();
        }
      });
    });

    // Sync color picker with hex input
    accentPicker?.addEventListener('input', () => {
      if (accentHex) accentHex.value = accentPicker.value;
    });

    accentHex?.addEventListener('input', () => {
      const val = accentHex.value.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        if (accentPicker) accentPicker.value = val;
      }
    });

    // Quick swatches
    this.dialog.querySelectorAll<HTMLButtonElement>('.btn-quick-swatch').forEach((btn) => {
      btn.addEventListener('click', () => {
        const hex = btn.getAttribute('data-hex');
        if (hex) {
          if (accentPicker) accentPicker.value = hex;
          if (accentHex) accentHex.value = hex;
        }
      });
    });

    // Apply custom palette
    applyCustomBtn?.addEventListener('click', () => {
      const mode = (modeSelect?.value as 'dark' | 'light') || 'dark';
      const hex = accentHex?.value || accentPicker?.value || '#1e56e3';
      this.themeManager.setCustomTheme(mode, hex);
      this.syncActiveCard();
      this.close();
    });

    // Listen to theme manager changes from elsewhere
    this.themeManager.onThemeChange(() => {
      this.syncActiveCard();
    });
  }

  private syncActiveCard(): void {
    if (!this.dialog) return;
    const current = this.themeManager.getCurrentTheme();

    this.dialog.querySelectorAll<HTMLButtonElement>('.theme-card').forEach((card) => {
      const id = card.getAttribute('data-theme-id');
      const isActive = id === current.id;
      card.classList.toggle('active', isActive);

      const existingTag = card.querySelector('.theme-active-tag');
      if (isActive && !existingTag) {
        const badgeRow = card.querySelector('.theme-badge-row');
        if (badgeRow) {
          const tag = document.createElement('span');
          tag.className = 'theme-active-tag';
          tag.textContent = 'ACTIVE';
          badgeRow.appendChild(tag);
        }
      } else if (!isActive && existingTag) {
        existingTag.remove();
      }
    });
  }

  public open(): void {
    if (!this.dialog) {
      this.render();
      this.bindEvents();
    }
    this.syncActiveCard();
    this.dialog?.showModal();
  }

  public close(): void {
    this.dialog?.close();
  }

  public isOpen(): boolean {
    return this.dialog?.open ?? false;
  }
}
