import type { HomeSource } from '@/lib/closetSuggestion';

export const HOME_SOURCE_STORAGE_KEY = 'sillage-home-source';

export const HOME_SOURCE_OPTIONS: { value: HomeSource; label: string }[] = [
  { value: 'catalog', label: 'Catálogo' },
  { value: 'closet', label: 'Meu armário' },
];

const isHomeSource = (value: unknown): value is HomeSource =>
  value === 'catalog' || value === 'closet';

// Nulo = a pessoa ainda não escolheu (vale o padrão). localStorage pode lançar (janela privada).
export const readStoredHomeSource = (): HomeSource | null => {
  try {
    const stored = window.localStorage.getItem(HOME_SOURCE_STORAGE_KEY);
    return isHomeSource(stored) ? stored : null;
  } catch {
    return null;
  }
};

export const storeHomeSource = (value: HomeSource): void => {
  try {
    window.localStorage.setItem(HOME_SOURCE_STORAGE_KEY, value);
  } catch {
    // sem persistência: a escolha vale só nesta sessão
  }
};
