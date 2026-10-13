import { describe, expect, it } from 'vitest';
import { buildComparePath, isComparable, parseCompareParams } from './compareSearch';

const parse = (query: string) => parseCompareParams(new URLSearchParams(query));

describe('parseCompareParams', () => {
  it('lê os dois slugs', () => {
    expect(parse('a=malbec-signature&b=bossa')).toEqual({ a: 'malbec-signature', b: 'bossa' });
  });

  it('ausente vira nulo', () => {
    expect(parse('')).toEqual({ a: null, b: null });
    expect(parse('a=bossa')).toEqual({ a: 'bossa', b: null });
  });

  it.each([
    ['../etc/passwd'],
    ['Malbec Signature'],
    ['bossa; drop table perfumes'],
    ['<script>'],
    ['-bossa'],
    ['bossa--x'],
    ['a'.repeat(81)],
    [''],
  ])('slug inválido %j vira nulo', (bad) => {
    expect(parse(`a=${encodeURIComponent(bad)}&b=bossa`)).toEqual({ a: null, b: 'bossa' });
  });
});

describe('buildComparePath', () => {
  it('monta o caminho com os lados escolhidos', () => {
    expect(buildComparePath({ a: 'malbec-signature', b: 'bossa' })).toBe(
      '/compare?a=malbec-signature&b=bossa'
    );
    expect(buildComparePath({ a: null, b: 'bossa' })).toBe('/compare?b=bossa');
    expect(buildComparePath({ a: null, b: null })).toBe('/compare');
  });

  it('o que sai volta igual ao que entrou', () => {
    const selection = { a: 'malbec-signature', b: 'bossa' };
    expect(parse(buildComparePath(selection).split('?')[1] ?? '')).toEqual(selection);
  });
});

describe('isComparable', () => {
  it('só com dois lados diferentes', () => {
    expect(isComparable({ a: 'x', b: 'y' })).toBe(true);
    expect(isComparable({ a: 'x', b: 'x' })).toBe(false);
    expect(isComparable({ a: 'x', b: null })).toBe(false);
    expect(isComparable({ a: null, b: null })).toBe(false);
  });
});
