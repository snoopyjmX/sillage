import { describe, expect, it } from 'vitest';
import {
  formatCount,
  formatDecimal,
  formatInteger,
  formatMonthYear,
  formatPriceCents,
} from './format';

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

describe('formatPriceCents', () => {
  it('converte centavos em reais pt-BR', () => {
    // O Intl separa o símbolo do valor com um espaço não separável
    expect(formatPriceCents(24900).replace(/\s/g, ' ')).toBe('R$ 249,00');
    expect(formatPriceCents(8905).replace(/\s/g, ' ')).toBe('R$ 89,05');
    expect(formatPriceCents(123456).replace(/\s/g, ' ')).toBe('R$ 1.234,56');
  });
});

describe('formatMonthYear', () => {
  it('mostra mês e ano por extenso, sem depender do fuso do navegador', () => {
    expect(formatMonthYear('2026-10-06')).toBe('outubro de 2026');
    expect(formatMonthYear('2026-01-01')).toBe('janeiro de 2026');
  });
});
