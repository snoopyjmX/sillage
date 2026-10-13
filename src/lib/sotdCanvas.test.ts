import { describe, expect, it } from 'vitest';
import {
  CARD_CONTENT_WIDTH,
  CARD_NAME_MAX_LINES,
  computeLayout,
  wrapText,
  type MeasureText,
} from './sotdCanvas';
import type { SotdCardContent } from './sotdCard';

// 10 unidades por caractere: determinístico e sem DOM
const measure: MeasureText = (text) => text.length * 10;

const content = (overrides: Partial<SotdCardContent> = {}): SotdCardContent => ({
  brand: 'O Boticário',
  name: 'Malbec',
  concentration: 'EDP',
  notes: ['Limão', 'Jasmim', 'Cedro'],
  notesByLayer: true,
  family: 'woody',
  imageUrl: null,
  dateLabel: 'terça-feira, 13 de outubro de 2026',
  weather: { icon: 'sun', temperature: '19 °C', city: 'Curitiba' },
  ...overrides,
});

describe('wrapText', () => {
  it('mantém numa linha o que cabe', () => {
    expect(wrapText('Malbec Signature', 500, 3, (v) => measure(v, ''))).toEqual([
      'Malbec Signature',
    ]);
  });

  it('quebra entre palavras', () => {
    expect(wrapText('um dois tres quatro', 100, 3, (v) => measure(v, ''))).toEqual([
      'um dois',
      'tres',
      'quatro',
    ]);
  });

  it('corta por caracteres a palavra maior que a linha', () => {
    const lines = wrapText('Supercalifragilistico', 100, 3, (v) => measure(v, ''));
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(measure(line, '')).toBeLessThanOrEqual(100);
    expect(lines.join('')).toBe('Supercalifragilistico');
  });

  it('termina com reticências quando passa do limite de linhas', () => {
    const lines = wrapText('a b c d e f g h i j k l', 30, 2, (v) => measure(v, ''));
    expect(lines).toHaveLength(2);
    expect(lines[1]?.endsWith('…')).toBe(true);
    expect(measure(lines[1] ?? '', '')).toBeLessThanOrEqual(30);
  });

  it('texto vazio não gera linhas', () => {
    expect(wrapText('   ', 100, 3, (v) => measure(v, ''))).toEqual([]);
  });
});

describe('computeLayout', () => {
  it('nome longo respeita o limite de linhas e não invade o selo de clima', () => {
    const layout = computeLayout(
      content({
        name: 'Nome extremamente longo de um perfume de nicho com muitas palavras seguidas',
      }),
      () => CARD_CONTENT_WIDTH / 2
    );
    expect(layout.name.length).toBeLessThanOrEqual(CARD_NAME_MAX_LINES);
    expect(layout.contentBottom).toBeLessThan(layout.badgeTop);
  });

  it('com as três camadas mostra o rótulo "Topo · Coração · Fundo"', () => {
    const layout = computeLayout(content(), measure);
    expect(layout.notesLabel?.text).toBe('Topo · Coração · Fundo');
    expect(layout.notes?.text).toBe('Limão · Jasmim · Cedro');
  });

  it('sem camada completa, mostra as notas sem rótulo', () => {
    const layout = computeLayout(content({ notesByLayer: false }), measure);
    expect(layout.notesLabel).toBeNull();
    expect(layout.notes?.text).toBe('Limão · Jasmim · Cedro');
  });

  it('sem notas, não reserva espaço para elas', () => {
    const layout = computeLayout(content({ notes: [], notesByLayer: false }), measure);
    expect(layout.notes).toBeNull();
    expect(layout.notesLabel).toBeNull();
  });

  it('sem clima, não há selo', () => {
    expect(computeLayout(content({ weather: null }), measure).badge).toBeNull();
  });

  it('com cidade o selo traz "Cidade · temperatura"; sem cidade, só a temperatura', () => {
    expect(computeLayout(content(), measure).badge?.text).toBe('Curitiba · 19 °C');
    const noCity = content({ weather: { icon: 'sun', temperature: '19 °C', city: null } });
    expect(computeLayout(noCity, measure).badge?.text).toBe('19 °C');
  });

  it('a marca vai em caixa alta e o wordmark fecha o card', () => {
    const layout = computeLayout(content(), measure);
    expect(layout.brand.text).toBe('O BOTICÁRIO');
    expect(layout.wordmark.text).toBe('Sillage');
    expect(layout.wordmark.y).toBeGreaterThan(layout.date.y);
  });
});
