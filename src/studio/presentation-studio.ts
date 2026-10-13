import { SlideData, ObjectPose, SLIDES } from '../slides/slide-data';
import { PresentationController } from '../controller/presentation-controller';
import { ObjectRenderer } from '../renderer/object-renderer';
import { PresentationRecorder } from '../recorder/presentation-recorder';
import { HeaderControls } from '../ui/header-controls';
import { renderSlideMarkup } from '../ui/slide-view';
import { parseOBJ, createIcosahedronPreset, createTorusKnotPreset, createMobiusStripPreset } from '../renderer/obj-loader';
import { parseGLB } from '../renderer/glb-loader';
import { MeshData } from '../renderer/geometry';

const STORAGE_KEY = 'objects_in_motion_studio_slides_v1';
const MODEL_TYPE_STORAGE_KEY = 'objects_in_motion_model_type';
const CUSTOM_OBJ_TEXT_KEY = 'objects_in_motion_custom_obj_text';
const CUSTOM_OBJ_NAME_KEY = 'objects_in_motion_custom_obj_name';

export const POSE_PRESETS: Record<string, { name: string; pose: ObjectPose }> = {
  opening: {
    name: 'Plate 01: Monolithic Idle',
    pose: {
      rotX: 0.22,
      rotY: 0.45,
      rotZ: 0.08,
      spinRate: 0.005,
      gimbalPitch: 0.15,
      coreSplit: 0.0,
      explodedDistance: 0.0,
      dialAlign: 0.0,
      scale: 1.05
    }
  },
  form: {
    name: 'Plate 02: Internal Geometry Tilt',
    pose: {
      rotX: 0.48,
      rotY: -0.32,
      rotZ: 0.25,
      spinRate: 0.003,
      gimbalPitch: 0.65,
      coreSplit: 0.08,
      explodedDistance: 0.15,
      dialAlign: 0.0,
      scale: 1.15
    }
  },
  motion: {
    name: 'Plate 03: Kinetic Precession',
    pose: {
      rotX: -0.35,
      rotY: 1.15,
      rotZ: -0.42,
      spinRate: 0.012,
      gimbalPitch: 1.25,
      coreSplit: 0.18,
      explodedDistance: 0.35,
      dialAlign: 0.0,
      scale: 1.1
    }
  },
  system: {
    name: 'Plate 04: Exploded Assemblies',
    pose: {
      rotX: 0.38,
      rotY: 0.72,
      rotZ: 0.12,
      spinRate: 0.002,
      gimbalPitch: 0.85,
      coreSplit: 0.42,
      explodedDistance: 0.85,
      dialAlign: 0.0,
      scale: 1.25
    }
  },
  application: {
    name: 'Plate 05: Planar Astrolabe',
    pose: {
      rotX: 0.15,
      rotY: 0.0,
      rotZ: 0.0,
      spinRate: 0.001,
      gimbalPitch: 0.0,
      coreSplit: 0.0,
      explodedDistance: 0.05,
      dialAlign: 1.0,
      scale: 1.2
    }
  },
  closing: {
    name: 'Plate 06: Form at Rest',
    pose: {
      rotX: 0.28,
      rotY: -0.45,
      rotZ: 0.12,
      spinRate: 0.003,
      gimbalPitch: 0.18,
      coreSplit: 0.0,
      explodedDistance: 0.0,
      dialAlign: 0.0,
      scale: 1.08
    }
  }
};

export class PresentationStudio {
  public slides: SlideData[];
  public isStudioMode: boolean = false;

  private viewport: HTMLElement;
  private controller: PresentationController;
  private objectRenderer: ObjectRenderer;
  private recorder: PresentationRecorder;
  private headerControls: HeaderControls;

  private studioDrawer: HTMLElement | null = null;
  private fileInput: HTMLInputElement | null = null;

  constructor(options: {
    viewport: HTMLElement;
    controller: PresentationController;
    objectRenderer: ObjectRenderer;
    recorder: PresentationRecorder;
    headerControls: HeaderControls;
  }) {
    this.viewport = options.viewport;
    this.controller = options.controller;
    this.objectRenderer = options.objectRenderer;
    this.recorder = options.recorder;
    this.headerControls = options.headerControls;

    this.slides = this.loadSlides();
    this.createStudioUI();
    this.createFileInput();
    this.initModelSelection();
  }

  public getSlides(): SlideData[] {
    return this.slides;
  }

  public toggleStudioMode(): void {
    this.setStudioMode(!this.isStudioMode);
  }

  public setStudioMode(active: boolean): void {
    this.isStudioMode = active;
    document.body.classList.toggle('studio-mode-active', active);

    if (this.studioDrawer) {
      this.studioDrawer.classList.toggle('open', active);
      this.studioDrawer.setAttribute('aria-hidden', (!active).toString());
    }

    this.headerControls.updateStudioState(active);
    this.toggleInlineEditable(active);

    if (active) {
      this.syncInspectorForm(this.controller.currentIndex);
      this.showToast('Studio Mode Active. Edit text directly or use the Inspector.');
    } else {
      this.showToast('Presentation Generated! Present mode active.');
    }
  }

  private loadSlides(): SlideData[] {
    if (typeof localStorage === 'undefined') {
      return JSON.parse(JSON.stringify(SLIDES));
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load custom slides from localStorage:', e);
    }

    return JSON.parse(JSON.stringify(SLIDES));
  }

  private saveSlides(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.slides));
    } catch (e) {
      console.warn('Failed to save slides to localStorage:', e);
    }
  }

  public updateSlidesAndDOM(preserveIndex: boolean = true): void {
    const activeIdx = preserveIndex ? this.controller.currentIndex : 0;

    // Normalizing indices and catalog labels
    this.slides.forEach((s, idx) => {
      s.index = idx;
      if (!s.catalogNumber || s.catalogNumber.startsWith('PLATE ')) {
        const num = String(idx + 1).padStart(2, '0');
        const total = String(this.slides.length).padStart(2, '0');
        s.catalogNumber = `PLATE ${num} / ${total}`;
      }
    });

    this.saveSlides();

    // Re-render slides in viewport
    this.viewport.innerHTML = this.slides
      .map((slide) => renderSlideMarkup(slide, this.slides.length))
      .join('');

    const slideElements = Array.from(this.viewport.querySelectorAll<HTMLElement>('.slide'));

    // Update controller
    this.controller.updateSlides(this.slides, slideElements);

    // Update recorder
    this.recorder.updateSlides(this.slides);

    // Re-attach wire buttons on last slide
    const restartBtn = document.getElementById('btn-restart-action');
    const freeScrollBtn = document.getElementById('btn-free-scroll-action');
    restartBtn?.addEventListener('click', () => this.controller.restart());
    freeScrollBtn?.addEventListener('click', () => {
      this.controller.toggleSnap();
      this.headerControls.updateSnapState();
    });

    // Make inline editable if studio is open
    if (this.isStudioMode) {
      this.toggleInlineEditable(true);
    }

    // Scroll to current slide and update header & 3D pose
    const targetIdx = Math.min(activeIdx, this.slides.length - 1);
    this.controller.goTo(targetIdx, false);
    const targetSlide = this.slides[targetIdx];
    if (targetSlide) {
      this.headerControls.update(targetSlide, targetIdx);
      this.objectRenderer.setPose(targetSlide.pose);
    }

    // Refresh tabs in inspector
    this.renderSlideTabs();
    this.syncInspectorForm(targetIdx);
  }

  public updateCurrentSlideField<K extends keyof SlideData>(field: K, value: SlideData[K]): void {
    const idx = this.controller.currentIndex;
    if (idx < 0 || idx >= this.slides.length) return;

    this.slides[idx][field] = value;
    this.saveSlides();

    // Update specific DOM node directly for buttery smoothness
    const slideEl = this.viewport.querySelectorAll<HTMLElement>('.slide')[idx];
    if (slideEl) {
      if (field === 'title') {
        const titleEl = slideEl.querySelector('.slide-title');
        if (titleEl && titleEl.textContent !== value) titleEl.textContent = value as string;
        this.headerControls.update(this.slides[idx], idx);
      } else if (field === 'superTitle') {
        const superEl = slideEl.querySelector('.catalog-super');
        if (superEl && superEl.textContent !== value) superEl.textContent = value as string;
      } else if (field === 'thesis') {
        const thesisEl = slideEl.querySelector('.slide-thesis');
        if (thesisEl && thesisEl.textContent !== value) thesisEl.textContent = value as string;
      } else if (field === 'body') {
        const bodyEl = slideEl.querySelector('.slide-body-text');
        if (bodyEl && bodyEl.textContent !== value) bodyEl.textContent = value as string;
      } else if (field === 'takeaway') {
        const takeEl = slideEl.querySelector('.takeaway-text');
        if (takeEl && takeEl.textContent !== value) takeEl.textContent = value as string;
      } else {
        // Fallback for structural elements (sequence, components, metadata)
        this.updateSlidesAndDOM(true);
      }
    }
  }

  public updatePose(partialPose: Partial<ObjectPose>): void {
    const idx = this.controller.currentIndex;
    if (idx < 0 || idx >= this.slides.length) return;

    this.slides[idx].pose = {
      ...this.slides[idx].pose,
      ...partialPose
    };

    this.saveSlides();
    this.objectRenderer.setPose(this.slides[idx].pose);
  }

  public addSlide(): void {
    const currentIdx = this.controller.currentIndex;
    const newIdx = currentIdx + 1;
    const id = `slide-${Date.now().toString(36)}`;

    const newSlide: SlideData = {
      id,
      index: newIdx,
      catalogNumber: `PLATE ${String(newIdx + 1).padStart(2, '0')} / ${String(this.slides.length + 1).padStart(2, '0')}`,
      superTitle: 'EXHIBITION ESSAY · SECTION',
      title: 'New Spatial Hypothesis',
      thesis: 'Define your core editorial thesis, observation, or architectural principle here.',
      body: 'Elaborate on the kinematic or technical foundations of this slide. The procedural 3D artifact can be oriented to complement this thesis.',
      metadata: [
        { label: 'STATUS', value: 'DRAFT' },
        { label: 'DATUM', value: 'ACTIVE CHASSIS' }
      ],
      pose: {
        rotX: 0.35,
        rotY: 0.5,
        rotZ: 0.1,
        spinRate: 0.004,
        gimbalPitch: 0.4,
        coreSplit: 0.1,
        explodedDistance: 0.2,
        dialAlign: 0.0,
        scale: 1.1
      }
    };

    this.slides.splice(newIdx, 0, newSlide);
    this.controller.currentIndex = newIdx;
    this.updateSlidesAndDOM(true);
    this.showToast(`Added Slide ${newIdx + 1}`);
  }

  public duplicateCurrentSlide(): void {
    const idx = this.controller.currentIndex;
    const current = this.slides[idx];
    if (!current) return;

    const copy: SlideData = JSON.parse(JSON.stringify(current));
    copy.id = `slide-${Date.now().toString(36)}`;
    copy.title = `${copy.title} (Copy)`;

    this.slides.splice(idx + 1, 0, copy);
    this.controller.currentIndex = idx + 1;
    this.updateSlidesAndDOM(true);
    this.showToast(`Duplicated Slide ${idx + 1}`);
  }

  public deleteCurrentSlide(): void {
    if (this.slides.length <= 1) {
      this.showToast('Cannot delete the only slide.');
      return;
    }

    const idx = this.controller.currentIndex;
    this.slides.splice(idx, 1);
    this.controller.currentIndex = Math.max(0, idx - 1);
    this.updateSlidesAndDOM(true);
    this.showToast(`Deleted Slide ${idx + 1}`);
  }

  public moveSlide(direction: 'up' | 'down'): void {
    const idx = this.controller.currentIndex;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

    if (targetIdx < 0 || targetIdx >= this.slides.length) return;

    const [moved] = this.slides.splice(idx, 1);
    this.slides.splice(targetIdx, 0, moved);
    this.controller.currentIndex = targetIdx;
    this.updateSlidesAndDOM(true);
    this.showToast(`Moved to position ${targetIdx + 1}`);
  }

  public resetToDefaultTemplate(): void {
    if (confirm('Reset presentation to original template? All custom text will be replaced.')) {
      this.slides = JSON.parse(JSON.stringify(SLIDES));
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(MODEL_TYPE_STORAGE_KEY);
        localStorage.removeItem(CUSTOM_OBJ_TEXT_KEY);
        localStorage.removeItem(CUSTOM_OBJ_NAME_KEY);
      }
      this.objectRenderer.setCustomModel(null, 'Kinetic Armillary');
      const modelSelect = this.studioDrawer?.querySelector('#sel-model-preset') as HTMLSelectElement;
      if (modelSelect) modelSelect.value = 'armillary';
      const uploadContainer = this.studioDrawer?.querySelector('#obj-upload-container') as HTMLElement;
      if (uploadContainer) uploadContainer.style.display = 'none';
      const metaContainer = this.studioDrawer?.querySelector('#custom-model-meta') as HTMLElement;
      if (metaContainer) metaContainer.style.display = 'none';
      this.updateModelBadge('Kinetic Armillary');

      this.controller.currentIndex = 0;
      this.updateSlidesAndDOM(false);
      this.showToast('Reset to original template monograph.');
    }
  }

  public exportToJson(): void {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      slides: this.slides
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `presentation-deck-${Date.now()}.json`);
    dlAnchor.click();
    dlAnchor.remove();
    this.showToast('Deck exported to JSON file.');
  }

  public triggerImportJson(): void {
    this.fileInput?.click();
  }

  private createFileInput(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';

    input.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          const slidesArray = Array.isArray(parsed) ? parsed : parsed.slides;

          if (Array.isArray(slidesArray) && slidesArray.length > 0 && slidesArray[0].title) {
            this.slides = slidesArray;
            this.controller.currentIndex = 0;
            this.updateSlidesAndDOM(false);
            this.showToast(`Imported ${slidesArray.length} slides successfully.`);
          } else {
            alert('Invalid JSON structure. Expecting a slide array or { slides: [...] }');
          }
        } catch (err) {
          alert('Could not parse JSON file.');
          console.error(err);
        }
      };
      reader.readAsText(file);
      input.value = '';
    });

    document.body.appendChild(input);
    this.fileInput = input;
  }

  private toggleInlineEditable(editable: boolean): void {
    const allSlideEls = this.viewport.querySelectorAll<HTMLElement>('.slide');

    allSlideEls.forEach((slideEl, slideIndex) => {
      const editableElements = slideEl.querySelectorAll<HTMLElement>(
        '.slide-title, .slide-thesis, .catalog-super, .slide-body-text, .takeaway-text, .step-title, .step-detail, .part-name, .part-desc'
      );

      editableElements.forEach((el) => {
        if (editable) {
          el.setAttribute('contenteditable', 'true');
          el.classList.add('inline-editable-target');

          el.oninput = () => {
            const currentSlide = this.slides[slideIndex];
            if (!currentSlide) return;

            if (el.classList.contains('slide-title')) {
              currentSlide.title = el.textContent || '';
              this.headerControls.update(currentSlide, slideIndex);
            } else if (el.classList.contains('catalog-super')) {
              currentSlide.superTitle = el.textContent || '';
            } else if (el.classList.contains('slide-thesis')) {
              currentSlide.thesis = el.textContent || '';
            } else if (el.classList.contains('slide-body-text')) {
              currentSlide.body = el.textContent || '';
            } else if (el.classList.contains('takeaway-text')) {
              currentSlide.takeaway = el.textContent || '';
            }

            this.saveSlides();
            // Sync form inputs if this is the active slide
            if (slideIndex === this.controller.currentIndex) {
              this.syncInspectorForm(slideIndex);
            }
          };
        } else {
          el.removeAttribute('contenteditable');
          el.classList.remove('inline-editable-target');
          el.oninput = null;
        }
      });
    });
  }

  private createStudioUI(): void {
    const drawer = document.createElement('aside');
    drawer.className = 'studio-inspector-drawer';
    drawer.id = 'studio-inspector-drawer';
    drawer.setAttribute('aria-label', 'Presentation Authoring Studio');
    drawer.setAttribute('aria-hidden', 'true');

    drawer.innerHTML = `
      <div class="studio-drawer-inner">
        <!-- Studio Header -->
        <header class="studio-header">
          <div class="studio-title-badge-group">
            <span class="studio-badge">AUTHORING STUDIO</span>
            <h3 class="studio-heading">PRESENTATION MAKER</h3>
          </div>
          <div class="studio-header-actions">
            <button type="button" class="btn-ctrl btn-accent-fill" id="btn-studio-generate" title="Generate presentation outcome and switch to present mode">
              ▶ GENERATE & PRESENT
            </button>
            <button type="button" class="btn-studio-close" id="btn-studio-close" aria-label="Close Authoring Studio">✕</button>
          </div>
        </header>

        <!-- Slide Thumbnails / Navigator Tabs -->
        <nav class="studio-slide-nav" aria-label="Slide tabs">
          <div class="studio-tabs-scroll" id="studio-slide-tabs"></div>
          <button type="button" class="btn-studio-add-slide" id="btn-studio-add" title="Add new slide">+</button>
        </nav>

        <!-- Main Form Inspector -->
        <div class="studio-body">
          <!-- Slide Order & Actions Bar -->
          <div class="slide-reorder-bar">
            <span class="reorder-label" id="current-slide-label">SLIDE 01 / 06</span>
            <div class="reorder-btn-group">
              <button type="button" class="btn-studio-action" id="btn-slide-up" title="Move slide up">↑ Move</button>
              <button type="button" class="btn-studio-action" id="btn-slide-down" title="Move slide down">↓ Move</button>
              <button type="button" class="btn-studio-action" id="btn-slide-dup" title="Duplicate this slide">Duplicate</button>
              <button type="button" class="btn-studio-action btn-danger" id="btn-slide-del" title="Delete this slide">Delete</button>
            </div>
          </div>

          <!-- Section: Slide Content -->
          <section class="studio-section">
            <h4 class="studio-section-title">EDITORIAL CONTENT</h4>

            <div class="studio-field">
              <label for="inp-slide-super">SUPER-TITLE / CATEGORY</label>
              <input type="text" id="inp-slide-super" class="studio-input" placeholder="e.g. EXHIBITION MONOGRAPH · VOL. IV" />
            </div>

            <div class="studio-field">
              <label for="inp-slide-title">MAIN TITLE</label>
              <input type="text" id="inp-slide-title" class="studio-input" placeholder="Slide Title" />
            </div>

            <div class="studio-field">
              <label for="inp-slide-thesis">THESIS / SUMMARY STATEMENT</label>
              <textarea id="inp-slide-thesis" class="studio-textarea" rows="2" placeholder="Core observation or hypothesis..."></textarea>
            </div>

            <div class="studio-field">
              <label for="inp-slide-body">ELABORATION / BODY PARAGRAPH</label>
              <textarea id="inp-slide-body" class="studio-textarea" rows="3" placeholder="Supporting editorial content..."></textarea>
            </div>

            <div class="studio-field">
              <label for="inp-slide-takeaway">KEY TAKEAWAY / CALLOUT (OPTIONAL)</label>
              <textarea id="inp-slide-takeaway" class="studio-textarea" rows="2" placeholder="Summary conclusion..."></textarea>
            </div>
          </section>

          <!-- Section: 3D Model & Custom OBJ Swapper -->
          <section class="studio-section studio-model-section">
            <div class="section-header-row">
              <h4 class="studio-section-title">3D MODEL & GEOMETRY</h4>
              <span class="model-active-badge" id="studio-model-badge">Kinetic Armillary</span>
            </div>

            <div class="studio-field">
              <label for="sel-model-preset">GEOMETRY SELECTION</label>
              <select id="sel-model-preset" class="studio-select">
                <option value="armillary">Default: Kinetic Armillary Artifact</option>
                <option value="mobius">Preset: Möbius Strip (Topological Ribbon)</option>
                <option value="torusknot">Preset: Torus Knot Sculpture</option>
                <option value="icosahedron">Preset: Icosahedron Crystal Prism</option>
                <option value="custom">Custom 3D Model (.obj, .glb)...</option>
              </select>
            </div>

            <!-- Custom OBJ / GLB Uploader Zone -->
            <div class="obj-upload-container" id="obj-upload-container" style="display: none;">
              <div class="obj-dropzone" id="obj-dropzone" tabindex="0" role="button" aria-label="Drop 3D OBJ or GLB file or click to select">
                <div class="dropzone-icon">📐</div>
                <div class="dropzone-text">
                  <strong>Drop .obj or .glb file here</strong>
                  <span>or click to browse local 3D assets</span>
                </div>
                <input type="file" id="inp-obj-file" accept=".obj,.glb,model/gltf-binary" style="display: none;" aria-label="Upload custom 3D OBJ or GLB file" />
              </div>

              <!-- Active Custom Model Metadata -->
              <div class="custom-model-meta" id="custom-model-meta" style="display: none;">
                <div class="meta-stat">
                  <span class="meta-stat-label">MODEL</span>
                  <span class="meta-stat-val" id="model-stat-name">custom.obj</span>
                </div>
                <div class="meta-stat">
                  <span class="meta-stat-label">VERTICES</span>
                  <span class="meta-stat-val" id="model-stat-verts">0</span>
                </div>
                <div class="meta-stat">
                  <span class="meta-stat-label">TRIANGLES</span>
                  <span class="meta-stat-val" id="model-stat-tris">0</span>
                </div>
                <button type="button" class="btn-studio-action btn-danger" id="btn-remove-custom-model" title="Revert to default model">Revert</button>
              </div>
            </div>
          </section>

          <!-- Section: 3D Kinetic Object Pose & Motion -->
          <section class="studio-section">
            <div class="section-header-row">
              <h4 class="studio-section-title">3D KINETIC ARTIFACT POSE</h4>
              <span class="pose-live-tag">LIVE PREVIEW</span>
            </div>

            <div class="studio-field">
              <label for="sel-pose-preset">ORIENTATION PRESET</label>
              <select id="sel-pose-preset" class="studio-select">
                <option value="custom">Custom Parameters</option>
                <option value="opening">Plate 01: Monolithic Idle</option>
                <option value="form">Plate 02: Concentric Tilt</option>
                <option value="motion">Plate 03: Kinetic Decoupling</option>
                <option value="system">Plate 04: Exploded View</option>
                <option value="application">Plate 05: Planar Astrolabe</option>
                <option value="closing">Plate 06: Form at Rest</option>
              </select>
            </div>

            <!-- Pose Sliders -->
            <div class="pose-sliders-grid">
              <div class="slider-row">
                <label for="sld-rot-x">PITCH (X): <span id="val-rot-x">0.22</span></label>
                <input type="range" id="sld-rot-x" min="-3.14" max="3.14" step="0.02" value="0.22" />
              </div>
              <div class="slider-row">
                <label for="sld-rot-y">YAW (Y): <span id="val-rot-y">0.45</span></label>
                <input type="range" id="sld-rot-y" min="-3.14" max="3.14" step="0.02" value="0.45" />
              </div>
              <div class="slider-row">
                <label for="sld-rot-z">ROLL (Z): <span id="val-rot-z">0.08</span></label>
                <input type="range" id="sld-rot-z" min="-3.14" max="3.14" step="0.02" value="0.08" />
              </div>
              <div class="slider-row">
                <label for="sld-spin">IDLE SPIN: <span id="val-spin">0.005</span></label>
                <input type="range" id="sld-spin" min="0" max="0.03" step="0.001" value="0.005" />
              </div>
              <div class="slider-row">
                <label for="sld-gimbal">GIMBAL PITCH: <span id="val-gimbal">0.15</span></label>
                <input type="range" id="sld-gimbal" min="0" max="1.57" step="0.02" value="0.15" />
              </div>
              <div class="slider-row">
                <label for="sld-split">CORE SPLIT: <span id="val-split">0.00</span></label>
                <input type="range" id="sld-split" min="0" max="0.8" step="0.02" value="0.0" />
              </div>
              <div class="slider-row">
                <label for="sld-explode">EXPLODED DIST: <span id="val-explode">0.00</span></label>
                <input type="range" id="sld-explode" min="0" max="1.2" step="0.02" value="0.0" />
              </div>
              <div class="slider-row">
                <label for="sld-align">DIAL ALIGN: <span id="val-align">0.00</span></label>
                <input type="range" id="sld-align" min="0" max="1.0" step="0.05" value="0.0" />
              </div>
              <div class="slider-row">
                <label for="sld-scale">SCALE: <span id="val-scale">1.05</span></label>
                <input type="range" id="sld-scale" min="0.6" max="1.8" step="0.02" value="1.05" />
              </div>
            </div>
          </section>

          <!-- Section: Specifications / Metadata -->
          <section class="studio-section">
            <div class="section-header-row">
              <h4 class="studio-section-title">TECHNICAL SPECIFICATIONS</h4>
              <button type="button" class="btn-studio-small" id="btn-add-meta">+ ADD SPEC</button>
            </div>
            <div id="meta-items-container" class="meta-editor-list"></div>
          </section>

          <!-- Section: Project Deck Import / Export -->
          <section class="studio-section deck-io-section">
            <h4 class="studio-section-title">DECK BACKUP & SHARING</h4>
            <div class="io-btn-row">
              <button type="button" class="btn-ctrl btn-secondary" id="btn-export-json">💾 EXPORT JSON</button>
              <button type="button" class="btn-ctrl btn-secondary" id="btn-import-json">📂 IMPORT JSON</button>
              <button type="button" class="btn-ctrl btn-outline" id="btn-reset-default">↺ RESET DEFAULTS</button>
            </div>
          </section>
        </div>
      </div>
    `;

    document.body.appendChild(drawer);
    this.studioDrawer = drawer;

    this.bindStudioEvents();
    this.renderSlideTabs();
  }

  private bindStudioEvents(): void {
    if (!this.studioDrawer) return;

    // Close & Generate buttons
    this.studioDrawer.querySelector('#btn-studio-close')?.addEventListener('click', () => {
      this.setStudioMode(false);
    });

    this.studioDrawer.querySelector('#btn-studio-generate')?.addEventListener('click', () => {
      this.setStudioMode(false);
    });

    // Slide management buttons
    this.studioDrawer.querySelector('#btn-studio-add')?.addEventListener('click', () => this.addSlide());
    this.studioDrawer.querySelector('#btn-slide-up')?.addEventListener('click', () => this.moveSlide('up'));
    this.studioDrawer.querySelector('#btn-slide-down')?.addEventListener('click', () => this.moveSlide('down'));
    this.studioDrawer.querySelector('#btn-slide-dup')?.addEventListener('click', () => this.duplicateCurrentSlide());
    this.studioDrawer.querySelector('#btn-slide-del')?.addEventListener('click', () => this.deleteCurrentSlide());

    // IO buttons
    this.studioDrawer.querySelector('#btn-export-json')?.addEventListener('click', () => this.exportToJson());
    this.studioDrawer.querySelector('#btn-import-json')?.addEventListener('click', () => this.triggerImportJson());
    this.studioDrawer.querySelector('#btn-reset-default')?.addEventListener('click', () => this.resetToDefaultTemplate());

    // Content inputs
    const superInp = this.studioDrawer.querySelector('#inp-slide-super') as HTMLInputElement;
    const titleInp = this.studioDrawer.querySelector('#inp-slide-title') as HTMLInputElement;
    const thesisInp = this.studioDrawer.querySelector('#inp-slide-thesis') as HTMLTextAreaElement;
    const bodyInp = this.studioDrawer.querySelector('#inp-slide-body') as HTMLTextAreaElement;
    const takeInp = this.studioDrawer.querySelector('#inp-slide-takeaway') as HTMLTextAreaElement;

    superInp?.addEventListener('input', () => this.updateCurrentSlideField('superTitle', superInp.value));
    titleInp?.addEventListener('input', () => this.updateCurrentSlideField('title', titleInp.value));
    thesisInp?.addEventListener('input', () => this.updateCurrentSlideField('thesis', thesisInp.value));
    bodyInp?.addEventListener('input', () => this.updateCurrentSlideField('body', bodyInp.value));
    takeInp?.addEventListener('input', () => this.updateCurrentSlideField('takeaway', takeInp.value));

    // Preset selector
    const presetSelect = this.studioDrawer.querySelector('#sel-pose-preset') as HTMLSelectElement;
    presetSelect?.addEventListener('change', () => {
      const presetKey = presetSelect.value;
      if (POSE_PRESETS[presetKey]) {
        const pose = POSE_PRESETS[presetKey].pose;
        this.updatePose(pose);
        this.syncSliders(pose);
      }
    });

    // Sliders
    this.bindSlider('sld-rot-x', 'val-rot-x', 'rotX');
    this.bindSlider('sld-rot-y', 'val-rot-y', 'rotY');
    this.bindSlider('sld-rot-z', 'val-rot-z', 'rotZ');
    this.bindSlider('sld-spin', 'val-spin', 'spinRate');
    this.bindSlider('sld-gimbal', 'val-gimbal', 'gimbalPitch');
    this.bindSlider('sld-split', 'val-split', 'coreSplit');
    this.bindSlider('sld-explode', 'val-explode', 'explodedDistance');
    this.bindSlider('sld-align', 'val-align', 'dialAlign');
    this.bindSlider('sld-scale', 'val-scale', 'scale');

    // Add metadata item
    this.studioDrawer.querySelector('#btn-add-meta')?.addEventListener('click', () => {
      const idx = this.controller.currentIndex;
      const slide = this.slides[idx];
      if (!slide) return;
      if (!slide.metadata) slide.metadata = [];
      slide.metadata.push({ label: 'NEW SPEC', value: 'VALUE' });
      this.updateSlidesAndDOM(true);
      this.renderMetaInputs(slide);
    });

    // 3D Model Swapper events
    const modelSelect = this.studioDrawer.querySelector('#sel-model-preset') as HTMLSelectElement;
    const uploadContainer = this.studioDrawer.querySelector('#obj-upload-container') as HTMLElement;
    const dropzone = this.studioDrawer.querySelector('#obj-dropzone') as HTMLElement;
    const objFileInput = this.studioDrawer.querySelector('#inp-obj-file') as HTMLInputElement;
    const metaContainer = this.studioDrawer.querySelector('#custom-model-meta') as HTMLElement;
    const removeModelBtn = this.studioDrawer.querySelector('#btn-remove-custom-model');

    const loadModelFile = async (file: File) => {
      try {
        const isGLB = file.name.toLowerCase().endsWith('.glb');
        let res: { mesh: MeshData; vertexCount: number; triangleCount: number; name: string };
        let cacheData: string | null = null;

        if (isGLB) {
          const buffer = await file.arrayBuffer();
          res = parseGLB(buffer, file.name);

          if (buffer.byteLength < 2000000) {
            try {
              const bytes = new Uint8Array(buffer);
              let binary = '';
              const chunkSize = 8192;
              for (let i = 0; i < bytes.length; i += chunkSize) {
                binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
              }
              cacheData = 'data:model/gltf-binary;base64,' + btoa(binary);
            } catch (e) {
              console.warn('GLB could not be converted to base64 for localStorage, held in active memory.');
            }
          }
        } else {
          const text = await file.text();
          res = parseOBJ(text, file.name);
          if (text.length < 2000000) {
            cacheData = text;
          }
        }

        this.objectRenderer.setCustomModel(res.mesh, res.name);

        if (cacheData) {
          try {
            localStorage.setItem(CUSTOM_OBJ_TEXT_KEY, cacheData);
            localStorage.setItem(CUSTOM_OBJ_NAME_KEY, file.name);
          } catch (e) {
            console.warn('Model file too large for localStorage, held in active memory.');
          }
        }
        localStorage.setItem(MODEL_TYPE_STORAGE_KEY, 'custom');
        this.updateModelBadge(res.name);
        this.updateModelStats(res.name, res.vertexCount, res.triangleCount);
        this.showToast(`Loaded ${res.name} (${res.triangleCount.toLocaleString()} triangles)`);
      } catch (err: any) {
        alert(`Failed to load 3D model: ${err.message}`);
      }
    };

    modelSelect?.addEventListener('change', () => {
      const mode = modelSelect.value;
      if (mode === 'armillary') {
        this.objectRenderer.setCustomModel(null, 'Kinetic Armillary');
        localStorage.setItem(MODEL_TYPE_STORAGE_KEY, 'armillary');
        if (uploadContainer) uploadContainer.style.display = 'none';
        this.updateModelBadge('Kinetic Armillary');
        this.showToast('Swapped to Kinetic Armillary Artifact');
      } else if (mode === 'mobius') {
        this.objectRenderer.setCustomModel(createMobiusStripPreset(), 'Möbius Strip');
        localStorage.setItem(MODEL_TYPE_STORAGE_KEY, 'mobius');
        if (uploadContainer) uploadContainer.style.display = 'none';
        this.updateModelBadge('Möbius Strip');
        this.showToast('Swapped to Möbius Strip (Topological Ribbon)');
      } else if (mode === 'icosahedron') {
        this.objectRenderer.setCustomModel(createIcosahedronPreset(), 'Icosahedron Prism');
        localStorage.setItem(MODEL_TYPE_STORAGE_KEY, 'icosahedron');
        if (uploadContainer) uploadContainer.style.display = 'none';
        this.updateModelBadge('Icosahedron Prism');
        this.showToast('Swapped to Icosahedron Crystal Prism');
      } else if (mode === 'torusknot') {
        this.objectRenderer.setCustomModel(createTorusKnotPreset(), 'Torus Knot');
        localStorage.setItem(MODEL_TYPE_STORAGE_KEY, 'torusknot');
        if (uploadContainer) uploadContainer.style.display = 'none';
        this.updateModelBadge('Torus Knot');
        this.showToast('Swapped to Torus Knot Sculpture');
      } else if (mode === 'custom') {
        if (uploadContainer) uploadContainer.style.display = 'flex';
      }
    });

    dropzone?.addEventListener('click', () => {
      objFileInput?.click();
    });

    dropzone?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        objFileInput?.click();
      }
    });

    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });

    dropzone?.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-over');
    });

    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        loadModelFile(file);
      }
    });

    objFileInput?.addEventListener('change', () => {
      const file = objFileInput.files?.[0];
      if (file) {
        loadModelFile(file);
      }
    });

    removeModelBtn?.addEventListener('click', () => {
      if (modelSelect) modelSelect.value = 'armillary';
      this.objectRenderer.setCustomModel(null, 'Kinetic Armillary');
      localStorage.setItem(MODEL_TYPE_STORAGE_KEY, 'armillary');
      if (uploadContainer) uploadContainer.style.display = 'none';
      if (metaContainer) metaContainer.style.display = 'none';
      this.updateModelBadge('Kinetic Armillary');
      this.showToast('Reverted to Kinetic Armillary');
    });
  }

  private updateModelBadge(name: string): void {
    const badge = this.studioDrawer?.querySelector('#studio-model-badge');
    if (badge) badge.textContent = name;
  }

  private updateModelStats(name: string, verts: number, tris: number): void {
    const metaContainer = this.studioDrawer?.querySelector('#custom-model-meta') as HTMLElement;
    const nameEl = this.studioDrawer?.querySelector('#model-stat-name');
    const vertsEl = this.studioDrawer?.querySelector('#model-stat-verts');
    const trisEl = this.studioDrawer?.querySelector('#model-stat-tris');

    if (nameEl) nameEl.textContent = name;
    if (vertsEl) vertsEl.textContent = verts.toLocaleString();
    if (trisEl) trisEl.textContent = tris.toLocaleString();
    if (metaContainer) metaContainer.style.display = 'flex';
  }

  private initModelSelection(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const savedType = localStorage.getItem(MODEL_TYPE_STORAGE_KEY) || 'armillary';
      const modelSelect = this.studioDrawer?.querySelector('#sel-model-preset') as HTMLSelectElement;
      const uploadContainer = this.studioDrawer?.querySelector('#obj-upload-container') as HTMLElement;

      if (savedType === 'mobius') {
        this.objectRenderer.setCustomModel(createMobiusStripPreset(), 'Möbius Strip');
        if (modelSelect) modelSelect.value = 'mobius';
        this.updateModelBadge('Möbius Strip');
      } else if (savedType === 'icosahedron') {
        this.objectRenderer.setCustomModel(createIcosahedronPreset(), 'Icosahedron Prism');
        if (modelSelect) modelSelect.value = 'icosahedron';
        this.updateModelBadge('Icosahedron Prism');
      } else if (savedType === 'torusknot') {
        this.objectRenderer.setCustomModel(createTorusKnotPreset(), 'Torus Knot');
        if (modelSelect) modelSelect.value = 'torusknot';
        this.updateModelBadge('Torus Knot');
      } else if (savedType === 'custom') {
        const cachedData = localStorage.getItem(CUSTOM_OBJ_TEXT_KEY);
        const cachedName = localStorage.getItem(CUSTOM_OBJ_NAME_KEY) || 'custom-model';
        if (cachedData) {
          try {
            let res: { mesh: MeshData; vertexCount: number; triangleCount: number; name: string };
            if (cachedData.startsWith('data:model/gltf-binary;base64,') || cachedName.toLowerCase().endsWith('.glb')) {
              const base64 = cachedData.replace(/^data:model\/gltf-binary;base64,/, '');
              const binaryString = atob(base64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              res = parseGLB(bytes.buffer, cachedName);
            } else {
              res = parseOBJ(cachedData, cachedName);
            }

            this.objectRenderer.setCustomModel(res.mesh, res.name);
            if (modelSelect) modelSelect.value = 'custom';
            if (uploadContainer) uploadContainer.style.display = 'flex';
            this.updateModelBadge(res.name);
            this.updateModelStats(res.name, res.vertexCount, res.triangleCount);
          } catch (err) {
            console.warn('Failed restoring custom 3D model:', err);
          }
        }
      }
    } catch (e) {
      console.warn('Could not restore 3D model selection from localStorage:', e);
    }
  }

  private bindSlider(sliderId: string, valueId: string, poseKey: keyof ObjectPose): void {
    if (!this.studioDrawer) return;
    const slider = this.studioDrawer.querySelector(`#${sliderId}`) as HTMLInputElement;
    const valSpan = this.studioDrawer.querySelector(`#${valueId}`) as HTMLElement;

    slider?.addEventListener('input', () => {
      const numVal = parseFloat(slider.value);
      if (valSpan) valSpan.textContent = numVal.toFixed(2);
      this.updatePose({ [poseKey]: numVal });

      const presetSelect = this.studioDrawer?.querySelector('#sel-pose-preset') as HTMLSelectElement;
      if (presetSelect) presetSelect.value = 'custom';
    });
  }

  public renderSlideTabs(): void {
    if (!this.studioDrawer) return;
    const container = this.studioDrawer.querySelector('#studio-slide-tabs');
    if (!container) return;

    const currentIdx = this.controller.currentIndex;
    container.innerHTML = this.slides
      .map(
        (s, idx) => `
        <button 
          type="button" 
          class="studio-tab-btn ${idx === currentIdx ? 'active' : ''}" 
          data-slide-index="${idx}"
          title="Jump to ${s.title}">
          <span class="tab-idx">0${idx + 1}</span>
          <span class="tab-title">${s.title.slice(0, 14)}</span>
        </button>
      `
      )
      .join('');

    container.querySelectorAll<HTMLButtonElement>('.studio-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.slideIndex || '0', 10);
        this.controller.goTo(idx);
        this.syncInspectorForm(idx);
      });
    });
  }

  public syncInspectorForm(index: number): void {
    if (!this.studioDrawer) return;
    const slide = this.slides[index];
    if (!slide) return;

    // Update label
    const label = this.studioDrawer.querySelector('#current-slide-label');
    if (label) {
      label.textContent = `SLIDE 0${index + 1} / 0${this.slides.length}`;
    }

    // Update text fields
    const superInp = this.studioDrawer.querySelector('#inp-slide-super') as HTMLInputElement;
    const titleInp = this.studioDrawer.querySelector('#inp-slide-title') as HTMLInputElement;
    const thesisInp = this.studioDrawer.querySelector('#inp-slide-thesis') as HTMLTextAreaElement;
    const bodyInp = this.studioDrawer.querySelector('#inp-slide-body') as HTMLTextAreaElement;
    const takeInp = this.studioDrawer.querySelector('#inp-slide-takeaway') as HTMLTextAreaElement;

    if (superInp) superInp.value = slide.superTitle || '';
    if (titleInp) titleInp.value = slide.title || '';
    if (thesisInp) thesisInp.value = slide.thesis || '';
    if (bodyInp) bodyInp.value = slide.body || '';
    if (takeInp) takeInp.value = slide.takeaway || '';

    // Update sliders
    this.syncSliders(slide.pose);

    // Update meta inputs
    this.renderMetaInputs(slide);

    // Highlight active tab
    const tabs = this.studioDrawer.querySelectorAll('.studio-tab-btn');
    tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
    });
  }

  private syncSliders(pose: ObjectPose): void {
    if (!this.studioDrawer) return;

    const setSlider = (id: string, valId: string, val: number) => {
      const slider = this.studioDrawer?.querySelector(`#${id}`) as HTMLInputElement;
      const valSpan = this.studioDrawer?.querySelector(`#${valId}`) as HTMLElement;
      if (slider) slider.value = val.toString();
      if (valSpan) valSpan.textContent = val.toFixed(2);
    };

    setSlider('sld-rot-x', 'val-rot-x', pose.rotX);
    setSlider('sld-rot-y', 'val-rot-y', pose.rotY);
    setSlider('sld-rot-z', 'val-rot-z', pose.rotZ);
    setSlider('sld-spin', 'val-spin', pose.spinRate);
    setSlider('sld-gimbal', 'val-gimbal', pose.gimbalPitch);
    setSlider('sld-split', 'val-split', pose.coreSplit);
    setSlider('sld-explode', 'val-explode', pose.explodedDistance);
    setSlider('sld-align', 'val-align', pose.dialAlign);
    setSlider('sld-scale', 'val-scale', pose.scale);
  }

  private renderMetaInputs(slide: SlideData): void {
    if (!this.studioDrawer) return;
    const container = this.studioDrawer.querySelector('#meta-items-container');
    if (!container) return;

    if (!slide.metadata || slide.metadata.length === 0) {
      container.innerHTML = '<p class="empty-meta-hint">No technical specs configured for this plate.</p>';
      return;
    }

    container.innerHTML = slide.metadata
      .map(
        (m, i) => `
        <div class="meta-row-edit" data-meta-index="${i}">
          <input type="text" class="meta-inp-label" value="${m.label}" placeholder="LABEL" />
          <input type="text" class="meta-inp-value" value="${m.value}" placeholder="VALUE" />
          <button type="button" class="btn-meta-del" title="Remove spec">✕</button>
        </div>
      `
      )
      .join('');

    container.querySelectorAll('.meta-row-edit').forEach((row) => {
      const idx = parseInt((row as HTMLElement).dataset.metaIndex || '0', 10);
      const labelInp = row.querySelector('.meta-inp-label') as HTMLInputElement;
      const valInp = row.querySelector('.meta-inp-value') as HTMLInputElement;
      const delBtn = row.querySelector('.btn-meta-del') as HTMLButtonElement;

      labelInp?.addEventListener('input', () => {
        if (slide.metadata && slide.metadata[idx]) {
          slide.metadata[idx].label = labelInp.value.toUpperCase();
          this.saveSlides();
          this.updateSlidesAndDOM(true);
        }
      });

      valInp?.addEventListener('input', () => {
        if (slide.metadata && slide.metadata[idx]) {
          slide.metadata[idx].value = valInp.value.toUpperCase();
          this.saveSlides();
          this.updateSlidesAndDOM(true);
        }
      });

      delBtn?.addEventListener('click', () => {
        if (slide.metadata) {
          slide.metadata.splice(idx, 1);
          this.saveSlides();
          this.updateSlidesAndDOM(true);
          this.renderMetaInputs(slide);
        }
      });
    });
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
