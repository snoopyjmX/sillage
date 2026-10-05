import { describe, expect, it } from 'vitest';
import { formatCount, formatDecimal, formatInteger } from './format';

describe('formatDecimal', () => {
  it('usa vírgula como separador decimal', () => {
    expect(formatDecimal(4.2)).toBe('4,2');
    expect(formatDecimal(3)).toBe('3,0');
    expect(formatDecimal(3.756, 2)).toBe('3,76');
  });
});

describe('formatInteger e formatCount', () => {
  it('usa ponto como separador de milhar', () => {
    expect(formatInteger(1234)).toBe('1.234');
  });

  it('pluraliza em pt-BR (só 1 é singular)', () => {
    expect(formatCount(1, 'perfume', 'perfumes')).toBe('1 perfume');
    expect(formatCount(0, 'perfume', 'perfumes')).toBe('0 perfumes');
    expect(formatCount(24, 'perfume', 'perfumes')).toBe('24 perfumes');
  });
});
