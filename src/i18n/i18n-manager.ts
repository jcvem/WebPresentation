import { Language, UI_TRANSLATIONS, SLIDES_ZH_TW } from './translations';
import { SLIDES, SlideData } from '../slides/slide-data';

const LANG_STORAGE_KEY = 'objects_in_motion_lang_v1';

export class I18nManager {
  private currentLang: Language = 'en';
  private listeners: Set<(lang: Language) => void> = new Set();

  constructor() {
    this.currentLang = this.loadFromStorage();
    this.applyLanguage(this.currentLang, false);
  }

  public getLanguage(): Language {
    return this.currentLang;
  }

  public isZh(): boolean {
    return this.currentLang === 'zh-TW';
  }

  public toggleLanguage(): Language {
    const nextLang: Language = this.currentLang === 'en' ? 'zh-TW' : 'en';
    this.setLanguage(nextLang);
    return nextLang;
  }

  public setLanguage(lang: Language): void {
    if (this.currentLang === lang) return;
    this.currentLang = lang;
    this.applyLanguage(lang, true);
    this.listeners.forEach((fn) => fn(this.currentLang));
  }

  public onLanguageChange(fn: (lang: Language) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public t(key: string, fallback?: string): string {
    const dict = UI_TRANSLATIONS[this.currentLang] || UI_TRANSLATIONS['en'];
    return dict[key] || fallback || key;
  }

  public getDefaultSlides(lang: Language = this.currentLang): SlideData[] {
    return lang === 'zh-TW' ? JSON.parse(JSON.stringify(SLIDES_ZH_TW)) : JSON.parse(JSON.stringify(SLIDES));
  }

  private applyLanguage(lang: Language, persist: boolean = true): void {
    if (persist && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
      } catch (e) {
        console.warn('Could not save language to localStorage:', e);
      }
    }

    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = lang;
      document.documentElement.setAttribute('data-lang', lang);
      if (document.body) {
        document.body.setAttribute('data-lang', lang);
      }
    }
  }

  private loadFromStorage(): Language {
    if (typeof localStorage === 'undefined') return 'en';
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY) as Language;
      if (saved === 'zh-TW' || saved === 'en') {
        return saved;
      }
      if (typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('zh')) {
        return 'zh-TW';
      }
    } catch (e) {
      console.warn('Could not load language from localStorage:', e);
    }
    return 'en';
  }
}
