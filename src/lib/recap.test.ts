import { describe, expect, it } from 'vitest';
import type { AnnualRecap } from '@/types/recap';
import { consistencyPercent, familyShift, isRecapTooEarly, parseRecapYear, yearOf } from './recap';

const recap = (overrides: Partial<AnnualRecap> = {}): AnnualRecap => ({
  year: 2026,
  daysWorn: 20,
  daysElapsed: 100,
  consistency: 0.2,
  signature: null,
  seasons: { summer: null, autumn: null, winter: null, spring: null },
  topNote: null,
  families: { firstSemester: [], secondSemester: [] },
  ...overrides,
});

describe('parseRecapYear', () => {
  it('aceita de 2026 até o ano de hoje', () => {
    expect(parseRecapYear('2026', 2026)).toBe(2026);
    expect(parseRecapYear('2027', 2028)).toBe(2027);
    expect(parseRecapYear('2028', 2028)).toBe(2028);
  });

  it.each([
    ['antes de 2026', '2025', 2026],
    ['no futuro', '2027', 2026],
    ['sem ano', undefined, 2026],
    ['vazio', '', 2026],
    ['com letras', '20a6', 2026],
    ['com sinal', '+2026', 2026],
    ['com decimal', '2026.5', 2026],
    ['com espaço', ' 2026', 2026],
    ['com 5 dígitos', '02026', 2026],
    ['notação científica', '2e3', 2026],
  ])('recusa ano %s', (_label, param, currentYear) => {
    expect(parseRecapYear(param, currentYear)).toBeNull();
  });
});

describe('yearOf', () => {
  it('lê o ano de uma data civil', () => {
    expect(yearOf('2026-10-14')).toBe(2026);
  });
});

describe('isRecapTooEarly', () => {
  it('menos de 7 dias é cedo demais; 7 já rende', () => {
    expect(isRecapTooEarly(recap({ daysWorn: 0 }))).toBe(true);
    expect(isRecapTooEarly(recap({ daysWorn: 6 }))).toBe(true);
    expect(isRecapTooEarly(recap({ daysWorn: 7 }))).toBe(false);
  });
});

describe('consistencyPercent', () => {
  it.each([
    [0, 0],
    [0.6789, 68],
    [0.5, 50],
    [1, 100],
  ])('%s -> %s', (value, percent) => {
    expect(consistencyPercent(value)).toBe(percent);
  });
});

describe('familyShift', () => {
  it('mostra a família dominante de cada semestre e se mudou', () => {
    expect(
      familyShift({
        firstSemester: [
          { family: 'citrus', weight: 9 },
          { family: 'woody', weight: 2 },
        ],
        secondSemester: [{ family: 'woody', weight: 7 }],
      })
    ).toEqual({ first: 'citrus', second: 'woody', changed: true });
  });

  it('mesma família nos dois semestres: não mudou', () => {
    expect(
      familyShift({
        firstSemester: [{ family: 'woody', weight: 3 }],
        secondSemester: [{ family: 'woody', weight: 5 }],
      })
    ).toEqual({ first: 'woody', second: 'woody', changed: false });
  });

  it('sem dados em um dos semestres, não afirma mudança', () => {
    expect(
      familyShift({ firstSemester: [{ family: 'woody', weight: 3 }], secondSemester: [] })
    ).toEqual({ first: 'woody', second: null, changed: false });
    expect(familyShift({ firstSemester: [], secondSemester: [] })).toEqual({
      first: null,
      second: null,
      changed: false,
    });
  });
});
