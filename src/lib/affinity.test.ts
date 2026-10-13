import { describe, expect, it } from 'vitest';
import type { OlfactiveFamily } from '@/constants/labels';
import type { PyramidNote } from '@/types/catalog';
import type { OlfactoryDna } from '@/types/dna';
import { AFFINITY_LABELS, computeAffinity } from './affinity';

const note = (
  slug: string,
  name: string,
  family: OlfactiveFamily,
  position = 'top'
): PyramidNote => ({
  slug,
  name,
  family,
  position: position as PyramidNote['position'],
  description: null,
});

// DNA: 60% amadeirado, 30% cítrico, 10% floral; as notas que mais aparecem são Cedro e Limão
const dna: OlfactoryDna = {
  families: [
    { family: 'woody', weight: 6 },
    { family: 'citrus', weight: 3 },
    { family: 'floral', weight: 1 },
  ],
  topNotes: [
    { slug: 'cedro', name: 'Cedro', family: 'woody', weight: 4 },
    { slug: 'limao', name: 'Limão', family: 'citrus', weight: 3 },
  ],
  wishFamily: null,
  wantedCount: 0,
  perfumeCount: 5,
  memorialDays: 4,
};

describe('computeAffinity (D12)', () => {
  it('alta: mesmas famílias e notas do DNA, sem sugerir decant', () => {
    const result = computeAffinity(dna, [
      note('cedro', 'Cedro', 'woody', 'base'),
      note('vetiver', 'Vetiver', 'woody', 'base'),
      note('limao', 'Limão', 'citrus'),
    ]);
    expect(result).toEqual({
      level: 'high',
      reasons: [
        'Divide Amadeirado e Cítrico com a sua coleção',
        'Tem Cedro e Limão, notas que mais aparecem na sua coleção',
      ],
      suggestDecant: false,
    });
  });

  it('média: divide uma família e uma nota, e sugere decant', () => {
    const result = computeAffinity(dna, [
      note('cedro', 'Cedro', 'woody', 'base'),
      note('sal', 'Sal marinho', 'aquatic'),
      note('alga', 'Alga', 'aquatic'),
    ]);
    expect(result?.level).toBe('medium');
    expect(result?.reasons).toEqual([
      'Divide Amadeirado com a sua coleção',
      'Tem Cedro, uma das notas que mais aparecem na sua coleção',
    ]);
    expect(result?.suggestDecant).toBe(true);
  });

  it('baixa: território novo abre os motivos e sugere decant', () => {
    const result = computeAffinity(dna, [
      note('sal', 'Sal marinho', 'aquatic'),
      note('alga', 'Alga', 'aquatic', 'heart'),
    ]);
    expect(result).toEqual({
      level: 'low',
      reasons: ['Você ainda não tem nada Aquático'],
      suggestDecant: true,
    });
  });

  it('baixa com algo em comum: o que é novo vem primeiro, no máximo dois motivos', () => {
    const result = computeAffinity(dna, [
      note('sal', 'Sal marinho', 'aquatic'),
      note('alga', 'Alga', 'aquatic'),
      note('brisa', 'Brisa', 'aquatic'),
      note('coco', 'Coco', 'fruity'),
      note('cedro', 'Cedro', 'woody', 'base'),
    ]);
    expect(result?.level).toBe('low');
    expect(result?.reasons).toHaveLength(2);
    expect(result?.reasons[0]).toBe('Você ainda não tem nada Aquático');
  });

  it('o rótulo nunca traz porcentagem', () => {
    for (const label of Object.values(AFFINITY_LABELS)) expect(label).not.toMatch(/%|\d/);
  });

  it('a mesma nota em duas posições conta uma vez', () => {
    const once = computeAffinity(dna, [
      note('cedro', 'Cedro', 'woody', 'heart'),
      note('sal', 'Sal marinho', 'aquatic'),
    ]);
    const twice = computeAffinity(dna, [
      note('cedro', 'Cedro', 'woody', 'heart'),
      note('cedro', 'Cedro', 'woody', 'base'),
      note('sal', 'Sal marinho', 'aquatic'),
    ]);
    expect(twice).toEqual(once);
  });

  it('DNA ainda se formando (D3): não avalia', () => {
    expect(
      computeAffinity({ ...dna, perfumeCount: 2 }, [note('cedro', 'Cedro', 'woody')])
    ).toBeNull();
  });

  it('perfume sem notas: não há o que comparar', () => {
    expect(computeAffinity(dna, [])).toBeNull();
  });

  it('sem nenhum motivo claro, dá a frase de reserva', () => {
    // Família do perfume pesa 10% no DNA: nem "divide" (abaixo de 15%) nem "ainda não tem nada"
    const result = computeAffinity(dna, [note('rosa', 'Rosa', 'floral')]);
    expect(result?.level).toBe('low');
    expect(result?.reasons).toEqual(['Tem pouco em comum com o que você mais usa']);
  });
});
