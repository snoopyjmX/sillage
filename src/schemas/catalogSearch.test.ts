import { describe, expect, it } from 'vitest';
import {
  defaultSort,
  MAX_LIST_ITEMS,
  maxYear,
  parseCatalogSearchParams,
  toCatalogSearchParams,
} from './catalogSearch';

const parse = (query: string) => parseCatalogSearchParams(new URLSearchParams(query));

describe('parseCatalogSearchParams', () => {
  it('usa os padrões quando a URL está vazia', () => {
    expect(parse('')).toEqual({
      q: '',
      brands: [],
      notes: [],
      pos: null,
      families: [],
      concentrations: [],
      genders: [],
      yearMin: null,
      yearMax: null,
      sort: 'newest',
      page: 1,
    });
  });

  it('lê todos os parâmetros válidos', () => {
    const filters = parse(
      'q=granado&brands=o-boticario,granado&notes=lima,bergamota&pos=top&families=citrus,woody' +
        '&conc=edp,edt&gender=unisex&ymin=2010&ymax=2024&sort=name_desc&page=3'
    );
    expect(filters).toEqual({
      q: 'granado',
      brands: ['o-boticario', 'granado'],
      notes: ['lima', 'bergamota'],
      pos: 'top',
      families: ['citrus', 'woody'],
      concentrations: ['edp', 'edt'],
      genders: ['unisex'],
      yearMin: 2010,
      yearMax: 2024,
      sort: 'name_desc',
      page: 3,
    });
  });

  it('sort desconhecido cai no padrão (newest sem texto, relevance com texto)', () => {
    expect(parse('sort=preco').sort).toBe('newest');
    expect(parse('sort=preco&q=boticario').sort).toBe('relevance');
    expect(parse('sort=DROP TABLE perfumes').sort).toBe('newest');
  });

  it('relevance sem texto cai no padrão, mas com texto vale', () => {
    expect(parse('sort=relevance').sort).toBe('newest');
    expect(parse('sort=relevance&q=boticario').sort).toBe('relevance');
  });

  it.each(['-1', '0', 'abc', '1.5', '', '1e3', '99999999', ' 2'])(
    'page inválida "%s" vira 1',
    (page) => {
      expect(parse(`page=${encodeURIComponent(page)}`).page).toBe(1);
    }
  );

  it('page válida é mantida', () => {
    expect(parse('page=50').page).toBe(50);
  });

  it('descarta slugs estranhos e mantém os válidos', () => {
    const notes = encodeURIComponent("bergamota,../etc,lima;drop,UPPER,x'y,%00,a b,");
    const filters = parse(`notes=${notes}&brands=ok-slug,--,-a,a-`);
    expect(filters.notes).toEqual(['bergamota']);
    expect(filters.brands).toEqual(['ok-slug']);
  });

  it('remove repetidos e limita o tamanho das listas', () => {
    expect(parse('notes=lima,lima,lima').notes).toEqual(['lima']);
    const many = Array.from({ length: 50 }, (_, i) => `n${i}`).join(',');
    expect(parse(`notes=${many}`).notes).toHaveLength(MAX_LIST_ITEMS);
  });

  it('descarta enums inválidos', () => {
    const filters = parse('families=citrus,bogus&conc=xyz&gender=other&pos=middle&notes=lima');
    expect(filters.families).toEqual(['citrus']);
    expect(filters.concentrations).toEqual([]);
    expect(filters.genders).toEqual([]);
    expect(filters.pos).toBeNull();
  });

  it('ignora a posição quando não há notas', () => {
    expect(parse('pos=top').pos).toBeNull();
    expect(parse('notes=lima&pos=top').pos).toBe('top');
  });

  it('anos inválidos ou fora da faixa viram nulos', () => {
    expect(parse('ymin=abc&ymax=-5').yearMin).toBeNull();
    expect(parse('ymin=abc&ymax=-5').yearMax).toBeNull();
    expect(parse('ymin=1500').yearMin).toBeNull();
    expect(parse(`ymax=${maxYear() + 1}`).yearMax).toBeNull();
    expect(parse(`ymax=${maxYear()}`).yearMax).toBe(maxYear());
    expect(parse('ymin=20xx').yearMin).toBeNull();
  });

  it('normaliza e limita o texto', () => {
    expect(parse('q=%20%20ca%20%20fe%20').q).toBe('ca fe');
    expect(parse(`q=${'a'.repeat(500)}`).q).toHaveLength(100);
  });
});

describe('toCatalogSearchParams', () => {
  it('não grava padrões na URL', () => {
    expect(toCatalogSearchParams(parse('')).toString()).toBe('');
    expect(toCatalogSearchParams(parse('q=boticario')).toString()).toBe('q=boticario');
  });

  it('faz o caminho de ida e volta sem perder estado', () => {
    const query =
      'q=granado&brands=o-boticario&notes=lima,bergamota&pos=top&families=citrus&conc=edp&gender=unisex' +
      '&ymin=2010&ymax=2024&sort=name_asc&page=2';
    const filters = parse(query);
    expect(parse(toCatalogSearchParams(filters).toString())).toEqual(filters);
  });

  it('grava o sort só quando difere do padrão', () => {
    expect(toCatalogSearchParams(parse('sort=newest')).has('sort')).toBe(false);
    expect(toCatalogSearchParams(parse('sort=name_asc')).get('sort')).toBe('name_asc');
    expect(defaultSort('x')).toBe('relevance');
  });
});
