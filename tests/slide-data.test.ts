import { describe, it, expect } from 'vitest';
import { SLIDES } from '../src/slides/slide-data';

describe('Slide Data Registry', () => {
  it('should contain exactly 6 curated slides', () => {
    expect(SLIDES).toHaveLength(6);
  });

  it('should have strictly consecutive indices from 0 to 5', () => {
    SLIDES.forEach((slide, idx) => {
      expect(slide.index).toBe(idx);
    });
  });

  it('should have unique, non-empty IDs', () => {
    const ids = SLIDES.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(SLIDES.length);
    ids.forEach((id) => {
      expect(id).toMatch(/^[a-z0-9-]+$/);
    });
  });

  it('should include meaningful non-empty titles, theses, and catalog badges', () => {
    SLIDES.forEach((slide) => {
      expect(slide.title.trim().length).toBeGreaterThan(3);
      expect(slide.thesis.trim().length).toBeGreaterThan(10);
      expect(slide.catalogNumber).toMatch(/PLATE 0[1-6] \/ 06/);
      expect(slide.superTitle.trim().length).toBeGreaterThan(3);
    });
  });

  it('should define a valid 3D ObjectPose for each slide', () => {
    SLIDES.forEach((slide) => {
      const { pose } = slide;
      expect(typeof pose.rotX).toBe('number');
      expect(typeof pose.rotY).toBe('number');
      expect(typeof pose.rotZ).toBe('number');
      expect(typeof pose.scale).toBe('number');
      expect(pose.scale).toBeGreaterThan(0.5);
      expect(typeof pose.spinRate).toBe('number');
      expect(typeof pose.explodedDistance).toBe('number');
      expect(typeof pose.coreSplit).toBe('number');
      expect(typeof pose.dialAlign).toBe('number');
    });
  });

  it('should provide 3 labeled assemblies for Slide 4 (System)', () => {
    const systemSlide = SLIDES.find((s) => s.id === 'system');
    expect(systemSlide).toBeDefined();
    expect(systemSlide?.components).toBeDefined();
    expect(systemSlide?.components).toHaveLength(3);
    const tags = systemSlide?.components?.map((c) => c.tag);
    expect(tags).toEqual(['A', 'B', 'C']);
  });

  it('should provide sequential kinetic steps for Slide 3 (Motion)', () => {
    const motionSlide = SLIDES.find((s) => s.id === 'motion');
    expect(motionSlide).toBeDefined();
    expect(motionSlide?.sequence).toBeDefined();
    expect(motionSlide?.sequence).toHaveLength(3);
    expect(motionSlide?.sequence?.[0].index).toBe('01');
  });

  it('should provide restart and free scroll actions for Slide 6 (Closing)', () => {
    const closingSlide = SLIDES.find((s) => s.id === 'closing');
    expect(closingSlide).toBeDefined();
    expect(closingSlide?.action).toBeDefined();
    expect(closingSlide?.action?.primaryText).toMatch(/Restart/i);
  });
});
