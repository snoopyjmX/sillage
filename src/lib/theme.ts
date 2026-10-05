export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'sillage-theme';
export const DEFAULT_THEME: Theme = 'system';

const isTheme = (value: unknown): value is Theme => THEMES.some((theme) => theme === value);

// localStorage pode lançar (janela privada, dados bloqueados): nunca quebra a página
export const readStoredTheme = (): Theme => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

export const storeTheme = (theme: Theme): void => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // sem persistência: o tema vale só nesta sessão
  }
};

export const systemPrefersDark = (): boolean =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export const resolveTheme = (theme: Theme): ResolvedTheme =>
  theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme;

export const applyTheme = (resolved: ResolvedTheme): void => {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
};
