import { describe, it, expect, beforeEach } from 'vitest';
import { PresentationStudio, POSE_PRESETS } from '../src/studio/presentation-studio';
import { SLIDES } from '../src/slides/slide-data';
import { PresentationController } from '../src/controller/presentation-controller';
import { ObjectRenderer } from '../src/renderer/object-renderer';
import { PresentationRecorder } from '../src/recorder/presentation-recorder';
import { HeaderControls } from '../src/ui/header-controls';
import { renderSlideMarkup } from '../src/ui/slide-view';

describe('PresentationStudio Authoring Engine', () => {
  let studio: PresentationStudio;
  let viewport: HTMLElement;
  let headerContainer: HTMLElement;
  let controller: PresentationController;
  let renderer: ObjectRenderer;
  let recorder: PresentationRecorder;
  let headerControls: HeaderControls;

  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '';
    document.body.innerHTML = `
      <div id="header-container"></div>
      <div id="slide-announcer"></div>
      <main id="presentation-viewport"></main>
      <canvas id="object-canvas" width="400" height="400"></canvas>
    `;

    viewport = document.getElementById('presentation-viewport') as HTMLElement;
    headerContainer = document.getElementById('header-container') as HTMLElement;
    const canvas = document.getElementById('object-canvas') as HTMLCanvasElement;
    const announcer = document.getElementById('slide-announcer') as HTMLElement;

    const initialSlides = JSON.parse(JSON.stringify(SLIDES));
    viewport.innerHTML = initialSlides.map((s: any) => renderSlideMarkup(s, initialSlides.length)).join('');
    const slideElements = Array.from(viewport.querySelectorAll<HTMLElement>('.slide'));

    renderer = new ObjectRenderer(canvas, initialSlides[0].pose);
    controller = new PresentationController({
      slides: initialSlides,
      container: viewport,
      slideElements,
      announcerElement: announcer
    });
    headerControls = new HeaderControls(headerContainer, controller);
    recorder = new PresentationRecorder({
      slides: initialSlides,
      controller,
      objectRenderer: renderer
    });

    studio = new PresentationStudio({
      viewport,
      controller,
      objectRenderer: renderer,
      recorder,
      headerControls
    });
  });

  it('should initialize with default 6 slides', () => {
    expect(studio.getSlides()).toHaveLength(6);
    expect(studio.isStudioMode).toBe(false);
  });

  it('should toggle studio mode and generate presentation outcome', () => {
    studio.setStudioMode(true);
    expect(studio.isStudioMode).toBe(true);
    expect(document.body.classList.contains('studio-mode-active')).toBe(true);

    // Generating outcome switches back to presentation mode
    studio.setStudioMode(false);
    expect(studio.isStudioMode).toBe(false);
    expect(document.body.classList.contains('studio-mode-active')).toBe(false);
  });

  it('should update current slide editorial fields and sync with DOM', () => {
    studio.updateCurrentSlideField('title', 'Custom Masterpiece');
    studio.updateCurrentSlideField('thesis', 'The unified field of kinetic sculpture and motion typography.');
    studio.updateCurrentSlideField('superTitle', 'THEORY OF RELATIVE MOTION');

    const slides = studio.getSlides();
    expect(slides[0].title).toBe('Custom Masterpiece');
    expect(slides[0].thesis).toBe('The unified field of kinetic sculpture and motion typography.');
    expect(slides[0].superTitle).toBe('THEORY OF RELATIVE MOTION');

    const titleEl = viewport.querySelector('.slide-title');
    expect(titleEl?.textContent).toBe('Custom Masterpiece');
  });

  it('should add a new slide with normalized index and catalog number', () => {
    const originalCount = studio.getSlides().length;
    studio.addSlide();

    const slides = studio.getSlides();
    expect(slides).toHaveLength(originalCount + 1);
    expect(controller.currentIndex).toBe(1);
    expect(slides[1].title).toBe('New Spatial Hypothesis');
    expect(slides[1].catalogNumber).toContain('PLATE 02');
  });

  it('should duplicate the current slide', () => {
    const originalCount = studio.getSlides().length;
    studio.duplicateCurrentSlide();

    const slides = studio.getSlides();
    expect(slides).toHaveLength(originalCount + 1);
    expect(slides[1].title).toContain('(Copy)');
  });

  it('should delete a slide and prevent deleting the last remaining slide', () => {
    studio.deleteCurrentSlide();
    expect(studio.getSlides()).toHaveLength(5);

    // Try deleting until only 1 left
    while (studio.getSlides().length > 1) {
      studio.deleteCurrentSlide();
    }
    expect(studio.getSlides()).toHaveLength(1);

    // Attempting to delete the only slide should be prevented
    studio.deleteCurrentSlide();
    expect(studio.getSlides()).toHaveLength(1);
  });

  it('should reorder slides up and down', () => {
    controller.currentIndex = 1;
    const secondSlideTitle = studio.getSlides()[1].title;

    studio.moveSlide('up');
    expect(studio.getSlides()[0].title).toBe(secondSlideTitle);
    expect(controller.currentIndex).toBe(0);

    studio.moveSlide('down');
    expect(studio.getSlides()[1].title).toBe(secondSlideTitle);
    expect(controller.currentIndex).toBe(1);
  });

  it('should update 3D kinetic object pose and apply presets', () => {
    const formPreset = POSE_PRESETS['form'].pose;
    studio.updatePose(formPreset);

    const currentPose = studio.getSlides()[0].pose;
    expect(currentPose.gimbalPitch).toBe(formPreset.gimbalPitch);
    expect(currentPose.explodedDistance).toBe(formPreset.explodedDistance);
    expect(currentPose.scale).toBe(formPreset.scale);
  });

  it('should support switching to Mobius Strip preset geometry', () => {
    studio.setStudioMode(true);
    const modelSelect = document.getElementById('sel-model-preset') as HTMLSelectElement;
    expect(modelSelect).not.toBeNull();
    const mobiusOption = Array.from(modelSelect.options).find(o => o.value === 'mobius');
    expect(mobiusOption).toBeDefined();

    modelSelect.value = 'mobius';
    modelSelect.dispatchEvent(new Event('change'));

    expect(renderer.getCustomModelName()).toBe('Möbius Strip');
    expect(localStorage.getItem('objects_in_motion_model_type')).toBe('mobius');
    const badge = document.getElementById('studio-model-badge');
    expect(badge?.textContent).toBe('Möbius Strip');
  });

  it('should configure custom 3D model upload to accept both OBJ and GLB files', () => {
    studio.setStudioMode(true);
    const modelSelect = document.getElementById('sel-model-preset') as HTMLSelectElement;
    const customOption = Array.from(modelSelect.options).find(o => o.value === 'custom');
    expect(customOption?.textContent).toContain('.glb');

    const fileInput = document.getElementById('inp-obj-file') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    expect(fileInput.accept).toContain('.glb');
    expect(fileInput.accept).toContain('.obj');

    const dropzone = document.getElementById('obj-dropzone');
    expect(dropzone?.textContent).toContain('.glb');
  });
});

