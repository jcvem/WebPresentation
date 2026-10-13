import {
  FontManager,
  FontPairing,
  POPULAR_DISPLAY_FONTS,
  POPULAR_BODY_FONTS,
  WEIGHT_NAMES,
  getAvailableWeightsForFont,
  getClosestWeight
} from '../fonts/font-manager';

export class FontSelectorModal {
  private container: HTMLElement;
  private fontManager: FontManager;
  private dialog: HTMLDialogElement | null = null;

  constructor(container: HTMLElement, fontManager: FontManager) {
    this.container = container;
    this.fontManager = fontManager;
    this.render();
    this.bindEvents();
  }

  private render(): void {
    const pairings = this.fontManager.getCuratedPairings();
    const current = this.fontManager.getSelection();
    const currentDisplayWeight = current.displayWeight || 700;
    const currentBodyWeight = current.bodyWeight || 400;

    const pairingsHtml = pairings
      .map(
        (p: FontPairing) => `
        <button 
          type="button" 
          class="font-pairing-card ${current.activePairingId === p.id ? 'active' : ''}" 
          data-pairing-id="${p.id}"
          data-display="${p.displayFont}"
          data-body="${p.bodyFont}"
          data-display-weight="${p.displayWeight || 700}"
          data-body-weight="${p.bodyWeight || 400}">
          <div class="pairing-badge-row">
            <span class="pairing-category">${p.category}</span>
            ${current.activePairingId === p.id ? '<span class="pairing-active-tag">ACTIVE</span>' : ''}
          </div>
          <h4 class="pairing-sample-title" style="font-family: '${p.displayFont}', sans-serif; font-weight: ${p.displayWeight || 700};">${p.name}</h4>
          <p class="pairing-sample-body" style="font-family: '${p.bodyFont}', sans-serif; font-weight: ${p.bodyWeight || 400};">${p.description}</p>
          <div class="pairing-fonts-meta">
            <span class="font-tag"><strong>H:</strong> ${p.displayFont} <span class="tag-weight">(${p.displayWeight || 700})</span></span>
            <span class="font-tag"><strong>P:</strong> ${p.bodyFont} <span class="tag-weight">(${p.bodyWeight || 400})</span></span>
          </div>
        </button>
      `
      )
      .join('');

    const displayOptionsHtml = POPULAR_DISPLAY_FONTS.map(
      (f) => `<option value="${f}" ${f === current.displayFont ? 'selected' : ''}>${f}</option>`
    ).join('');

    const bodyOptionsHtml = POPULAR_BODY_FONTS.map(
      (f) => `<option value="${f}" ${f === current.bodyFont ? 'selected' : ''}>${f}</option>`
    ).join('');

    const modalHtml = `
      <dialog class="font-selector-dialog" id="font-dialog" aria-label="Google Fonts Typography Selector">
        <div class="font-dialog-container">
          <header class="font-dialog-header">
            <div class="font-dialog-title-group">
              <span class="font-dialog-badge">GOOGLE FONTS ENGINE</span>
              <h3 class="font-dialog-heading">TYPOGRAPHY & WEIGHT PALETTE</h3>
              <p class="font-dialog-sub">Select curated editorial font pairings or specify custom Google Fonts and typography weights (Thin to Black).</p>
            </div>
            <button type="button" class="dialog-close" id="btn-font-dialog-close" aria-label="Close typography modal">✕</button>
          </header>

          <div class="font-dialog-body">
            <!-- Tabs -->
            <div class="font-tabs" role="tablist" aria-label="Font selection modes">
              <button type="button" class="font-tab active" id="tab-curated" role="tab" aria-selected="true" aria-controls="panel-curated">
                CURATED PAIRINGS
              </button>
              <button type="button" class="font-tab" id="tab-custom" role="tab" aria-selected="false" aria-controls="panel-custom">
                CUSTOM GOOGLE FONTS & WEIGHTS
              </button>
            </div>

            <!-- Panel 1: Curated Pairings -->
            <div class="font-tab-panel active" id="panel-curated" role="tabpanel" aria-labelledby="tab-curated">
              <div class="pairings-grid">
                ${pairingsHtml}
              </div>
            </div>

            <!-- Panel 2: Custom Mix & Match with Weights -->
            <div class="font-tab-panel" id="panel-custom" role="tabpanel" aria-labelledby="tab-custom" hidden>
              <div class="custom-fonts-builder">
                <div class="custom-inputs-row">
                  <!-- Display Title Font & Weight -->
                  <div class="font-input-group">
                    <div class="font-input-header">
                      <label for="select-display-font" class="font-input-label">DISPLAY / TITLE FONT</label>
                      <span class="weight-label-tag" id="display-weight-tag">${WEIGHT_NAMES[currentDisplayWeight] || currentDisplayWeight}</span>
                    </div>
                    <div class="select-with-custom">
                      <select id="select-display-font" class="font-select">
                        ${displayOptionsHtml}
                        <option value="__custom__">Custom Google Font...</option>
                      </select>
                      <input 
                        type="text" 
                        id="input-custom-display" 
                        class="custom-font-input" 
                        placeholder="Type any Google Font..." 
                        style="display: none;" 
                        aria-label="Custom Display Font Name" />
                    </div>
                    <div class="font-weight-row">
                      <label for="select-display-weight" class="weight-field-label">Weight:</label>
                      <select id="select-display-weight" class="weight-select" aria-label="Display font weight">
                        <!-- Populated dynamically -->
                      </select>
                    </div>
                    <span class="input-hint">Used for slide titles, catalog markings, and hero titles.</span>
                  </div>

                  <!-- Body Text Font & Weight -->
                  <div class="font-input-group">
                    <div class="font-input-header">
                      <label for="select-body-font" class="font-input-label">BODY / THESIS FONT</label>
                      <span class="weight-label-tag" id="body-weight-tag">${WEIGHT_NAMES[currentBodyWeight] || currentBodyWeight}</span>
                    </div>
                    <div class="select-with-custom">
                      <select id="select-body-font" class="font-select">
                        ${bodyOptionsHtml}
                        <option value="__custom__">Custom Google Font...</option>
                      </select>
                      <input 
                        type="text" 
                        id="input-custom-body" 
                        class="custom-font-input" 
                        placeholder="Type any Google Font..." 
                        style="display: none;" 
                        aria-label="Custom Body Font Name" />
                    </div>
                    <div class="font-weight-row">
                      <label for="select-body-weight" class="weight-field-label">Weight:</label>
                      <select id="select-body-weight" class="weight-select" aria-label="Body font weight">
                        <!-- Populated dynamically -->
                      </select>
                    </div>
                    <span class="input-hint">Used for thesis statements, structural anatomy, and telemetry.</span>
                  </div>
                </div>

                <!-- Live Preview Card -->
                <div class="custom-live-preview">
                  <div class="preview-header-meta">
                    <span class="preview-badge">LIVE PREVIEW</span>
                    <span class="preview-spec-tag" id="preview-spec-tag">${current.displayFont} (${currentDisplayWeight}) + ${current.bodyFont} (${currentBodyWeight})</span>
                  </div>
                  <div class="preview-stage" id="font-preview-stage">
                    <h2 class="preview-heading" id="preview-display-text" style="font-family: '${current.displayFont}', sans-serif; font-weight: ${currentDisplayWeight};">
                      Kinetic Geometry & Spatial Monograph
                    </h2>
                    <p class="preview-thesis" id="preview-body-text" style="font-family: '${current.bodyFont}', sans-serif; font-weight: ${currentBodyWeight};">
                      A continuous study of procedural forms, mechanical hierarchy, and responsive exhibition staging.
                    </p>
                  </div>
                </div>

                <div class="custom-actions">
                  <button type="button" class="btn-ctrl btn-accent-fill" id="btn-apply-custom-fonts">
                    APPLY CUSTOM GOOGLE FONTS & WEIGHTS
                  </button>
                </div>
              </div>
            </div>
          </div>

          <footer class="font-dialog-footer">
            <div class="footer-left">
              <button type="button" class="btn-ctrl btn-outline" id="btn-font-reset">RESET TO MONOGRAPH DEFAULT</button>
            </div>
            <div class="footer-right">
              <button type="button" class="btn-ctrl btn-secondary" id="btn-font-done">CLOSE</button>
            </div>
          </footer>
        </div>
      </dialog>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    const dialogEl = wrapper.firstElementChild as HTMLDialogElement;
    this.container.appendChild(dialogEl);
    this.dialog = dialogEl;
  }

  private bindEvents(): void {
    if (!this.dialog) return;

    // Close handlers
    const closeBtn = this.dialog.querySelector('#btn-font-dialog-close');
    const doneBtn = this.dialog.querySelector('#btn-font-done');
    closeBtn?.addEventListener('click', () => this.close());
    doneBtn?.addEventListener('click', () => this.close());

    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) {
        this.close();
      }
    });

    // Tab switching
    const tabCurated = this.dialog.querySelector('#tab-curated') as HTMLButtonElement;
    const tabCustom = this.dialog.querySelector('#tab-custom') as HTMLButtonElement;
    const panelCurated = this.dialog.querySelector('#panel-curated') as HTMLElement;
    const panelCustom = this.dialog.querySelector('#panel-custom') as HTMLElement;

    tabCurated?.addEventListener('click', () => {
      tabCurated.classList.add('active');
      tabCurated.setAttribute('aria-selected', 'true');
      tabCustom.classList.remove('active');
      tabCustom.setAttribute('aria-selected', 'false');
      panelCurated.hidden = false;
      panelCurated.classList.add('active');
      panelCustom.hidden = true;
      panelCustom.classList.remove('active');
    });

    tabCustom?.addEventListener('click', () => {
      tabCustom.classList.add('active');
      tabCustom.setAttribute('aria-selected', 'true');
      tabCurated.classList.remove('active');
      tabCurated.setAttribute('aria-selected', 'false');
      panelCustom.hidden = false;
      panelCustom.classList.add('active');
      panelCurated.hidden = true;
      panelCurated.classList.remove('active');
    });

    // Curated cards click
    const pairingCards = this.dialog.querySelectorAll<HTMLButtonElement>('.font-pairing-card');
    pairingCards.forEach((card) => {
      card.addEventListener('click', () => {
        const pairingId = card.dataset.pairingId;
        if (pairingId) {
          this.fontManager.selectPairing(pairingId);
          this.updateActiveCard(pairingId);
          this.updateCustomInputsFromManager();
        }
      });
    });

    // Custom Font Selects, Weights & Inputs
    const displaySelect = this.dialog.querySelector('#select-display-font') as HTMLSelectElement;
    const bodySelect = this.dialog.querySelector('#select-body-font') as HTMLSelectElement;
    const displayWeightSelect = this.dialog.querySelector('#select-display-weight') as HTMLSelectElement;
    const bodyWeightSelect = this.dialog.querySelector('#select-body-weight') as HTMLSelectElement;
    const customDisplayInput = this.dialog.querySelector('#input-custom-display') as HTMLInputElement;
    const customBodyInput = this.dialog.querySelector('#input-custom-body') as HTMLInputElement;
    const previewDisplay = this.dialog.querySelector('#preview-display-text') as HTMLElement;
    const previewBody = this.dialog.querySelector('#preview-body-text') as HTMLElement;
    const displayWeightTag = this.dialog.querySelector('#display-weight-tag') as HTMLElement;
    const bodyWeightTag = this.dialog.querySelector('#body-weight-tag') as HTMLElement;
    const previewSpecTag = this.dialog.querySelector('#preview-spec-tag') as HTMLElement;
    const applyBtn = this.dialog.querySelector('#btn-apply-custom-fonts');
    const resetBtn = this.dialog.querySelector('#btn-font-reset');

    const sel = this.fontManager.getSelection();
    this.populateWeightOptions(displayWeightSelect, sel.displayFont, sel.displayWeight || 700);
    this.populateWeightOptions(bodyWeightSelect, sel.bodyFont, sel.bodyWeight || 400);

    const updatePreview = () => {
      const displayFont = displaySelect.value === '__custom__' ? customDisplayInput.value.trim() : displaySelect.value;
      const bodyFont = bodySelect.value === '__custom__' ? customBodyInput.value.trim() : bodySelect.value;
      const displayWeight = parseInt(displayWeightSelect.value, 10) || 700;
      const bodyWeight = parseInt(bodyWeightSelect.value, 10) || 400;

      if (displayFont) {
        this.fontManager.ensureGoogleFontLoaded(displayFont, displayWeight);
        if (previewDisplay) {
          previewDisplay.style.fontFamily = `'${displayFont}', sans-serif`;
          previewDisplay.style.fontWeight = String(displayWeight);
        }
      }

      if (bodyFont) {
        this.fontManager.ensureGoogleFontLoaded(bodyFont, bodyWeight);
        if (previewBody) {
          previewBody.style.fontFamily = `'${bodyFont}', sans-serif`;
          previewBody.style.fontWeight = String(bodyWeight);
        }
      }

      if (displayWeightTag) {
        displayWeightTag.textContent = WEIGHT_NAMES[displayWeight] || String(displayWeight);
      }
      if (bodyWeightTag) {
        bodyWeightTag.textContent = WEIGHT_NAMES[bodyWeight] || String(bodyWeight);
      }
      if (previewSpecTag) {
        previewSpecTag.textContent = `${displayFont || 'Display'} (${displayWeight}) + ${bodyFont || 'Body'} (${bodyWeight})`;
      }
    };

    displaySelect?.addEventListener('change', () => {
      if (displaySelect.value === '__custom__') {
        customDisplayInput.style.display = 'block';
        customDisplayInput.focus();
      } else {
        customDisplayInput.style.display = 'none';
        const curWeight = parseInt(displayWeightSelect.value, 10) || 700;
        this.populateWeightOptions(displayWeightSelect, displaySelect.value, curWeight);
      }
      updatePreview();
    });

    bodySelect?.addEventListener('change', () => {
      if (bodySelect.value === '__custom__') {
        customBodyInput.style.display = 'block';
        customBodyInput.focus();
      } else {
        customBodyInput.style.display = 'none';
        const curWeight = parseInt(bodyWeightSelect.value, 10) || 400;
        this.populateWeightOptions(bodyWeightSelect, bodySelect.value, curWeight);
      }
      updatePreview();
    });

    customDisplayInput?.addEventListener('input', () => {
      const curWeight = parseInt(displayWeightSelect.value, 10) || 700;
      this.populateWeightOptions(displayWeightSelect, customDisplayInput.value.trim(), curWeight);
      updatePreview();
    });

    customBodyInput?.addEventListener('input', () => {
      const curWeight = parseInt(bodyWeightSelect.value, 10) || 400;
      this.populateWeightOptions(bodyWeightSelect, customBodyInput.value.trim(), curWeight);
      updatePreview();
    });

    displayWeightSelect?.addEventListener('change', updatePreview);
    bodyWeightSelect?.addEventListener('change', updatePreview);

    applyBtn?.addEventListener('click', () => {
      const displayFont = displaySelect.value === '__custom__' ? customDisplayInput.value.trim() : displaySelect.value;
      const bodyFont = bodySelect.value === '__custom__' ? customBodyInput.value.trim() : bodySelect.value;
      const displayWeight = parseInt(displayWeightSelect.value, 10) || 700;
      const bodyWeight = parseInt(bodyWeightSelect.value, 10) || 400;

      if (displayFont && bodyFont) {
        this.fontManager.setCustomFonts(displayFont, bodyFont, displayWeight, bodyWeight);
        this.updateActiveCard(this.fontManager.getSelection().activePairingId);
        this.showToast(`Applied ${displayFont} (${displayWeight}) + ${bodyFont} (${bodyWeight})`);
      }
    });

    resetBtn?.addEventListener('click', () => {
      this.fontManager.resetToDefault();
      this.updateActiveCard('syne-space-grotesk');
      this.updateCustomInputsFromManager();
      this.showToast('Reset to default typography.');
    });

    // Listen for external font changes
    this.fontManager.onFontChange((newSel) => {
      this.updateActiveCard(newSel.activePairingId);
    });
  }

  private populateWeightOptions(
    selectEl: HTMLSelectElement,
    fontFamily: string,
    currentWeight: number
  ): void {
    if (!selectEl) return;
    const available = getAvailableWeightsForFont(fontFamily);
    const closest = getClosestWeight(currentWeight, available);

    selectEl.innerHTML = available
      .map(
        (w) =>
          `<option value="${w}" ${w === closest ? 'selected' : ''}>${WEIGHT_NAMES[w] || `${w}`}</option>`
      )
      .join('');

    selectEl.value = String(closest);
  }

  private updateActiveCard(activePairingId?: string): void {
    if (!this.dialog) return;
    const cards = this.dialog.querySelectorAll<HTMLButtonElement>('.font-pairing-card');
    cards.forEach((card) => {
      const isMatch = card.dataset.pairingId === activePairingId;
      card.classList.toggle('active', isMatch);
      const activeTag = card.querySelector('.pairing-active-tag');
      if (isMatch && !activeTag) {
        const badgeRow = card.querySelector('.pairing-badge-row');
        badgeRow?.insertAdjacentHTML('beforeend', '<span class="pairing-active-tag">ACTIVE</span>');
      } else if (!isMatch && activeTag) {
        activeTag.remove();
      }
    });
  }

  private updateCustomInputsFromManager(): void {
    if (!this.dialog) return;
    const sel = this.fontManager.getSelection();
    const displaySelect = this.dialog.querySelector('#select-display-font') as HTMLSelectElement;
    const bodySelect = this.dialog.querySelector('#select-body-font') as HTMLSelectElement;
    const displayWeightSelect = this.dialog.querySelector('#select-display-weight') as HTMLSelectElement;
    const bodyWeightSelect = this.dialog.querySelector('#select-body-weight') as HTMLSelectElement;
    const previewDisplay = this.dialog.querySelector('#preview-display-text') as HTMLElement;
    const previewBody = this.dialog.querySelector('#preview-body-text') as HTMLElement;
    const displayWeightTag = this.dialog.querySelector('#display-weight-tag') as HTMLElement;
    const bodyWeightTag = this.dialog.querySelector('#body-weight-tag') as HTMLElement;
    const previewSpecTag = this.dialog.querySelector('#preview-spec-tag') as HTMLElement;

    const dWeight = sel.displayWeight || 700;
    const bWeight = sel.bodyWeight || 400;

    if (displaySelect && POPULAR_DISPLAY_FONTS.includes(sel.displayFont)) {
      displaySelect.value = sel.displayFont;
    }
    if (bodySelect && POPULAR_BODY_FONTS.includes(sel.bodyFont)) {
      bodySelect.value = sel.bodyFont;
    }

    this.populateWeightOptions(displayWeightSelect, sel.displayFont, dWeight);
    this.populateWeightOptions(bodyWeightSelect, sel.bodyFont, bWeight);

    if (previewDisplay) {
      previewDisplay.style.fontFamily = `'${sel.displayFont}', sans-serif`;
      previewDisplay.style.fontWeight = String(dWeight);
    }
    if (previewBody) {
      previewBody.style.fontFamily = `'${sel.bodyFont}', sans-serif`;
      previewBody.style.fontWeight = String(bWeight);
    }
    if (displayWeightTag) {
      displayWeightTag.textContent = WEIGHT_NAMES[dWeight] || String(dWeight);
    }
    if (bodyWeightTag) {
      bodyWeightTag.textContent = WEIGHT_NAMES[bWeight] || String(bWeight);
    }
    if (previewSpecTag) {
      previewSpecTag.textContent = `${sel.displayFont} (${dWeight}) + ${sel.bodyFont} (${bWeight})`;
    }
  }

  public open(): void {
    if (this.dialog && typeof this.dialog.showModal === 'function') {
      this.updateCustomInputsFromManager();
      this.dialog.showModal();
    }
  }

  public close(): void {
    if (this.dialog && typeof this.dialog.close === 'function') {
      this.dialog.close();
    }
  }

  private showToast(message: string): void {
    const existing = document.querySelector('.studio-toast');
    existing?.remove();

    const toast = document.createElement('div');
    toast.className = 'studio-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 2400);
  }
}
