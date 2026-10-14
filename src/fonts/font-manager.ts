// Google Fonts Management and Typography Engine

export interface FontWeightOption {
  value: number;
  label: string;
}

export interface FontPairing {
  id: string;
  name: string;
  category: string;
  displayFont: string;
  bodyFont: string;
  description: string;
  displayWeight?: number;
  bodyWeight?: number;
}

export interface FontSelection {
  displayFont: string;
  bodyFont: string;
  displayWeight?: number;
  bodyWeight?: number;
  activePairingId?: string;
}

export const ALL_FONT_WEIGHTS: FontWeightOption[] = [
  { value: 100, label: '100 — Thin' },
  { value: 200, label: '200 — Extra Light' },
  { value: 300, label: '300 — Light' },
  { value: 400, label: '400 — Regular' },
  { value: 500, label: '500 — Medium' },
  { value: 600, label: '600 — Semi Bold' },
  { value: 700, label: '700 — Bold' },
  { value: 800, label: '800 — Extra Bold' },
  { value: 900, label: '900 — Black' },
];

export const WEIGHT_NAMES: Record<number, string> = {
  100: 'Thin (100)',
  200: 'Extra Light (200)',
  300: 'Light (300)',
  400: 'Regular (400)',
  500: 'Medium (500)',
  600: 'Semi Bold (600)',
  700: 'Bold (700)',
  800: 'Extra Bold (800)',
  900: 'Black (900)',
};

export const FONT_AVAILABLE_WEIGHTS: Record<string, number[]> = {
  'Syne': [400, 500, 600, 700, 800],
  'Space Grotesk': [300, 400, 500, 600, 700],
  'Playfair Display': [400, 500, 600, 700, 800, 900],
  'Inter': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'Outfit': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'Plus Jakarta Sans': [200, 300, 400, 500, 600, 700, 800],
  'Cinzel': [400, 500, 600, 700, 800, 900],
  'Cormorant Garamond': [300, 400, 500, 600, 700],
  'Oswald': [200, 300, 400, 500, 600, 700],
  'Source Sans 3': [200, 300, 400, 500, 600, 700, 800, 900],
  'Fraunces': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'Space Mono': [400, 700],
  'DM Sans': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'Bebas Neue': [400],
  'Montserrat': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'Poppins': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'Work Sans': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'Lora': [400, 500, 600, 700],
  'Newsreader': [200, 300, 400, 500, 600, 700, 800],
  'Roboto': [100, 300, 400, 500, 700, 900],
  'Open Sans': [300, 400, 500, 600, 700, 800],
  'Manrope': [200, 300, 400, 500, 600, 700, 800],
  'Raleway': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'IBM Plex Sans': [100, 200, 300, 400, 500, 600, 700],
  'Cabinet Grotesk': [400, 500, 700, 800, 900],
  'Cinzel Decorative': [400, 700, 900],
  'DM Serif Display': [400],
  'Righteous': [400],
  'Abril Fatface': [400],
  'Unbounded': [200, 300, 400, 500, 600, 700, 800, 900],
};

export function getAvailableWeightsForFont(fontFamily: string): number[] {
  const normalized = fontFamily.trim();
  for (const [key, weights] of Object.entries(FONT_AVAILABLE_WEIGHTS)) {
    if (key.toLowerCase() === normalized.toLowerCase()) {
      return [...weights];
    }
  }
  return [100, 200, 300, 400, 500, 600, 700, 800, 900];
}

export function getClosestWeight(target: number, available: number[]): number {
  if (available.length === 0) return target;
  if (available.includes(target)) return target;
  return available.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
  );
}

export const CURATED_FONT_PAIRINGS: FontPairing[] = [
  {
    id: 'syne-space-grotesk',
    name: 'Brutalist Monograph',
    category: 'Editorial',
    displayFont: 'Syne',
    bodyFont: 'Space Grotesk',
    displayWeight: 700,
    bodyWeight: 400,
    description: 'Sculptural, high-contrast geometric display paired with technical grotesque body.'
  },
  {
    id: 'playfair-inter',
    name: 'Editorial Elegance',
    category: 'Luxury Serif',
    displayFont: 'Playfair Display',
    bodyFont: 'Inter',
    displayWeight: 700,
    bodyWeight: 400,
    description: 'High-contrast transitional serif headline with crystal-clear neutral grotesque.'
  },
  {
    id: 'outfit-jakarta',
    name: 'Neo-Grotesque Tech',
    category: 'Modernist',
    displayFont: 'Outfit',
    bodyFont: 'Plus Jakarta Sans',
    displayWeight: 600,
    bodyWeight: 400,
    description: 'Clean, geometric digital aesthetic built for contemporary spatial design.'
  },
  {
    id: 'cinzel-cormorant',
    name: 'Classical Heritage',
    category: 'Historical',
    displayFont: 'Cinzel',
    bodyFont: 'Cormorant Garamond',
    displayWeight: 600,
    bodyWeight: 400,
    description: 'Roman inscriptional proportions paired with traditional Renaissance book serif.'
  },
  {
    id: 'oswald-source-sans',
    name: 'Swiss Impact Poster',
    category: 'Industrial',
    displayFont: 'Oswald',
    bodyFont: 'Source Sans 3',
    displayWeight: 600,
    bodyWeight: 400,
    description: 'Condensed gothic headline evoking mid-century exhibition posters.'
  },
  {
    id: 'fraunces-outfit',
    name: 'Warm Contemporary',
    category: 'Display Serif',
    displayFont: 'Fraunces',
    bodyFont: 'Outfit',
    displayWeight: 700,
    bodyWeight: 400,
    description: 'Expressive vintage variable serif with soft geometric sans body.'
  },
  {
    id: 'space-mono-dm-sans',
    name: 'Cybernetic Instrument',
    category: 'Technical',
    displayFont: 'Space Mono',
    bodyFont: 'DM Sans',
    displayWeight: 700,
    bodyWeight: 400,
    description: 'Monospaced telemetry titles with geometric humanist reading body.'
  },
  {
    id: 'bebas-montserrat',
    name: 'Monolithic Modern',
    category: 'Bold Display',
    displayFont: 'Bebas Neue',
    bodyFont: 'Montserrat',
    displayWeight: 400,
    bodyWeight: 400,
    description: 'Tall architectural headline with wide geometric grotesque content.'
  },
  {
    id: 'poppins-work-sans',
    name: 'Geometric Minimal',
    category: 'Clean',
    displayFont: 'Poppins',
    bodyFont: 'Work Sans',
    displayWeight: 600,
    bodyWeight: 400,
    description: 'Friendly circular curves balanced by grotesque Swiss proportions.'
  },
  {
    id: 'lora-newsreader',
    name: 'Literary Journal',
    category: 'Academic Serif',
    displayFont: 'Lora',
    bodyFont: 'Newsreader',
    displayWeight: 600,
    bodyWeight: 400,
    description: 'Calligraphic contemporary serif with editorial long-form readability.'
  }
];

export const POPULAR_DISPLAY_FONTS = [
  'Syne',
  'Playfair Display',
  'Outfit',
  'Cinzel',
  'Oswald',
  'Fraunces',
  'Space Mono',
  'Bebas Neue',
  'Poppins',
  'Lora',
  'Montserrat',
  'Space Grotesk',
  'Cabinet Grotesk',
  'Cinzel Decorative',
  'DM Serif Display',
  'Righteous',
  'Abril Fatface',
  'Unbounded'
];

export const POPULAR_BODY_FONTS = [
  'Space Grotesk',
  'Inter',
  'Plus Jakarta Sans',
  'Cormorant Garamond',
  'Source Sans 3',
  'DM Sans',
  'Montserrat',
  'Newsreader',
  'Work Sans',
  'Roboto',
  'Open Sans',
  'Manrope',
  'Raleway',
  'IBM Plex Sans',
  'Lora'
];

const STORAGE_KEY = 'objects_in_motion_font_selection';

export class FontManager {
  private currentSelection: FontSelection;
  private loadedFonts: Set<string> = new Set();
  private listeners: Set<(selection: FontSelection) => void> = new Set();

  constructor() {
    this.currentSelection = this.loadFromStorage();
    this.applyFonts(this.currentSelection, false);

    // Preload all curated font pairing styles so previews render authentic fonts immediately
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.preloadCuratedFonts();
      }, 50);
    }
  }

  public preloadCuratedFonts(): Promise<void> {
    if (typeof document === 'undefined') return Promise.resolve();

    if (document.getElementById('google-fonts-curated-preloads')) {
      return Promise.resolve();
    }

    const familiesMap = new Map<string, Set<number>>();
    for (const p of CURATED_FONT_PAIRINGS) {
      if (!familiesMap.has(p.displayFont)) familiesMap.set(p.displayFont, new Set());
      familiesMap.get(p.displayFont)!.add(p.displayWeight ?? 700);

      if (!familiesMap.has(p.bodyFont)) familiesMap.set(p.bodyFont, new Set());
      familiesMap.get(p.bodyFont)!.add(p.bodyWeight ?? 400);
    }

    // Build unified Google Fonts request with all curated pairings
    const parts: string[] = [];
    familiesMap.forEach((weights, family) => {
      const sanitized = family.trim().replace(/\s+/g, '+');
      const sortedWeights = Array.from(weights).sort((a, b) => a - b);
      parts.push(`family=${sanitized}:wght@${sortedWeights.join(';')}`);
    });

    const url = `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`;

    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.id = 'google-fonts-curated-preloads';
      link.rel = 'stylesheet';
      link.href = url;
      link.crossOrigin = 'anonymous';
      link.onload = () => {
        familiesMap.forEach((_, family) => {
          this.loadedFonts.add(`${family.toLowerCase()}_preload`);
        });
        resolve();
      };
      link.onerror = () => {
        Promise.all(Array.from(familiesMap.keys()).map((f) => this.ensureGoogleFontLoaded(f))).then(() => resolve());
      };
      document.head.appendChild(link);
    });
  }

  public getSelection(): FontSelection {
    return { ...this.currentSelection };
  }

  public getCuratedPairings(): FontPairing[] {
    return CURATED_FONT_PAIRINGS;
  }

  public onFontChange(listener: (selection: FontSelection) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public selectPairing(pairingId: string): void {
    const pairing = CURATED_FONT_PAIRINGS.find((p) => p.id === pairingId);
    if (!pairing) return;

    this.applyFonts(
      {
        displayFont: pairing.displayFont,
        bodyFont: pairing.bodyFont,
        displayWeight: pairing.displayWeight ?? 700,
        bodyWeight: pairing.bodyWeight ?? 400,
        activePairingId: pairing.id
      },
      true
    );
  }

  public setCustomFonts(
    displayFont: string,
    bodyFont: string,
    displayWeight?: number,
    bodyWeight?: number
  ): void {
    const dispFont = displayFont.trim();
    const bdFont = bodyFont.trim();

    const dispAvail = getAvailableWeightsForFont(dispFont);
    const bdAvail = getAvailableWeightsForFont(bdFont);

    const dWeight = getClosestWeight(displayWeight ?? this.currentSelection.displayWeight ?? 700, dispAvail);
    const bWeight = getClosestWeight(bodyWeight ?? this.currentSelection.bodyWeight ?? 400, bdAvail);

    const matchingPairing = CURATED_FONT_PAIRINGS.find(
      (p) =>
        p.displayFont.toLowerCase() === dispFont.toLowerCase() &&
        p.bodyFont.toLowerCase() === bdFont.toLowerCase() &&
        (p.displayWeight ?? 700) === dWeight &&
        (p.bodyWeight ?? 400) === bWeight
    );

    this.applyFonts(
      {
        displayFont: dispFont,
        bodyFont: bdFont,
        displayWeight: dWeight,
        bodyWeight: bWeight,
        activePairingId: matchingPairing?.id
      },
      true
    );
  }

  public resetToDefault(): void {
    this.selectPairing('syne-space-grotesk');
  }

  public async applyFonts(selection: FontSelection, persist: boolean = true): Promise<void> {
    const dWeight = selection.displayWeight ?? 700;
    const bWeight = selection.bodyWeight ?? 400;

    this.currentSelection = {
      ...selection,
      displayWeight: dWeight,
      bodyWeight: bWeight
    };

    if (persist) {
      this.saveToStorage(this.currentSelection);
    }

    // Apply to CSS variables
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.setProperty(
        '--font-display',
        `'${this.currentSelection.displayFont}', -apple-system, BlinkMacSystemFont, sans-serif`
      );
      document.documentElement.style.setProperty(
        '--font-body',
        `'${this.currentSelection.bodyFont}', -apple-system, BlinkMacSystemFont, sans-serif`
      );
      document.documentElement.style.setProperty('--font-display-weight', String(dWeight));
      document.documentElement.style.setProperty('--font-body-weight', String(bWeight));
    }

    this.listeners.forEach((fn) => fn(this.currentSelection));

    // Load fonts dynamically from Google Fonts API with weights
    try {
      await Promise.all([
        this.ensureGoogleFontLoaded(this.currentSelection.displayFont, dWeight),
        this.ensureGoogleFontLoaded(this.currentSelection.bodyFont, bWeight)
      ]);
    } catch {
      // Graceful fallback
    }
  }

  public ensureGoogleFontLoaded(fontFamily: string, requestedWeight?: number): Promise<void> {
    if (!fontFamily) return Promise.resolve();

    const sanitizedFamily = fontFamily.trim().replace(/\s+/g, '+');
    const availableWeights = getAvailableWeightsForFont(fontFamily);

    let weightsToFetch: number[];
    if (requestedWeight) {
      weightsToFetch = Array.from(new Set([...availableWeights, requestedWeight])).sort((a, b) => a - b);
    } else {
      weightsToFetch = availableWeights;
    }

    const loadKey = `${fontFamily.toLowerCase()}_${weightsToFetch.join('-')}`;
    if (this.loadedFonts.has(loadKey)) {
      return Promise.resolve();
    }

    if (typeof document === 'undefined') {
      this.loadedFonts.add(loadKey);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const linkId = `google-font-${sanitizedFamily.toLowerCase()}`;

      // If an existing link tag for this font exists, replace or update it
      const existingLink = document.getElementById(linkId);

      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';

      // Build specific weights URL
      const wghtParam = weightsToFetch.length > 0 ? `:wght@${weightsToFetch.join(';')}` : '';
      link.href = `https://fonts.googleapis.com/css2?family=${sanitizedFamily}${wghtParam}&display=swap`;
      link.crossOrigin = 'anonymous';

      link.onload = () => {
        this.loadedFonts.add(loadKey);
        if (existingLink && existingLink !== link) {
          existingLink.remove();
        }
        resolve();
      };

      link.onerror = () => {
        // Fallback: try loading standard family without weights if specific weights URL failed
        console.warn(`Could not load Google Font "${fontFamily}" with requested weights. Attempting unweighted fallback.`);
        link.onerror = () => {
          this.loadedFonts.add(loadKey);
          resolve();
        };
        link.href = `https://fonts.googleapis.com/css2?family=${sanitizedFamily}&display=swap`;
      };

      try {
        document.head.appendChild(link);
      } catch {
        this.loadedFonts.add(loadKey);
        resolve();
      }
    });
  }

  private loadFromStorage(): FontSelection {
    const defaultSelection: FontSelection = {
      displayFont: 'Syne',
      bodyFont: 'Space Grotesk',
      displayWeight: 700,
      bodyWeight: 400,
      activePairingId: 'syne-space-grotesk'
    };

    if (typeof localStorage === 'undefined') {
      return defaultSelection;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.displayFont && parsed.bodyFont) {
          return {
            ...defaultSelection,
            ...parsed,
            displayWeight: parsed.displayWeight ?? 700,
            bodyWeight: parsed.bodyWeight ?? 400
          };
        }
      }
    } catch (e) {
      console.warn('Failed to read font selection from localStorage:', e);
    }

    return defaultSelection;
  }

  private saveToStorage(selection: FontSelection): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch (e) {
      console.warn('Failed to save font selection to localStorage:', e);
    }
  }
}
