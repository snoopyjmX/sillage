import { describe, expect, it } from 'vitest';
import type { OlfactiveFamily } from '@/constants/labels';
import type { PerfumeSummary } from '@/types/catalog';
import type { DailyEntry } from '@/types/daily';
import {
  closetFit,
  pickClosetPerfume,
  recentlyWornIds,
  resolveHomeSource,
} from './closetSuggestion';

const perfume = (id: string, name: string, noteFamilies: OlfactiveFamily[]): PerfumeSummary => ({
  id,
  slug: id,
  name,
  brandName: 'Marca',
  brandSlug: 'marca',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: null,
  imagePath: null,
  families: [...new Set(noteFamilies)],
  noteFamilies,
});

// Faixas (constants/climate.ts): citrus 22-35, woody 5-22, oriental 0-18
const FRESH = perfume('fresh', 'Brisa', ['citrus', 'citrus']);
const WOODY = perfume('woody', 'Cedro', ['woody', 'woody']);
const ORIENTAL = perfume('oriental', 'Âmbar', ['oriental', 'oriental']);

const entry = (date: string, p: PerfumeSummary): DailyEntry => ({ date, perfume: p });

describe('resolveHomeSource (D10)', () => {
  it('a escolha explícita vale sempre', () => {
    expect(resolveHomeSource('catalog', 10)).toBe('catalog');
    expect(resolveHomeSource('closet', 0)).toBe('closet');
  });

  it.each([
    [0, 'catalog'],
    [2, 'catalog'],
    [3, 'closet'],
    [8, 'closet'],
  ])('sem escolha e com %i em "Tenho", o padrão é %s', (owned, expected) => {
    expect(resolveHomeSource(null, owned)).toBe(expected);
  });
});

describe('closetFit', () => {
  it('usa a família de cada nota, com repetição', () => {
    const mixed = perfume('mixed', 'Mix', ['citrus', 'woody', 'woody']);
    const onlyFamilies: PerfumeSummary = { ...mixed, noteFamilies: undefined };
    // Com repetição a faixa pende para o amadeirado; sem, é a média simples das duas famílias
    expect(closetFit(mixed, 10)).not.toBe(closetFit(onlyFamilies, 10));
  });

  it('sem notas não há faixa: pontua 0', () => {
    expect(closetFit(perfume('none', 'Nada', []), 20)).toBe(0);
  });
});

describe('recentlyWornIds', () => {
  const history = [
    entry('2026-10-12', FRESH),
    entry('2026-10-11', WOODY),
    entry('2026-10-10', ORIENTAL),
    entry('2026-10-09', perfume('old', 'Velho', ['musky'])),
  ];

  it('pega os 3 dias anteriores a hoje e deixa hoje e o resto de fora', () => {
    const ids = recentlyWornIds([entry('2026-10-13', FRESH), ...history], '2026-10-13');
    expect([...ids].sort()).toEqual(['fresh', 'oriental', 'woody']);
  });

  it('atravessa a virada do mês', () => {
    const ids = recentlyWornIds(
      [entry('2026-09-30', FRESH), entry('2026-09-29', WOODY), entry('2026-09-27', ORIENTAL)],
      '2026-10-02'
    );
    expect([...ids].sort()).toEqual(['fresh', 'woody']);
  });
});

describe('pickClosetPerfume (RN10 revisada)', () => {
  const none = new Set<string>();

  it('"Tenho" vazio não sugere nada', () => {
    expect(
      pickClosetPerfume({ owned: [], temperature: 28, date: '2026-10-13', recentIds: none })
    ).toBeNull();
  });

  it('coleção de 1 item sugere esse item', () => {
    expect(
      pickClosetPerfume({ owned: [WOODY], temperature: 30, date: '2026-10-13', recentIds: none })
    ).toBe(WOODY);
  });

  it('no calor, só entram os perfumes até 10 pontos abaixo do melhor', () => {
    // 30 °C: fresh (citrus) = 100; woody (5-22) perde 80 pontos; oriental (0-18) perde 100
    for (let day = 1; day <= 28; day += 1) {
      const date = `2026-10-${String(day).padStart(2, '0')}`;
      const pick = pickClosetPerfume({
        owned: [FRESH, WOODY, ORIENTAL],
        temperature: 30,
        date,
        recentIds: none,
      });
      expect(pick).toBe(FRESH);
    }
  });

  it('no frio, escolhe entre os adequados ao frio', () => {
    const picks = new Set<string>();
    for (let day = 1; day <= 28; day += 1) {
      const date = `2026-10-${String(day).padStart(2, '0')}`;
      const pick = pickClosetPerfume({
        owned: [FRESH, WOODY, ORIENTAL],
        temperature: 10,
        date,
        recentIds: none,
      });
      picks.add(pick?.id ?? '');
    }
    expect(picks.has('fresh')).toBe(false);
    expect(picks.size).toBeGreaterThan(0);
  });

  it('é estável: a mesma data e a mesma coleção dão o mesmo perfume', () => {
    const args = {
      owned: [FRESH, WOODY, ORIENTAL],
      temperature: 15,
      date: '2026-10-13',
      recentIds: none,
    };
    expect(pickClosetPerfume(args)).toBe(
      pickClosetPerfume({ ...args, owned: [ORIENTAL, WOODY, FRESH] })
    );
  });

  it('evita os vestidos recentemente quando sobra algum', () => {
    const owned = [WOODY, ORIENTAL];
    for (let day = 1; day <= 28; day += 1) {
      const date = `2026-10-${String(day).padStart(2, '0')}`;
      const pick = pickClosetPerfume({
        owned,
        temperature: 10,
        date,
        recentIds: new Set(['woody']),
      });
      expect(pick).toBe(ORIENTAL);
    }
  });

  it('todos vestidos recentemente: ignora a regra em vez de ficar sem sugestão', () => {
    const pick = pickClosetPerfume({
      owned: [WOODY, ORIENTAL],
      temperature: 10,
      date: '2026-10-13',
      recentIds: new Set(['woody', 'oriental']),
    });
    expect(pick).not.toBeNull();
  });

  it('sem clima, sorteia em todo o "Tenho" (inclusive o que o calor descartaria)', () => {
    const seen = new Set<string>();
    for (let day = 1; day <= 28; day += 1) {
      const date = `2026-10-${String(day).padStart(2, '0')}`;
      const pick = pickClosetPerfume({
        owned: [FRESH, WOODY, ORIENTAL],
        temperature: null,
        date,
        recentIds: none,
      });
      seen.add(pick?.id ?? '');
    }
    expect(seen.size).toBe(3);
  });
});
