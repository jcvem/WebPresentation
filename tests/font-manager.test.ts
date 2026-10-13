import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FontManager,
  CURATED_FONT_PAIRINGS,
  getAvailableWeightsForFont,
  getClosestWeight,
  FONT_AVAILABLE_WEIGHTS
} from '../src/fonts/font-manager';

describe('FontManager Google Fonts Engine', () => {
  let fontManager: FontManager;

  beforeEach(() => {
    localStorage.clear();
    fontManager = new FontManager();
  });

  it('should provide at least 8 curated Google Font pairings with non-empty fields', () => {
    expect(CURATED_FONT_PAIRINGS.length).toBeGreaterThanOrEqual(8);
    CURATED_FONT_PAIRINGS.forEach((pairing) => {
      expect(pairing.id).toBeTruthy();
      expect(pairing.name).toBeTruthy();
      expect(pairing.displayFont).toBeTruthy();
      expect(pairing.bodyFont).toBeTruthy();
      expect(pairing.category).toBeTruthy();
      expect(pairing.description).toBeTruthy();
      expect(pairing.displayWeight).toBeDefined();
      expect(pairing.bodyWeight).toBeDefined();
    });
  });

  it('should initialize with default Syne & Space Grotesk pairing and default weights', () => {
    const sel = fontManager.getSelection();
    expect(sel.displayFont).toBe('Syne');
    expect(sel.bodyFont).toBe('Space Grotesk');
    expect(sel.displayWeight).toBe(700);
    expect(sel.bodyWeight).toBe(400);
    expect(sel.activePairingId).toBe('syne-space-grotesk');
  });

  it('should allow selecting curated pairing and notify listeners with weights', () => {
    const listener = vi.fn();
    fontManager.onFontChange(listener);

    fontManager.selectPairing('outfit-jakarta');
    const sel = fontManager.getSelection();

    expect(sel.displayFont).toBe('Outfit');
    expect(sel.bodyFont).toBe('Plus Jakarta Sans');
    expect(sel.displayWeight).toBe(600);
    expect(sel.bodyWeight).toBe(400);
    expect(sel.activePairingId).toBe('outfit-jakarta');
    expect(listener).toHaveBeenCalledWith(sel);
  });

  it('should allow setting custom Google Fonts with specific weights', () => {
    fontManager.setCustomFonts('Outfit', 'Inter', 300, 200);
    const sel = fontManager.getSelection();

    expect(sel.displayFont).toBe('Outfit');
    expect(sel.bodyFont).toBe('Inter');
    expect(sel.displayWeight).toBe(300);
    expect(sel.bodyWeight).toBe(200);
  });

  it('should clamp/snap to available weights for fonts with limited weight support', () => {
    // Bebas Neue only supports 400
    fontManager.setCustomFonts('Bebas Neue', 'Space Mono', 800, 300);
    const sel = fontManager.getSelection();

    expect(sel.displayFont).toBe('Bebas Neue');
    expect(sel.displayWeight).toBe(400); // snapped to only available weight 400

    expect(sel.bodyFont).toBe('Space Mono');
    expect(sel.bodyWeight).toBe(400); // 300 is closest to 400 in [400, 700]
  });

  it('should return correct available weights from dictionary and default for unknown fonts', () => {
    expect(getAvailableWeightsForFont('Syne')).toEqual(FONT_AVAILABLE_WEIGHTS['Syne']);
    expect(getAvailableWeightsForFont('Bebas Neue')).toEqual([400]);
    expect(getAvailableWeightsForFont('Unknown Custom Font')).toEqual([
      100, 200, 300, 400, 500, 600, 700, 800, 900
    ]);
  });

  it('should find closest available weight correctly', () => {
    expect(getClosestWeight(350, [300, 400, 500])).toBe(300);
    expect(getClosestWeight(850, [400, 700])).toBe(700);
    expect(getClosestWeight(500, [500])).toBe(500);
    expect(getClosestWeight(100, [])).toBe(100);
  });

  it('should reset back to default Brutalist Monograph pairing', () => {
    fontManager.selectPairing('oswald-source-sans');
    fontManager.resetToDefault();

    const sel = fontManager.getSelection();
    expect(sel.displayFont).toBe('Syne');
    expect(sel.bodyFont).toBe('Space Grotesk');
    expect(sel.displayWeight).toBe(700);
    expect(sel.bodyWeight).toBe(400);
    expect(sel.activePairingId).toBe('syne-space-grotesk');
  });

  it('should persist font and weight selection to localStorage', () => {
    fontManager.setCustomFonts('Playfair Display', 'Inter', 900, 300);
    const stored = JSON.parse(localStorage.getItem('objects_in_motion_font_selection') || '{}');

    expect(stored.displayFont).toBe('Playfair Display');
    expect(stored.bodyFont).toBe('Inter');
    expect(stored.displayWeight).toBe(900);
    expect(stored.bodyWeight).toBe(300);
  });
});
