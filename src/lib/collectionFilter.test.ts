import { describe, expect, it } from 'vitest';
import type { PerfumeSummary } from '@/types/catalog';
import { filterCollection, foldText } from './collectionFilter';

const item = (name: string, brandName: string) => ({
  perfume: { name, brandName } as PerfumeSummary,
});

const items = [
  item('Lírio Essencial', 'O Boticário'),
  item('Malbec', 'O Boticário'),
  item('Sauvage', 'Dior'),
];

describe('foldText', () => {
  it('tira acento e caixa', () => {
    expect(foldText('LÍRIO Cítrico')).toBe('lirio citrico');
  });
});

describe('filterCollection', () => {
  it('texto vazio ou só espaços devolve tudo', () => {
    expect(filterCollection(items, '')).toHaveLength(3);
    expect(filterCollection(items, '   ')).toHaveLength(3);
  });

  it('casa pelo nome, sem acento e sem caixa', () => {
    expect(filterCollection(items, 'lirio').map((i) => i.perfume.name)).toEqual([
      'Lírio Essencial',
    ]);
  });

  it('casa pela marca', () => {
    expect(filterCollection(items, 'boticario')).toHaveLength(2);
  });

  it('exige todas as palavras, em nome e marca juntos', () => {
    expect(filterCollection(items, 'malbec boticário')).toHaveLength(1);
    expect(filterCollection(items, 'malbec dior')).toHaveLength(0);
  });
});
