export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

// Fuso IANA do navegador; vira profiles.timezone no cadastro (base do Perfume do Dia, RN06).
export const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
};

// Data civil (AAAA-MM-DD) de um instante num fuso IANA: a mesma conta de set_daily_perfume
// (`(now() at time zone timezone)::date`, RN06). Fuso inválido cai no padrão em vez de quebrar.
export const todayInTimezone = (timezone: string, now: Date = new Date()): string => {
  const format = (zone: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  try {
    return format(timezone);
  } catch {
    return format(DEFAULT_TIMEZONE);
  }
};

// Data civil AAAA-MM-DD deslocada em `days` dias (negativo = passado). Sem fuso: a data já é civil.
export const addCivilDays = (date: string, days: number): string => {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
};

const TIMEZONE_AUTO_KEY = 'sillage-timezone-auto';

// Preferência de detectar o fuso pelo navegador. Padrão: ligada. Só do aparelho (localStorage).
export const readTimezoneAuto = (): boolean => {
  try {
    return window.localStorage.getItem(TIMEZONE_AUTO_KEY) !== 'false';
  } catch {
    return true;
  }
};

export const writeTimezoneAuto = (auto: boolean): void => {
  try {
    window.localStorage.setItem(TIMEZONE_AUTO_KEY, String(auto));
  } catch {
    // Sem armazenamento: a escolha vale só nesta sessão
  }
};
