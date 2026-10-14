// Regras puras da retrospectiva anual (Fase 23).
import { RECAP_MIN_DAYS, RECAP_MIN_YEAR } from '@/constants/recap';
import type { OlfactiveFamily } from '@/constants/labels';
import type { AnnualRecap } from '@/types/recap';

// Ano da URL (`/recap/:year`): só 4 dígitos, de 2026 até o ano de hoje. Fora disso, não existe.
export const parseRecapYear = (param: string | undefined, currentYear: number): number | null => {
  if (!param || !/^\d{4}$/.test(param)) return null;
  const year = Number(param);
  return year >= RECAP_MIN_YEAR && year <= currentYear ? year : null;
};

// Ano de uma data civil AAAA-MM-DD
export const yearOf = (date: string): number => Number(date.slice(0, 4));

// Poucos dias vestidos: o ano ainda não rende uma retrospectiva
export const isRecapTooEarly = (recap: AnnualRecap): boolean => recap.daysWorn < RECAP_MIN_DAYS;

// 0,6789 -> 68 (inteiro, para "68% do ano")
export const consistencyPercent = (consistency: number): number => Math.round(consistency * 100);

export interface FamilyShift {
  first: OlfactiveFamily | null;
  second: OlfactiveFamily | null;
  // Mudou a família dominante de um semestre para o outro
  changed: boolean;
}

// Evolução do gosto: a família dominante do 1º e a do 2º semestre (as listas já vêm do maior ao menor)
export const familyShift = (families: AnnualRecap['families']): FamilyShift => {
  const first = families.firstSemester[0]?.family ?? null;
  const second = families.secondSemester[0]?.family ?? null;
  return { first, second, changed: first !== null && second !== null && first !== second };
};
