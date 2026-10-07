import { GENDERS, type PerfumeGender } from '@/constants/labels';

export type HomeGenderFilter = 'all' | PerfumeGender;

export const HOME_GENDER_STORAGE_KEY = 'sillage-home-gender';
export const DEFAULT_HOME_GENDER: HomeGenderFilter = 'all';

// Ordem de exibição do grupo de filtro
export const HOME_GENDER_OPTIONS: { value: HomeGenderFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'feminine', label: 'Feminino' },
  { value: 'masculine', label: 'Masculino' },
  { value: 'unisex', label: 'Unissex' },
];

const isHomeGender = (value: unknown): value is HomeGenderFilter =>
  value === 'all' || GENDERS.some((gender) => gender === value);

// localStorage pode lançar (janela privada, dados bloqueados): nunca quebra a página
export const readStoredHomeGender = (): HomeGenderFilter => {
  try {
    const stored = window.localStorage.getItem(HOME_GENDER_STORAGE_KEY);
    return isHomeGender(stored) ? stored : DEFAULT_HOME_GENDER;
  } catch {
    return DEFAULT_HOME_GENDER;
  }
};

export const storeHomeGender = (value: HomeGenderFilter): void => {
  try {
    window.localStorage.setItem(HOME_GENDER_STORAGE_KEY, value);
  } catch {
    // sem persistência: o filtro vale só nesta sessão
  }
};
