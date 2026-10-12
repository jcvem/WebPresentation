import { SlideData } from '../slides/slide-data';

export function renderSlideMarkup(slide: SlideData, _totalSlides: number): string {
  const isFirst = slide.index === 0;

  let extraContent = '';

  // Slide 2: Body text
  if (slide.body) {
    extraContent += `
      <div class="slide-body-block">
        <p class="slide-body-text">${slide.body}</p>
      </div>
    `;
  }

  // Slide 3: Sequence steps
  if (slide.sequence) {
    const stepsHtml = slide.sequence
      .map(
        (step) => `
        <li class="sequence-step">
          <span class="step-num">${step.index}</span>
          <div class="step-content">
            <h3 class="step-title">${step.title}</h3>
            <p class="step-detail">${step.detail}</p>
          </div>
        </li>
      `
      )
      .join('');

    extraContent += `
      <div class="slide-sequence-block">
        <ol class="sequence-list" aria-label="Kinetic sequence steps">
          ${stepsHtml}
        </ol>
      </div>
    `;
  }

  // Slide 4: System exploded parts
  if (slide.components) {
    const partsHtml = slide.components
      .map(
        (c) => `
        <div class="system-part-card" data-tag="${c.tag}">
          <div class="part-badge">${c.tag}</div>
          <div class="part-info">
            <h3 class="part-name">${c.name}</h3>
            <p class="part-desc">${c.description}</p>
          </div>
        </div>
      `
      )
      .join('');

    extraContent += `
      <div class="slide-system-block">
        <div class="system-parts-grid" aria-label="System component parts">
          ${partsHtml}
        </div>
      </div>
    `;
  }

  // Slide 5 & 6: Takeaways
  if (slide.takeaway) {
    extraContent += `
      <div class="slide-takeaway-block">
        <p class="takeaway-text">${slide.takeaway}</p>
      </div>
    `;
  }

  // Slide 6: Action buttons
  if (slide.action) {
    extraContent += `
      <div class="slide-action-block">
        <button type="button" class="action-btn action-btn-primary" id="btn-restart-action" aria-label="Restart presentation from slide 1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          ${slide.action.primaryText}
        </button>
        <button type="button" class="action-btn action-btn-secondary" id="btn-free-scroll-action" aria-label="Toggle between snap and free scroll">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 3v18" />
            <path d="M17 8l-5-5-5 5" />
            <path d="M17 16l-5 5-5-5" />
          </svg>
          ${slide.action.secondaryText}
        </button>
      </div>
    `;
  }

  // Metadata block
  let metaHtml = '';
  if (slide.metadata && slide.metadata.length > 0) {
    const items = slide.metadata
      .map(
        (m) => `
        <div class="meta-item">
          <span class="meta-label">${m.label}</span>
          <span class="meta-value">${m.value}</span>
        </div>
      `
      )
      .join('');
    metaHtml = `<div class="slide-metadata" aria-label="Technical specifications">${items}</div>`;
  }

  // Scroll cue on slide 1
  let scrollCueHtml = '';
  if (isFirst) {
    scrollCueHtml = `
      <div class="scroll-cue" aria-hidden="true">
        <span class="cue-label">SCROLL OR ARROWS TO ADVANCE</span>
        <svg class="cue-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </div>
    `;
  }

  return `
    <section 
      class="slide slide-${slide.id}" 
      id="${slide.id}" 
      data-index="${slide.index}" 
      role="region" 
      aria-label="${slide.title}">
      
      <div class="slide-inner">
        <header class="slide-header">
          <div class="catalog-badge">
            <span class="catalog-num">${slide.catalogNumber}</span>
            <span class="catalog-rule"></span>
            <span class="catalog-super">${slide.superTitle}</span>
          </div>
          <h2 class="slide-title">${slide.title}</h2>
          <p class="slide-thesis">${slide.thesis}</p>
        </header>

        <div class="slide-content">
          ${extraContent}
        </div>

        <footer class="slide-footer">
          ${metaHtml}
          ${scrollCueHtml}
        </footer>
      </div>
    </section>
  `;
}
