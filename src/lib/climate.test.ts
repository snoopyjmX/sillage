import { describe, expect, it } from 'vitest';
import { FAMILIES } from '@/constants/labels';
import {
  bandPhrase,
  climateFit,
  dateHash,
  highlightFamilies,
  perfumeTempRange,
  pickDaily,
  projectionLabel,
  temperatureBand,
} from './climate';

describe('temperatureBand e bandPhrase', () => {
  it.each([
    [-3, 'cold'],
    [14.9, 'cold'],
    [15, 'mild'],
    [24.9, 'mild'],
    [25, 'hot'],
    [38, 'hot'],
  ])('%s °C é %s', (celsius, band) => {
    expect(temperatureBand(celsius)).toBe(band);
  });

  it('usa as frases da curadoria', () => {
    expect(bandPhrase(10)).toBe('Projeção ideal para dias frios');
    expect(bandPhrase(20)).toBe('Projeção ideal para dias amenos');
    expect(bandPhrase(30)).toBe('Projeção ideal para dias quentes');
  });
});

describe('highlightFamilies', () => {
  it('devolve até 3 famílias que contêm a temperatura, das mais centradas às menos', () => {
    // 28 °C: citrus (22–35), aquatic (22–35), fruity (20–32), green (18–30), aromatic/floral (15–28)
    expect(highlightFamilies(28)).toEqual(['citrus', 'aquatic', 'fruity']);
  });

  it('desempata pela ordem do enum', () => {
    const result = highlightFamilies(28.5);
    expect(result.indexOf('citrus')).toBeLessThan(result.indexOf('aquatic'));
  });

  it('no frio escolhe as famílias de faixa baixa', () => {
    // 10 °C: oriental (0–18), spicy (5–20), woody (5–22) e musky (10–25); musky fica de fora (3 no máx.)
    expect(highlightFamilies(10)).toEqual(['oriental', 'spicy', 'woody']);
  });

  it('só entram as famílias cuja faixa contém a temperatura', () => {
    expect(highlightFamilies(3)).toEqual(['oriental']);
  });

  it('sem nenhuma na faixa, devolve as 2 mais próximas', () => {
    expect(highlightFamilies(-20)).toEqual(['oriental', 'spicy']);
    expect(highlightFamilies(45)).toHaveLength(2);
    expect(highlightFamilies(45)).toEqual(['citrus', 'aquatic']);
  });

  it('só devolve famílias do enum, sem repetir', () => {
    for (let celsius = -10; celsius <= 45; celsius += 1) {
      const result = highlightFamilies(celsius);
      expect(new Set(result).size).toBe(result.length);
      result.forEach((family) => expect(FAMILIES).toContain(family));
    }
  });
});

describe('perfumeTempRange', () => {
  it('sem notas não há faixa', () => {
    expect(perfumeTempRange([])).toBeNull();
  });

  it('uma família: a própria faixa', () => {
    expect(perfumeTempRange(['woody'])).toEqual({ min: 5, max: 22 });
  });

  it('pondera pelo número de notas de cada família', () => {
    // citrus 22–35 x3 e oriental 0–18 x1: min (66+0)/4 = 16,5 -> 17; max (105+18)/4 = 30,75 -> 31
    expect(perfumeTempRange(['citrus', 'citrus', 'citrus', 'oriental'])).toEqual({
      min: 17,
      max: 31,
    });
  });
});

describe('climateFit', () => {
  const range = { min: 15, max: 28 };

  it('dentro da faixa vale 100', () => {
    expect(climateFit(range, 15)).toBe(100);
    expect(climateFit(range, 20)).toBe(100);
    expect(climateFit(range, 28)).toBe(100);
  });

  it('perde 10 pontos por °C fora da faixa', () => {
    expect(climateFit(range, 30)).toBe(80);
    expect(climateFit(range, 12)).toBe(70);
  });

  it('nunca passa de 0', () => {
    expect(climateFit(range, 60)).toBe(0);
    expect(climateFit(range, -30)).toBe(0);
  });
});

describe('projectionLabel', () => {
  it.each([
    [null, 'Sem avaliações'],
    [1, 'Íntimo'],
    [2.49, 'Íntimo'],
    [2.5, 'Moderado'],
    [3.49, 'Moderado'],
    [3.5, 'Forte'],
    [5, 'Forte'],
  ])('média %s é %s', (average, label) => {
    expect(projectionLabel(average)).toBe(label);
  });
});

describe('escolha estável do dia', () => {
  it('o hash da data é determinístico e muda entre dias', () => {
    expect(dateHash('2026-10-06')).toBe(dateHash('2026-10-06'));
    expect(dateHash('2026-10-06')).not.toBe(dateHash('2026-10-07'));
  });

  it('o mesmo dia escolhe sempre o mesmo candidato', () => {
    const candidates = Array.from({ length: 100 }, (_, index) => `p${index}`);
    expect(pickDaily(candidates, '2026-10-06')).toBe(pickDaily(candidates, '2026-10-06'));
  });

  it('o índice cai dentro da lista e varia ao longo dos dias', () => {
    const candidates = Array.from({ length: 7 }, (_, index) => index);
    const picks = new Set<number | null>();
    for (let day = 1; day <= 28; day += 1) {
      const pick = pickDaily(candidates, `2026-10-${String(day).padStart(2, '0')}`);
      expect(pick).not.toBeNull();
      picks.add(pick);
    }
    expect(picks.size).toBeGreaterThan(1);
  });

  it('lista vazia não escolhe nada', () => {
    expect(pickDaily([], '2026-10-06')).toBeNull();
  });
});
