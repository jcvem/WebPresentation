import { SlideData } from '../slides/slide-data';

export interface ControllerOptions {
  slides: SlideData[];
  container: HTMLElement;
  slideElements: HTMLElement[];
  announcerElement?: HTMLElement | null;
  onSlideChange?: (slide: SlideData, index: number) => void;
  onMotionChange?: (isReduced: boolean) => void;
  onSnapChange?: (isSnapEnabled: boolean) => void;
}

export class PresentationController {
  public slides: SlideData[];
  public currentIndex: number = 0;
  private container: HTMLElement;
  private slideElements: HTMLElement[];
  private announcerElement: HTMLElement | null = null;

  public isReducedMotion: boolean = false;
  public isSnapEnabled: boolean = true;

  private onSlideChangeCb?: (slide: SlideData, index: number) => void;
  private onMotionChangeCb?: (isReduced: boolean) => void;
  private onSnapChangeCb?: (isSnapEnabled: boolean) => void;

  private isProgrammaticScroll = false;
  private scrollTimeout: number | null = null;
  private wheelThrottle = false;
  private touchStartY = 0;
  private touchStartX = 0;

  private observer: IntersectionObserver | null = null;
  private mediaQuery: MediaQueryList | null = null;

  constructor(options: ControllerOptions) {
    this.slides = options.slides;
    this.container = options.container;
    this.slideElements = options.slideElements;
    this.announcerElement = options.announcerElement || null;
    this.onSlideChangeCb = options.onSlideChange;
    this.onMotionChangeCb = options.onMotionChange;
    this.onSnapChangeCb = options.onSnapChange;

    this.initReducedMotion();
    this.initObserver();
    this.initEvents();
    this.initFromHash();
  }

  private initReducedMotion(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.isReducedMotion = this.mediaQuery.matches;

      this.mediaQuery.addEventListener('change', (e) => {
        this.setReducedMotion(e.matches);
      });
    }
  }

  private initObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (this.isProgrammaticScroll) return;

        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const indexStr = (entry.target as HTMLElement).dataset.index;
            if (indexStr !== undefined) {
              const idx = parseInt(indexStr, 10);
              if (!isNaN(idx) && idx !== this.currentIndex) {
                this.setCurrentIndex(idx, false);
              }
            }
          }
        }
      },
      {
        root: this.container === document.body ? null : this.container,
        threshold: 0.5
      }
    );

    this.slideElements.forEach((el) => {
      this.observer?.observe(el);
    });
  }

  private initEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    this.container.addEventListener('wheel', this.handleWheel, { passive: false });
    this.container.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.container.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    window.addEventListener('hashchange', this.handleHashChange);
  }

  private initFromHash(): void {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      const foundIdx = this.slides.findIndex((s) => s.id === hash || `slide-${s.index + 1}` === hash);
      if (foundIdx >= 0) {
        this.goTo(foundIdx, false);
        return;
      }
    }
    // Default to first slide
    this.setCurrentIndex(0, false);
  }

  public setReducedMotion(reduced: boolean): void {
    this.isReducedMotion = reduced;
    document.documentElement.classList.toggle('reduced-motion', reduced);
    this.onMotionChangeCb?.(reduced);
  }

  public toggleReducedMotion(): void {
    this.setReducedMotion(!this.isReducedMotion);
  }

  public setSnapEnabled(enabled: boolean): void {
    this.isSnapEnabled = enabled;
    this.container.classList.toggle('no-snap', !enabled);
    this.onSnapChangeCb?.(enabled);
  }

  public toggleSnap(): void {
    this.setSnapEnabled(!this.isSnapEnabled);
  }

  public next(): void {
    if (this.currentIndex < this.slides.length - 1) {
      this.goTo(this.currentIndex + 1);
    }
  }

  public prev(): void {
    if (this.currentIndex > 0) {
      this.goTo(this.currentIndex - 1);
    }
  }

  public updateSlides(newSlides: SlideData[], newSlideElements: HTMLElement[]): void {
    if (this.observer) {
      this.slideElements.forEach((el) => this.observer?.unobserve(el));
    }

    this.slides = newSlides;
    this.slideElements = newSlideElements;

    if (this.observer) {
      this.slideElements.forEach((el) => this.observer?.observe(el));
    }

    if (this.currentIndex >= this.slides.length) {
      this.currentIndex = Math.max(0, this.slides.length - 1);
    }
  }

  public restart(): void {
    this.goTo(0);
  }

  public goTo(index: number, smooth: boolean = true): void {
    if (index < 0 || index >= this.slides.length) return;

    const targetEl = this.slideElements[index];
    if (!targetEl) return;

    this.isProgrammaticScroll = true;
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);

    const behavior: ScrollBehavior = this.isReducedMotion || !smooth ? 'auto' : 'smooth';

    targetEl.scrollIntoView({
      behavior,
      block: 'start'
    });

    this.setCurrentIndex(index, true);

    // Release programmatic lock after scroll finishes
    const duration = this.isReducedMotion || !smooth ? 50 : 600;
    this.scrollTimeout = window.setTimeout(() => {
      this.isProgrammaticScroll = false;
    }, duration);
  }

  public goToId(id: string, smooth: boolean = true): void {
    const idx = this.slides.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.goTo(idx, smooth);
    }
  }

  private setCurrentIndex(index: number, updateHash: boolean): void {
    this.currentIndex = index;
    const slide = this.slides[index];

    if (updateHash && typeof window !== 'undefined' && window.location) {
      if (window.location.hash !== `#${slide.id}`) {
        history.replaceState(null, '', `#${slide.id}`);
      }
    }

    // Announce to screen readers
    if (this.announcerElement) {
      this.announcerElement.textContent = `Slide ${index + 1} of ${this.slides.length}: ${slide.title}. ${slide.thesis}`;
    }

    this.onSlideChangeCb?.(slide, index);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Ignore keys if typing in an input or textarea
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.next();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.prev();
        break;

      case 'r':
      case 'R':
        e.preventDefault();
        this.restart();
        break;

      case 'm':
      case 'M':
        e.preventDefault();
        this.toggleReducedMotion();
        break;
    }
  };

  private handleWheel = (e: WheelEvent): void => {
    if (!this.isSnapEnabled) return; // Free scroll allows natural continuous wheel

    // Debounce trackpad rapid wheel triggers
    if (Math.abs(e.deltaY) > 40) {
      if (this.wheelThrottle) {
        e.preventDefault();
        return;
      }

      this.wheelThrottle = true;
      if (e.deltaY > 0) {
        this.next();
      } else {
        this.prev();
      }

      window.setTimeout(() => {
        this.wheelThrottle = false;
      }, 700);
    }
  };

  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      this.touchStartY = e.touches[0].clientY;
      this.touchStartX = e.touches[0].clientX;
    }
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    if (!this.isSnapEnabled || e.changedTouches.length === 0) return;

    const deltaY = e.changedTouches[0].clientY - this.touchStartY;
    const deltaX = e.changedTouches[0].clientX - this.touchStartX;

    // Primarily vertical swipe
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 45) {
      if (deltaY < 0) {
        this.next();
      } else {
        this.prev();
      }
    }
  };

  private handleHashChange = (): void => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      const idx = this.slides.findIndex((s) => s.id === hash || `slide-${s.index + 1}` === hash);
      if (idx !== -1 && idx !== this.currentIndex) {
        this.goTo(idx, true);
      }
    }
  };

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.container.removeEventListener('wheel', this.handleWheel);
    this.container.removeEventListener('touchstart', this.handleTouchStart);
    this.container.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('hashchange', this.handleHashChange);
    this.observer?.disconnect();
  }
}
