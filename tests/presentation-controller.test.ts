import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PresentationController } from '../src/controller/presentation-controller';
import { SLIDES } from '../src/slides/slide-data';

describe('Presentation Controller Navigation & State', () => {
  let container: HTMLElement;
  let slideElements: HTMLElement[];
  let announcer: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'presentation-viewport';
    document.body.appendChild(container);

    announcer = document.createElement('div');
    announcer.id = 'slide-announcer';
    document.body.appendChild(announcer);

    slideElements = SLIDES.map((slide) => {
      const el = document.createElement('section');
      el.className = 'slide';
      el.id = slide.id;
      el.dataset.index = slide.index.toString();
      el.scrollIntoView = vi.fn();
      container.appendChild(el);
      return el;
    });

    window.location.hash = '';
  });

  it('should initialize at slide index 0 and update announcer', () => {
    const controller = new PresentationController({
      slides: SLIDES,
      container,
      slideElements,
      announcerElement: announcer
    });

    expect(controller.currentIndex).toBe(0);
    expect(announcer.textContent).toContain('Slide 1 of 6');
    expect(announcer.textContent).toContain(SLIDES[0].title);
  });

  it('should advance with next() and stop at the final slide (clamping)', () => {
    const controller = new PresentationController({
      slides: SLIDES,
      container,
      slideElements,
      announcerElement: announcer
    });

    controller.next();
    expect(controller.currentIndex).toBe(1);
    expect(slideElements[1].scrollIntoView).toHaveBeenCalled();

    // Advance all the way to last slide
    for (let i = 0; i < 10; i++) {
      controller.next();
    }
    expect(controller.currentIndex).toBe(SLIDES.length - 1);
  });

  it('should move back with prev() and stop at index 0 (no underflow)', () => {
    const controller = new PresentationController({
      slides: SLIDES,
      container,
      slideElements,
      announcerElement: announcer
    });

    controller.goTo(3, false);
    expect(controller.currentIndex).toBe(3);

    controller.prev();
    expect(controller.currentIndex).toBe(2);

    controller.prev();
    controller.prev();
    controller.prev(); // Beyond 0
    expect(controller.currentIndex).toBe(0);
  });

  it('should restart presentation to slide index 0', () => {
    const controller = new PresentationController({
      slides: SLIDES,
      container,
      slideElements,
      announcerElement: announcer
    });

    controller.goTo(4, false);
    expect(controller.currentIndex).toBe(4);

    controller.restart();
    expect(controller.currentIndex).toBe(0);
  });

  it('should navigate to slide by ID', () => {
    const controller = new PresentationController({
      slides: SLIDES,
      container,
      slideElements,
      announcerElement: announcer
    });

    controller.goToId('system', false);
    expect(controller.currentIndex).toBe(3);
    expect(SLIDES[controller.currentIndex].id).toBe('system');
  });

  it('should toggle and respect reduced-motion mode', () => {
    const motionSpy = vi.fn();
    const controller = new PresentationController({
      slides: SLIDES,
      container,
      slideElements,
      onMotionChange: motionSpy
    });

    controller.setReducedMotion(true);
    expect(controller.isReducedMotion).toBe(true);
    expect(document.documentElement.classList.contains('reduced-motion')).toBe(true);
    expect(motionSpy).toHaveBeenCalledWith(true);

    controller.toggleReducedMotion();
    expect(controller.isReducedMotion).toBe(false);
    expect(document.documentElement.classList.contains('reduced-motion')).toBe(false);
    expect(motionSpy).toHaveBeenCalledWith(false);
  });

  it('should toggle scroll-snap mode', () => {
    const snapSpy = vi.fn();
    const controller = new PresentationController({
      slides: SLIDES,
      container,
      slideElements,
      onSnapChange: snapSpy
    });

    expect(controller.isSnapEnabled).toBe(true);
    controller.toggleSnap();
    expect(controller.isSnapEnabled).toBe(false);
    expect(container.classList.contains('no-snap')).toBe(true);
    expect(snapSpy).toHaveBeenCalledWith(false);
  });

  it('should handle keyboard navigation keys', () => {
    const controller = new PresentationController({
      slides: SLIDES,
      container,
      slideElements
    });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(controller.currentIndex).toBe(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
    expect(controller.currentIndex).toBe(2);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(controller.currentIndex).toBe(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    expect(controller.currentIndex).toBe(0);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    expect(controller.currentIndex).toBe(5);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(controller.currentIndex).toBe(0);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    expect(controller.currentIndex).toBe(0);
  });
});
