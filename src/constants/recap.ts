// Retrospectiva "Seu ano em perfumes" (Fase 23). Estações do hemisfério Sul, meteorológicas: o
// verão do ano N junta jan-fev e dez do mesmo ano civil (a mesma regra de get_annual_recap).
import type { Season } from '@/types/recap';

// Primeiro ano do produto: a função do banco recusa anos antes disso
export const RECAP_MIN_YEAR = 2026;
// Abaixo disto o ano ainda não rende uma retrospectiva
export const RECAP_MIN_DAYS = 7;

export const SEASONS: readonly Season[] = ['summer', 'autumn', 'winter', 'spring'];

export const SEASON_LABELS: Record<Season, string> = {
  summer: 'Verão',
  autumn: 'Outono',
  winter: 'Inverno',
  spring: 'Primavera',
};

export const SEASON_MONTHS: Record<Season, string> = {
  summer: 'dezembro a fevereiro',
  autumn: 'março a maio',
  winter: 'junho a agosto',
  spring: 'setembro a novembro',
};
