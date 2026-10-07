// Aviso booleano de que a localização do aparelho já foi concedida. É a única coisa sobre
// localização que vai ao localStorage: nunca coordenadas (docs/SECURITY.md). O storage pode
// estar bloqueado (janela privada), então toda leitura e escrita é tolerante a falha.
import { GEO_HINT_KEY } from '@/constants/weather';

export const hasGeoHint = (): boolean => {
  try {
    return window.localStorage.getItem(GEO_HINT_KEY) === '1';
  } catch {
    return false;
  }
};

export const setGeoHint = (): void => {
  try {
    window.localStorage.setItem(GEO_HINT_KEY, '1');
  } catch {
    // sem storage: o clique continua funcionando, só não há persistência
  }
};

export const clearGeoHint = (): void => {
  try {
    window.localStorage.removeItem(GEO_HINT_KEY);
  } catch {
    // idem
  }
};
