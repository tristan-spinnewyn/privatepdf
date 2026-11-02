import { detectInitialLanguage, saveLanguage } from '../../i18n/language-storage';

const STORAGE_KEY = 'app_language';

describe('language storage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('restores the language saved by the user', () => {
    saveLanguage('en');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
    expect(detectInitialLanguage('fr-FR')).toBe('en');
  });

  it('falls back to the browser language when nothing valid is saved', () => {
    localStorage.setItem(STORAGE_KEY, 'de');
    expect(detectInitialLanguage('en-US')).toBe('en');
    expect(detectInitialLanguage('de-DE')).toBe('fr');
  });

  it('keeps working when the browser blocks storage access', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });

    expect(detectInitialLanguage('en-GB')).toBe('en');
    expect(() => saveLanguage('fr')).not.toThrow();
  });
});
