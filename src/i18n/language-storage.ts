export type AppLanguage = 'fr' | 'en';

const STORAGE_KEY = 'app_language';
const LANGUAGES: readonly AppLanguage[] = ['fr', 'en'];

function isAppLanguage(value: string | null): value is AppLanguage {
  return LANGUAGES.includes(value as AppLanguage);
}

// localStorage throws when the browser blocks site data (sandboxed iframe, strict privacy settings)
function readSavedLanguage(): AppLanguage | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isAppLanguage(saved) ? saved : null;
  } catch {
    return null;
  }
}

/**
 * The language saved by the user, else English for English browsers and French otherwise
 */
export function detectInitialLanguage(browserLanguage: string): AppLanguage {
  return readSavedLanguage() ?? (browserLanguage.startsWith('en') ? 'en' : 'fr');
}

/**
 * Remembers the chosen language when the browser allows it
 */
export function saveLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Not persisted: the language resets to the browser default on the next visit
  }
}
