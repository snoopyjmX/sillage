export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

// Fuso IANA do navegador; vira profiles.timezone no cadastro (base do Perfume do Dia, RN06).
export const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
};
