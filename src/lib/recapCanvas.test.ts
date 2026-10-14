import { describe, expect, it } from 'vitest';
import { SHARE_CARD_HEIGHT } from '@/constants/share';
import type { AnnualRecap } from '@/types/recap';
import type { MeasureText } from './canvas';
import { buildRecapCardContent, type RecapCardContent } from './recapCard';
import { RECAP_CONTENT_WIDTH, RECAP_NAME_MAX_LINES, computeRecapLayout } from './recapCanvas';

// 10 unidades por caractere: determinístico e sem DOM
const measure: MeasureText = (text) => text.length * 10;

const perfume = (name: string, days: number) => ({
  slug: name.toLowerCase(),
  name,
  brandName: 'Granado',
  imageUrl: null,
  days,
});

const recap: AnnualRecap = {
  year: 2026,
  daysWorn: 248,
  daysElapsed: 365,
  consistency: 0.6795,
  signature: perfume('Bossa', 80),
  seasons: {
    summer: perfume('Bossa', 40),
    autumn: perfume('Boemia', 20),
    winter: null,
    spring: perfume('Gigi', 10),
  },
  topNote: { slug: 'cedro', name: 'Cedro', family: 'woody', weight: 90 },
  families: { firstSemester: [], secondSemester: [] },
};

const content = (overrides: Partial<RecapCardContent> = {}): RecapCardContent => ({
  ...buildRecapCardContent(recap),
  ...overrides,
});

describe('buildRecapCardContent', () => {
  it('formata dias, consistência, assinatura, estações e nota', () => {
    expect(buildRecapCardContent(recap)).toEqual({
      year: 2026,
      daysLabel: '248 dias com perfume',
      consistencyLabel: '68% do ano',
      signature: { brand: 'Granado', name: 'Bossa', daysLabel: '80 dias', imageUrl: null },
      seasons: [
        { label: 'Verão', perfume: 'Bossa' },
        { label: 'Outono', perfume: 'Boemia' },
        { label: 'Inverno', perfume: null },
        { label: 'Primavera', perfume: 'Gigi' },
      ],
      topNote: 'Cedro',
      family: 'woody',
    });
  });

  it('um dia só fica no singular', () => {
    expect(buildRecapCardContent({ ...recap, daysWorn: 1 }).daysLabel).toBe('1 dia com perfume');
  });

  it('sem assinatura nem nota, esses campos saem nulos', () => {
    const empty = buildRecapCardContent({ ...recap, signature: null, topNote: null });
    expect(empty.signature).toBeNull();
    expect(empty.topNote).toBeNull();
    expect(empty.family).toBeNull();
  });
});

describe('computeRecapLayout', () => {
  it('as linhas descem na ordem e o card inteiro cabe nos 1920 de altura', () => {
    const layout = computeRecapLayout(content(), measure);
    const ys = [
      layout.eyebrow.y,
      layout.year.y,
      layout.days.y,
      layout.consistency.y,
      layout.stage?.y ?? 0,
      layout.brand?.y ?? 0,
      ...layout.name.map((line) => line.y),
      layout.signatureDays?.y ?? 0,
      ...layout.seasons.map((season) => season.label.y),
      layout.note?.y ?? 0,
      layout.wordmark.y,
    ];
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
    expect(layout.wordmark.y).toBeLessThan(SHARE_CARD_HEIGHT);
  });

  it('nome longo respeita o limite de linhas e não invade as estações nem a nota', () => {
    const long = content({
      signature: {
        brand: 'Marca',
        name: 'Um nome de perfume extremamente longo '.repeat(6).trim(),
        daysLabel: '80 dias',
        imageUrl: null,
      },
    });
    const layout = computeRecapLayout(long, measure);
    expect(layout.name.length).toBeLessThanOrEqual(RECAP_NAME_MAX_LINES);
    expect(layout.name.at(-1)?.text.endsWith('…')).toBe(true);
    const lastSeason = layout.seasons.at(-1)?.label.y ?? 0;
    expect(layout.name.at(-1)?.y ?? 0).toBeLessThan(layout.seasons[0]?.label.y ?? 0);
    expect(lastSeason).toBeLessThan(layout.note?.y ?? Infinity);
    // A nota ainda deixa espaço para o wordmark (56 px de corpo) no pior caso, com 2 linhas de nome
    expect((layout.note?.y ?? Infinity) + 56).toBeLessThan(layout.wordmark.y);
  });

  it('as quatro estações saem sempre, e a sem registros diz isso', () => {
    const layout = computeRecapLayout(content(), measure);
    expect(layout.seasons.map((s) => s.label.text)).toEqual([
      'Verão',
      'Outono',
      'Inverno',
      'Primavera',
    ]);
    expect(layout.seasons[2]?.perfume.text).toBe('Sem registros');
    // O perfume começa depois do maior rótulo, alinhado nas quatro linhas
    const xs = new Set(layout.seasons.map((s) => s.perfume.x));
    expect(xs.size).toBe(1);
  });

  it('nenhum texto passa da largura útil', () => {
    const layout = computeRecapLayout(content(), measure);
    for (const line of [layout.days, layout.consistency, ...layout.name]) {
      expect(measure(line.text, '')).toBeLessThanOrEqual(RECAP_CONTENT_WIDTH);
    }
  });

  it('a marca vai em caixa alta e o wordmark fecha o card', () => {
    const layout = computeRecapLayout(content(), measure);
    expect(layout.brand?.text).toBe('GRANADO');
    expect(layout.wordmark.text).toBe('Sillage');
  });

  it('sem assinatura, não há palco nem nome', () => {
    const layout = computeRecapLayout(content({ signature: null }), measure);
    expect(layout.stage).toBeNull();
    expect(layout.brand).toBeNull();
    expect(layout.name).toEqual([]);
    expect(layout.signatureDays).toBeNull();
  });

  it('sem nota do ano, não reserva a linha', () => {
    expect(computeRecapLayout(content({ topNote: null }), measure).note).toBeNull();
  });
});
