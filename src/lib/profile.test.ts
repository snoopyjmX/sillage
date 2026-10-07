import { describe, expect, it } from 'vitest';
import type { CollectionItem } from '@/types/collection';
import { countByStatus, getInitials } from './profile';

describe('getInitials', () => {
  it('nome completo: primeira e última palavra', () => {
    expect(getInitials('Ana Beatriz da Silva')).toBe('AS');
    expect(getInitials('joão marcelo garcês')).toBe('JG');
  });

  it('uma palavra: uma inicial', () => {
    expect(getInitials('Ana')).toBe('A');
  });

  it('nome vazio ou só espaços: vazio', () => {
    expect(getInitials('')).toBe('');
    expect(getInitials('   \n\t ')).toBe('');
  });

  it('acentos são mantidos, inclusive decompostos (NFD)', () => {
    expect(getInitials('Álvaro Éder')).toBe('ÁÉ');
    expect(getInitials('élodie'.normalize('NFD'))).toBe('É');
  });

  it('emoji e símbolos são ignorados', () => {
    expect(getInitials('😀')).toBe('');
    expect(getInitials('😀 Ana')).toBe('A');
    expect(getInitials('Ana 😀 Silva')).toBe('AS');
    expect(getInitials('🌸Flor')).toBe('F');
    expect(getInitials('!!! ???')).toBe('');
  });

  it('espaços extras não geram iniciais vazias', () => {
    expect(getInitials('  Ana    Silva  ')).toBe('AS');
  });
});

const item = (status: 'owned' | 'wanted') => ({ status }) as CollectionItem;

describe('countByStatus', () => {
  it('conta cada estado', () => {
    expect(countByStatus([item('owned'), item('wanted'), item('owned')])).toEqual({
      owned: 2,
      wanted: 1,
    });
  });

  it('lista vazia: zeros reais', () => {
    expect(countByStatus([])).toEqual({ owned: 0, wanted: 0 });
  });
});
