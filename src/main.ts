import './styles/main.css';
import { SLIDES, SlideData } from './slides/slide-data';
import { renderSlideMarkup } from './ui/slide-view';
import { ObjectRenderer } from './renderer/object-renderer';
import { PresentationController } from './controller/presentation-controller';
import { HeaderControls } from './ui/header-controls';
import { PresentationRecorder } from './recorder/presentation-recorder';
import { RecordingPanel } from './recorder/recording-panel';
import { FontManager } from './fonts/font-manager';
import { FontSelectorModal } from './ui/font-selector-modal';
import { ThemeManager } from './themes/theme-manager';
import { ThemeSelectorModal } from './ui/theme-selector-modal';
import { PresentationStudio } from './studio/presentation-studio';

function initApp(): void {
  const viewport = document.getElementById('presentation-viewport') as HTMLElement;
  const headerContainer = document.getElementById('header-container') as HTMLElement;
  const canvas = document.getElementById('object-canvas') as HTMLCanvasElement;
  const announcer = document.getElementById('slide-announcer') as HTMLElement;

  if (!viewport || !headerContainer || !canvas) {
    console.error('Core DOM elements missing.');
    return;
  }

  // 1. Font Manager & Google Fonts Modal
  const fontManager = new FontManager();
  const fontModal = new FontSelectorModal(document.body, fontManager);

  // 1b. Color Themes Engine & Theme Modal
  const themeManager = new ThemeManager();
  const themeModal = new ThemeSelectorModal(document.body, themeManager);

  // 2. Load stored custom slides or fallback to default monograph slides
  let initialSlides: SlideData[] = SLIDES;
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('objects_in_motion_studio_slides_v1') : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
        initialSlides = parsed;
      }
    }
  } catch (e) {
    console.warn('Could not parse stored slides, falling back to defaults:', e);
  }

  // 3. Mount all slide sections
  viewport.innerHTML = initialSlides.map((slide) => renderSlideMarkup(slide, initialSlides.length)).join('');
  const slideElements = Array.from(viewport.querySelectorAll<HTMLElement>('.slide'));

  // 4. Initialize 3D Subject Renderer
  const objectRenderer = new ObjectRenderer(canvas, initialSlides[0].pose);
  objectRenderer.setThemePalette(themeManager.getCurrentTheme().objectPalette);

  themeManager.onThemeChange((theme) => {
    objectRenderer.setThemePalette(theme.objectPalette);
    if (studio) {
      studio.updateTheme(theme);
    }
  });

  // 5. Initialize Presentation Controller & Header Controls
  let headerControls: HeaderControls;
  let studio: PresentationStudio;

  const controller = new PresentationController({
    slides: initialSlides,
    container: viewport,
    slideElements,
    announcerElement: announcer,
    onSlideChange: (slide, index) => {
      headerControls?.update(slide, index);
      objectRenderer.setPose(slide.pose);
      if (studio?.isStudioMode) {
        studio.syncInspectorForm(index);
      }
    },
    onMotionChange: (isReduced) => {
      objectRenderer.setReducedMotion(isReduced);
      headerControls?.updateMotionState();
    },
    onSnapChange: () => {
      headerControls?.updateSnapState();
    }
  });

  // 6. Initialize Header Controls
  headerControls = new HeaderControls(headerContainer, controller);

  // 7. Wire action buttons inside closing slide
  const wireClosingActions = () => {
    const restartBtn = document.getElementById('btn-restart-action');
    const freeScrollBtn = document.getElementById('btn-free-scroll-action');

    restartBtn?.addEventListener('click', () => {
      controller.restart();
    });

    freeScrollBtn?.addEventListener('click', () => {
      controller.toggleSnap();
      headerControls.updateSnapState();
    });
  };
  wireClosingActions();

  // 8. Initialize Presentation Recorder & Panel
  const recorder = new PresentationRecorder({
    slides: initialSlides,
    controller,
    objectRenderer
  });

  // Sync active typography with video composition recorder
  const currentFonts = fontManager.getSelection();
  recorder.setFonts(
    currentFonts.displayFont,
    currentFonts.bodyFont,
    currentFonts.displayWeight,
    currentFonts.bodyWeight
  );
  fontManager.onFontChange((sel) => {
    recorder.setFonts(sel.displayFont, sel.bodyFont, sel.displayWeight, sel.bodyWeight);
  });

  const recordingPanel = new RecordingPanel(document.body, recorder);
  const recBtn = headerControls.getRecordButton();
  const durSelect = headerControls.getDurationSelect();
  if (recBtn && durSelect) {
    recordingPanel.attachHeaderControls(recBtn, durSelect);
  }

  // 9. Initialize Presentation Authoring Studio
  studio = new PresentationStudio({
    viewport,
    controller,
    objectRenderer,
    recorder,
    headerControls,
    themeManager,
    onOpenThemeModal: () => themeModal.open()
  });

  // Wire Header buttons to open Google Fonts modal, Color Themes modal, and Authoring Studio
  headerControls.setOnFontsClick(() => {
    fontModal.open();
  });

  headerControls.setOnThemeClick(() => {
    themeModal.open();
  });

  headerControls.setOnStudioClick(() => {
    studio.toggleStudioMode();
  });

  // 10. Start 3D animation loop
  objectRenderer.start();

  // Expose controller, recorder, studio, and fontManager on window for deterministic testing and automation
  if (typeof window !== 'undefined') {
    (window as unknown as { __presentationController: PresentationController }).__presentationController = controller;
    (window as unknown as { __objectRenderer: ObjectRenderer }).__objectRenderer = objectRenderer;
    (window as unknown as { __presentationRecorder: PresentationRecorder }).__presentationRecorder = recorder;
    (window as unknown as { __recordingPanel: RecordingPanel }).__recordingPanel = recordingPanel;
    (window as unknown as { __presentationStudio: PresentationStudio }).__presentationStudio = studio;
    (window as unknown as { __fontManager: FontManager }).__fontManager = fontManager;
    (window as unknown as { __fontModal: FontSelectorModal }).__fontModal = fontModal;
    (window as unknown as { __themeManager: ThemeManager }).__themeManager = themeManager;
    (window as unknown as { __themeModal: ThemeSelectorModal }).__themeModal = themeModal;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
