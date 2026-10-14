import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeManager, hexToRgb } from '../src/themes/theme-manager';

describe('ThemeManager & Color Chromatics Engine', () => {
  let themeManager: ThemeManager;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-mode');
    document.body.removeAttribute('data-theme');
    document.body.removeAttribute('data-theme-mode');
    themeManager = new ThemeManager();
  });

  it('should initialize with default Obsidian & Cadmium dark theme', () => {
    const current = themeManager.getCurrentTheme();
    expect(current.id).toBe('obsidian-cadmium');
    expect(current.mode).toBe('dark');
    expect(current.name).toBe('Obsidian & Cadmium');
    expect(current.colors.accent).toBe('#e05a36');
    expect(document.documentElement.getAttribute('data-theme')).toBe('obsidian-cadmium');
    expect(document.documentElement.getAttribute('data-theme-mode')).toBe('dark');
  });

  it('should provide Ceramic & Cobalt (White and Blue) curated theme', () => {
    const curated = themeManager.getCuratedThemes();
    const whiteBlue = curated.find((t) => t.id === 'ceramic-cobalt');

    expect(whiteBlue).toBeDefined();
    expect(whiteBlue?.mode).toBe('light');
    expect(whiteBlue?.name).toBe('Ceramic & Cobalt');
    expect(whiteBlue?.colors.bgPrimary).toBe('#f8f9fa');
    expect(whiteBlue?.colors.bgSurface).toBe('#ffffff');
    expect(whiteBlue?.colors.accent).toBe('#1e56e3');
    expect(whiteBlue?.objectPalette.accentColor).toEqual([0.12, 0.38, 0.92]);
  });

  it('should switch to Ceramic & Cobalt theme and apply CSS variables', () => {
    themeManager.selectTheme('ceramic-cobalt');

    const current = themeManager.getCurrentTheme();
    expect(current.id).toBe('ceramic-cobalt');
    expect(current.mode).toBe('light');

    expect(document.documentElement.getAttribute('data-theme')).toBe('ceramic-cobalt');
    expect(document.documentElement.getAttribute('data-theme-mode')).toBe('light');
    expect(document.documentElement.style.getPropertyValue('--bg-primary')).toBe('#f8f9fa');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#1e56e3');

    // Persistence in localStorage
    const saved = JSON.parse(localStorage.getItem('objects_in_motion_theme_selection') || '{}');
    expect(saved.id).toBe('ceramic-cobalt');
  });

  it('should notify subscribers when theme changes', () => {
    let notifiedThemeId = '';
    const unsubscribe = themeManager.onThemeChange((t) => {
      notifiedThemeId = t.id;
    });

    themeManager.selectTheme('ceramic-cobalt');
    expect(notifiedThemeId).toBe('ceramic-cobalt');

    themeManager.selectTheme('onyx-emerald');
    expect(notifiedThemeId).toBe('onyx-emerald');

    unsubscribe();
    themeManager.selectTheme('obsidian-cadmium');
    expect(notifiedThemeId).toBe('onyx-emerald'); // did not fire after unsubscribe
  });

  it('should support custom palette builder with custom accent and mode', () => {
    themeManager.setCustomTheme('light', '#2563eb', '#ffffff');

    const current = themeManager.getCurrentTheme();
    expect(current.id).toBe('custom-palette');
    expect(current.mode).toBe('light');
    expect(current.colors.accent).toBe('#2563eb');
    expect(current.colors.bgPrimary).toBe('#ffffff');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#2563eb');
  });

  it('should reset back to default theme', () => {
    themeManager.selectTheme('ceramic-cobalt');
    expect(themeManager.getCurrentTheme().id).toBe('ceramic-cobalt');

    themeManager.resetToDefault();
    expect(themeManager.getCurrentTheme().id).toBe('obsidian-cadmium');
  });

  it('should correctly parse hex color to rgb floats', () => {
    expect(hexToRgb('#ffffff')).toEqual([1, 1, 1]);
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
    const rgb = hexToRgb('#1e56e3');
    expect(rgb).not.toBeNull();
    expect(rgb![0]).toBeCloseTo(0.1176, 2);
    expect(rgb![1]).toBeCloseTo(0.3372, 2);
    expect(rgb![2]).toBeCloseTo(0.8901, 2);
  });
});
