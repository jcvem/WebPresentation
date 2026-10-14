// Color Theme Management & Chromatics Engine
import { GeometryPalette } from '../renderer/geometry';

export interface ThemeColors {
  bgPrimary: string;
  bgSurface: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentHover: string;
  accentMuted: string;
  hairline: string;
  hairlineStrong: string;
  hairlineAccent: string;
  bgHeader: string;
  bgModal: string;
  bgModalBackdrop: string;
  bgVignette: string;
}

export interface ColorTheme {
  id: string;
  name: string;
  category: string;
  mode: 'dark' | 'light';
  description: string;
  colors: ThemeColors;
  objectPalette: GeometryPalette;
}

export const CURATED_THEMES: ColorTheme[] = [
  {
    id: 'obsidian-cadmium',
    name: 'Obsidian & Cadmium',
    category: 'DARK MONOGRAPH',
    mode: 'dark',
    description: 'Deep obsidian graphite foundation, surgical titanium typography, and luminous warm cadmium orange accents.',
    colors: {
      bgPrimary: '#090a0d',
      bgSurface: '#111317',
      bgElevated: '#181a20',
      textPrimary: '#f0eee9',
      textSecondary: '#8e94a0',
      textTertiary: '#525866',
      accent: '#e05a36',
      accentHover: '#f16843',
      accentMuted: 'rgba(224, 90, 54, 0.14)',
      hairline: 'rgba(255, 255, 255, 0.09)',
      hairlineStrong: 'rgba(255, 255, 255, 0.20)',
      hairlineAccent: 'rgba(224, 90, 54, 0.40)',
      bgHeader: 'rgba(9, 10, 13, 0.88)',
      bgModal: 'rgba(13, 15, 20, 0.96)',
      bgModalBackdrop: 'rgba(4, 5, 7, 0.82)',
      bgVignette: 'rgba(9, 10, 13, 0.75)'
    },
    objectPalette: {
      accentColor: [0.88, 0.35, 0.21],
      baseColor: [0.18, 0.20, 0.23],
      highlightColor: [0.55, 0.58, 0.64]
    }
  },
  {
    id: 'ceramic-cobalt',
    name: 'Ceramic & Cobalt',
    category: 'LIGHT GALLERY',
    mode: 'light',
    description: 'Pristine architectural gallery white, high-contrast slate typography, and electric Klein / cobalt blue accents.',
    colors: {
      bgPrimary: '#f8f9fa',
      bgSurface: '#ffffff',
      bgElevated: '#edf1f7',
      textPrimary: '#0f141c',
      textSecondary: '#475569',
      textTertiary: '#8b99ad',
      accent: '#1e56e3',
      accentHover: '#336bf2',
      accentMuted: 'rgba(30, 86, 227, 0.12)',
      hairline: 'rgba(15, 20, 28, 0.09)',
      hairlineStrong: 'rgba(15, 20, 28, 0.22)',
      hairlineAccent: 'rgba(30, 86, 227, 0.40)',
      bgHeader: 'rgba(248, 249, 250, 0.92)',
      bgModal: 'rgba(255, 255, 255, 0.98)',
      bgModalBackdrop: 'rgba(15, 20, 28, 0.55)',
      bgVignette: 'rgba(238, 242, 248, 0.65)'
    },
    objectPalette: {
      accentColor: [0.12, 0.38, 0.92],
      baseColor: [0.24, 0.28, 0.36],
      highlightColor: [0.68, 0.74, 0.84]
    }
  },
  {
    id: 'onyx-emerald',
    name: 'Onyx & Emerald',
    category: 'CYBERNETIC',
    mode: 'dark',
    description: 'Vantablack carbon substrate, cold silver lettering, and radiant luminous emerald accents.',
    colors: {
      bgPrimary: '#060b08',
      bgSurface: '#0d1611',
      bgElevated: '#13221a',
      textPrimary: '#f0fdf4',
      textSecondary: '#86efac',
      textTertiary: '#3b7454',
      accent: '#059669',
      accentHover: '#10b981',
      accentMuted: 'rgba(5, 150, 105, 0.16)',
      hairline: 'rgba(255, 255, 255, 0.09)',
      hairlineStrong: 'rgba(255, 255, 255, 0.20)',
      hairlineAccent: 'rgba(5, 150, 105, 0.40)',
      bgHeader: 'rgba(6, 11, 8, 0.88)',
      bgModal: 'rgba(13, 22, 17, 0.96)',
      bgModalBackdrop: 'rgba(3, 6, 4, 0.82)',
      bgVignette: 'rgba(6, 11, 8, 0.75)'
    },
    objectPalette: {
      accentColor: [0.05, 0.78, 0.50],
      baseColor: [0.14, 0.20, 0.16],
      highlightColor: [0.48, 0.68, 0.58]
    }
  },
  {
    id: 'ivory-crimson',
    name: 'Ivory & Crimson',
    category: 'FINE PRESS',
    mode: 'light',
    description: 'Natural warm ivory parchment, rich espresso black letterforms, and intense carmine crimson accents.',
    colors: {
      bgPrimary: '#f6f4ee',
      bgSurface: '#fffdf9',
      bgElevated: '#ece8df',
      textPrimary: '#1c1917',
      textSecondary: '#57534e',
      textTertiary: '#a8a29e',
      accent: '#dc2626',
      accentHover: '#ef4444',
      accentMuted: 'rgba(220, 38, 38, 0.12)',
      hairline: 'rgba(28, 25, 23, 0.09)',
      hairlineStrong: 'rgba(28, 25, 23, 0.22)',
      hairlineAccent: 'rgba(220, 38, 38, 0.40)',
      bgHeader: 'rgba(246, 244, 238, 0.92)',
      bgModal: 'rgba(255, 253, 249, 0.98)',
      bgModalBackdrop: 'rgba(28, 25, 23, 0.55)',
      bgVignette: 'rgba(235, 230, 220, 0.65)'
    },
    objectPalette: {
      accentColor: [0.86, 0.15, 0.15],
      baseColor: [0.26, 0.22, 0.20],
      highlightColor: [0.68, 0.60, 0.56]
    }
  },
  {
    id: 'midnight-amethyst',
    name: 'Midnight & Amethyst',
    category: 'ASTRONOMICAL',
    mode: 'dark',
    description: 'Nocturne cosmic midnight violet, pearl luminescence, and electric ultraviolet accents.',
    colors: {
      bgPrimary: '#090714',
      bgSurface: '#120e26',
      bgElevated: '#1a1538',
      textPrimary: '#f5f3ff',
      textSecondary: '#a78bfa',
      textTertiary: '#5b4d8a',
      accent: '#7c3aed',
      accentHover: '#8b5cf6',
      accentMuted: 'rgba(124, 58, 237, 0.16)',
      hairline: 'rgba(255, 255, 255, 0.09)',
      hairlineStrong: 'rgba(255, 255, 255, 0.20)',
      hairlineAccent: 'rgba(124, 58, 237, 0.40)',
      bgHeader: 'rgba(9, 7, 20, 0.88)',
      bgModal: 'rgba(18, 14, 38, 0.96)',
      bgModalBackdrop: 'rgba(4, 3, 10, 0.82)',
      bgVignette: 'rgba(9, 7, 20, 0.75)'
    },
    objectPalette: {
      accentColor: [0.55, 0.36, 0.96],
      baseColor: [0.18, 0.15, 0.26],
      highlightColor: [0.56, 0.52, 0.72]
    }
  }
];

const THEME_STORAGE_KEY = 'objects_in_motion_theme_selection';

export class ThemeManager {
  private currentTheme: ColorTheme;
  private listeners: Set<(theme: ColorTheme) => void> = new Set();

  constructor() {
    this.currentTheme = this.loadFromStorage();
    this.applyTheme(this.currentTheme, false);
  }

  public getCurrentTheme(): ColorTheme {
    return { ...this.currentTheme };
  }

  public getCuratedThemes(): ColorTheme[] {
    return CURATED_THEMES;
  }

  public onThemeChange(listener: (theme: ColorTheme) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public selectTheme(themeId: string): void {
    const theme = CURATED_THEMES.find((t) => t.id === themeId);
    if (!theme) return;
    this.applyTheme(theme, true);
  }

  public setCustomTheme(
    mode: 'dark' | 'light',
    accentHex: string,
    bgHex?: string
  ): void {
    const isDark = mode === 'dark';
    const bgPrimary = bgHex || (isDark ? '#090a0d' : '#f8f9fa');
    const bgSurface = isDark ? '#111317' : '#ffffff';
    const bgElevated = isDark ? '#181a20' : '#edf1f7';
    const textPrimary = isDark ? '#f0eee9' : '#0f141c';
    const textSecondary = isDark ? '#8e94a0' : '#475569';
    const textTertiary = isDark ? '#525866' : '#8b99ad';

    const accentRgb = hexToRgb(accentHex) || [0.88, 0.35, 0.21];

    const customTheme: ColorTheme = {
      id: 'custom-palette',
      name: 'Custom Palette',
      category: 'CUSTOM',
      mode,
      description: `Custom ${mode} exhibition identity with ${accentHex} accents.`,
      colors: {
        bgPrimary,
        bgSurface,
        bgElevated,
        textPrimary,
        textSecondary,
        textTertiary,
        accent: accentHex,
        accentHover: accentHex,
        accentMuted: `rgba(${Math.round(accentRgb[0] * 255)}, ${Math.round(accentRgb[1] * 255)}, ${Math.round(accentRgb[2] * 255)}, 0.16)`,
        hairline: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(15, 20, 28, 0.09)',
        hairlineStrong: isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(15, 20, 28, 0.22)',
        hairlineAccent: `rgba(${Math.round(accentRgb[0] * 255)}, ${Math.round(accentRgb[1] * 255)}, ${Math.round(accentRgb[2] * 255)}, 0.40)`,
        bgHeader: isDark ? 'rgba(9, 10, 13, 0.88)' : 'rgba(248, 249, 250, 0.92)',
        bgModal: isDark ? 'rgba(13, 15, 20, 0.96)' : 'rgba(255, 255, 255, 0.98)',
        bgModalBackdrop: isDark ? 'rgba(4, 5, 7, 0.82)' : 'rgba(15, 20, 28, 0.55)',
        bgVignette: isDark ? 'rgba(9, 10, 13, 0.75)' : 'rgba(238, 242, 248, 0.65)'
      },
      objectPalette: {
        accentColor: accentRgb,
        baseColor: isDark ? [0.18, 0.20, 0.23] : [0.24, 0.28, 0.36],
        highlightColor: isDark ? [0.55, 0.58, 0.64] : [0.68, 0.74, 0.84]
      }
    };

    this.applyTheme(customTheme, true);
  }

  public resetToDefault(): void {
    this.selectTheme('obsidian-cadmium');
  }

  public applyTheme(theme: ColorTheme, persist: boolean = true): void {
    this.currentTheme = { ...theme };

    if (persist) {
      this.saveToStorage(theme);
    }

    if (typeof document !== 'undefined' && document.documentElement) {
      const root = document.documentElement;
      root.setAttribute('data-theme', theme.id);
      root.setAttribute('data-theme-mode', theme.mode);
      if (document.body) {
        document.body.setAttribute('data-theme', theme.id);
        document.body.setAttribute('data-theme-mode', theme.mode);
      }

      const c = theme.colors;
      root.style.setProperty('--bg-primary', c.bgPrimary);
      root.style.setProperty('--bg-surface', c.bgSurface);
      root.style.setProperty('--bg-elevated', c.bgElevated);
      root.style.setProperty('--text-primary', c.textPrimary);
      root.style.setProperty('--text-secondary', c.textSecondary);
      root.style.setProperty('--text-tertiary', c.textTertiary);
      root.style.setProperty('--accent', c.accent);
      root.style.setProperty('--accent-hover', c.accentHover);
      root.style.setProperty('--accent-muted', c.accentMuted);
      root.style.setProperty('--hairline', c.hairline);
      root.style.setProperty('--hairline-strong', c.hairlineStrong);
      root.style.setProperty('--hairline-accent', c.hairlineAccent);
      root.style.setProperty('--bg-header', c.bgHeader);
      root.style.setProperty('--bg-modal', c.bgModal);
      root.style.setProperty('--bg-modal-backdrop', c.bgModalBackdrop);
      root.style.setProperty('--bg-vignette', c.bgVignette);
    }

    this.listeners.forEach((fn) => fn(this.currentTheme));
  }

  private saveToStorage(theme: ColorTheme): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    } catch (e) {
      console.warn('Could not save theme to localStorage:', e);
    }
  }

  private loadFromStorage(): ColorTheme {
    const defaultTheme = CURATED_THEMES[0];
    if (typeof localStorage === 'undefined') return defaultTheme;
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          const curated = CURATED_THEMES.find((t) => t.id === parsed.id);
          return curated || parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load theme from localStorage:', e);
    }
    return defaultTheme;
  }
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const sanitized = hex.replace('#', '').trim();
  if (sanitized.length === 3) {
    const r = parseInt(sanitized[0] + sanitized[0], 16) / 255;
    const g = parseInt(sanitized[1] + sanitized[1], 16) / 255;
    const b = parseInt(sanitized[2] + sanitized[2], 16) / 255;
    return [r, g, b];
  } else if (sanitized.length === 6) {
    const r = parseInt(sanitized.slice(0, 2), 16) / 255;
    const g = parseInt(sanitized.slice(2, 4), 16) / 255;
    const b = parseInt(sanitized.slice(4, 6), 16) / 255;
    return [r, g, b];
  }
  return null;
}
