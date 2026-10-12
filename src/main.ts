import './styles/main.css';
import { SLIDES } from './slides/slide-data';
import { renderSlideMarkup } from './ui/slide-view';
import { ObjectRenderer } from './renderer/object-renderer';
import { PresentationController } from './controller/presentation-controller';
import { HeaderControls } from './ui/header-controls';

function initApp(): void {
  const viewport = document.getElementById('presentation-viewport') as HTMLElement;
  const headerContainer = document.getElementById('header-container') as HTMLElement;
  const canvas = document.getElementById('object-canvas') as HTMLCanvasElement;
  const announcer = document.getElementById('slide-announcer') as HTMLElement;

  if (!viewport || !headerContainer || !canvas) {
    console.error('Core DOM elements missing.');
    return;
  }

  // 1. Mount all slide sections
  viewport.innerHTML = SLIDES.map((slide) => renderSlideMarkup(slide, SLIDES.length)).join('');
  const slideElements = Array.from(viewport.querySelectorAll<HTMLElement>('.slide'));

  // 2. Initialize 3D Subject Renderer
  const objectRenderer = new ObjectRenderer(canvas, SLIDES[0].pose);

  // 3. Initialize Presentation Controller
  let headerControls: HeaderControls;

  const controller = new PresentationController({
    slides: SLIDES,
    container: viewport,
    slideElements,
    announcerElement: announcer,
    onSlideChange: (slide, index) => {
      headerControls?.update(slide, index);
      objectRenderer.setPose(slide.pose);
    },
    onMotionChange: (isReduced) => {
      objectRenderer.setReducedMotion(isReduced);
      headerControls?.updateMotionState();
    },
    onSnapChange: () => {
      headerControls?.updateSnapState();
    }
  });

  // 4. Initialize Header Controls
  headerControls = new HeaderControls(headerContainer, controller);

  // 5. Wire action buttons inside Slide 6 (Closing)
  const restartBtn = document.getElementById('btn-restart-action');
  const freeScrollBtn = document.getElementById('btn-free-scroll-action');

  restartBtn?.addEventListener('click', () => {
    controller.restart();
  });

  freeScrollBtn?.addEventListener('click', () => {
    controller.toggleSnap();
    headerControls.updateSnapState();
  });

  // 6. Start 3D animation loop
  objectRenderer.start();

  // Expose controller on window for deterministic testing and automation
  if (typeof window !== 'undefined') {
    (window as unknown as { __presentationController: PresentationController }).__presentationController = controller;
    (window as unknown as { __objectRenderer: ObjectRenderer }).__objectRenderer = objectRenderer;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
