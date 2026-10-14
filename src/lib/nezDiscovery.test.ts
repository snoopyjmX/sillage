import { describe, expect, it } from 'vitest';
import { COLD_BELOW, FAMILY_TEMP_RANGES as APP_RANGES, HOT_FROM } from '@/constants/climate';
import { FAMILIES as APP_FAMILIES } from '@/constants/labels';
import { NEZ_CLIMATES, NEZ_MAX_FAMILIES, NEZ_OCCASIONS } from '@/constants/nez';
import { highlightFamilies, temperatureBand } from '@/lib/climate';
// A função do Nez roda no Deno e não importa de src/; a lógica pura fica num arquivo sem
// dependências para ser testada aqui.
import {
  CLIMATES,
  COLD_BELOW as FN_COLD_BELOW,
  FAMILIES,
  FAMILY_TEMP_RANGES,
  HOT_FROM as FN_HOT_FROM,
  MAX_PICKED_FAMILIES,
  MAX_PICKS,
  OCCASIONS,
  buildDiscoveryPrompt,
  buildResponseSchema,
  climateFamilies,
  parseCandidates,
  parseDiscoveryRequest,
  preferredFamilies,
  topDnaFamilies,
  validateAnswer,
  type Candidate,
} from '../../supabase/functions/nez-ai/discovery.ts';

const candidate = (slug: string, overrides: Partial<Candidate> = {}): Candidate => ({
  slug,
  name: slug.toUpperCase(),
  brandName: 'Marca',
  concentration: 'edp',
  families: ['woody'],
  notes: [{ name: 'Cedro', position: 'base' }],
  ...overrides,
});

describe('cópia das constantes na função (anti-divergência)', () => {
  it('famílias, faixas de temperatura e limites do clima são os do app', () => {
    expect([...FAMILIES]).toEqual([...APP_FAMILIES]);
    expect(FAMILY_TEMP_RANGES).toEqual(APP_RANGES);
    expect(FN_COLD_BELOW).toBe(COLD_BELOW);
    expect(FN_HOT_FROM).toBe(HOT_FROM);
  });

  it('as opções do questionário são as mesmas nos dois lados', () => {
    expect([...CLIMATES]).toEqual([...NEZ_CLIMATES]);
    expect([...OCCASIONS]).toEqual([...NEZ_OCCASIONS]);
    expect(MAX_PICKED_FAMILIES).toBe(NEZ_MAX_FAMILIES);
  });

  it('o clima ameno e o frio de hoje batem com a faixa do app', () => {
    for (const celsius of [-5, 0, 14.9, 15, 20, 24.9, 25, 30, 40]) {
      expect(CLIMATES).toContain(temperatureBand(celsius));
    }
    // Cada família em destaque do app para uma temperatura também combina com a faixa dela
    for (const celsius of [10, 20, 30]) {
      const band = temperatureBand(celsius);
      const fitting = climateFamilies(band);
      for (const family of highlightFamilies(celsius)) expect(fitting).toContain(family);
    }
  });
});

describe('climateFamilies', () => {
  it('frio: famílias cujas faixas começam abaixo de 15 °C', () => {
    expect(climateFamilies('cold')).toEqual(
      ['woody', 'oriental', 'spicy', 'musky'].sort(byEnumOrder)
    );
  });

  it('quente: famílias cujas faixas chegam a 25 °C ou mais', () => {
    const hot = climateFamilies('hot');
    expect(hot).toEqual(expect.arrayContaining(['citrus', 'aquatic', 'fruity', 'green']));
    expect(hot).not.toContain('woody');
    expect(hot).not.toContain('oriental');
    expect(hot).not.toContain('spicy');
  });

  it('ameno: cobre todas as famílias (nenhuma é descartada pelo clima)', () => {
    expect(climateFamilies('mild')).toEqual([...FAMILIES]);
  });
});

function byEnumOrder(a: string, b: string): number {
  return (FAMILIES as readonly string[]).indexOf(a) - (FAMILIES as readonly string[]).indexOf(b);
}

describe('parseDiscoveryRequest', () => {
  const valid = {
    mode: 'discovery',
    climate: 'cold',
    occasion: 'night',
    families: ['woody'],
    useDna: false,
  };

  it('aceita um pedido válido e devolve só os campos conhecidos', () => {
    expect(parseDiscoveryRequest({ ...valid, extra: 'ignorado' })).toEqual({
      climate: 'cold',
      occasion: 'night',
      families: ['woody'],
      useDna: false,
    });
  });

  it('aceita DNA sem famílias escolhidas', () => {
    expect(parseDiscoveryRequest({ ...valid, families: [], useDna: true })).toMatchObject({
      families: [],
      useDna: true,
    });
  });

  it.each([
    ['clima fora do enum', { climate: 'snow' }],
    ['ocasião fora do enum', { occasion: 'party' }],
    ['clima numérico', { climate: 5 }],
    ['useDna que não é booleano', { useDna: 'true' }],
    ['famílias que não é lista', { families: 'woody' }],
    ['família desconhecida', { families: ['pizza'] }],
    ['mais de 2 famílias', { families: ['woody', 'citrus', 'floral'] }],
    ['família repetida', { families: ['woody', 'woody'] }],
    ['sem família e sem DNA', { families: [], useDna: false }],
    ['famílias ausentes', { families: undefined }],
  ])('recusa %s', (_label, override) => {
    expect(parseDiscoveryRequest({ ...valid, ...override })).toBeNull();
  });
});

describe('topDnaFamilies', () => {
  it('pega as 2 famílias mais pesadas, mesmo que cheguem fora de ordem', () => {
    const dna = {
      families: [
        { family: 'citrus', weight: 2 },
        { family: 'woody', weight: 9 },
        { family: 'floral', weight: 5 },
      ],
    };
    expect(topDnaFamilies(dna)).toEqual(['woody', 'floral']);
  });

  it.each([null, undefined, {}, { families: 'x' }, { families: [] }])(
    'ignora DNA sem formato: %j',
    (dna) => {
      expect(topDnaFamilies(dna)).toEqual([]);
    }
  );

  it('descarta famílias desconhecidas e pesos que não são número', () => {
    expect(
      topDnaFamilies({
        families: [
          { family: 'pizza', weight: 10 },
          { family: 'woody', weight: '5' },
          { family: 'floral', weight: 1 },
        ],
      })
    ).toEqual(['floral']);
  });
});

describe('preferredFamilies', () => {
  it('une as escolhidas e as do DNA, sem repetir', () => {
    const request = {
      climate: 'cold',
      occasion: 'work',
      families: ['woody'],
      useDna: true,
    } as const;
    expect(preferredFamilies({ ...request, families: ['woody'] }, ['woody', 'floral'])).toEqual([
      'woody',
      'floral',
    ]);
  });
});

describe('parseCandidates', () => {
  it('lê as linhas da RPC e ignora as malformadas', () => {
    const rows = [
      {
        slug: 'a',
        name: 'A',
        brand_name: 'Marca',
        concentration: 'edp',
        families: ['woody', 'pizza'],
        notes: [{ name: 'Cedro', position: 'base' }, { name: 1 }],
      },
      { slug: 'sem-nome' },
      null,
    ];
    expect(parseCandidates(rows)).toEqual([
      {
        slug: 'a',
        name: 'A',
        brandName: 'Marca',
        concentration: 'edp',
        families: ['woody'],
        notes: [{ name: 'Cedro', position: 'base' }],
      },
    ]);
  });

  it('não-lista vira lista vazia', () => {
    expect(parseCandidates(null)).toEqual([]);
    expect(parseCandidates({})).toEqual([]);
  });
});

describe('buildDiscoveryPrompt', () => {
  it('lista o questionário e os candidatos com slug, nome e notas por camada', () => {
    const prompt = buildDiscoveryPrompt(
      { climate: 'cold', occasion: 'night', families: ['woody'], useDna: true },
      ['floral'],
      [
        candidate('bossa', {
          name: 'Bossa',
          notes: [
            { name: 'Limão', position: 'top' },
            { name: 'Cedro', position: 'base' },
          ],
        }),
      ]
    );
    expect(prompt).toContain('Clima: frio');
    expect(prompt).toContain('Ocasião: noite e encontro');
    expect(prompt).toContain('Famílias de predileção: amadeirada');
    expect(prompt).toContain('DNA olfativo): floral');
    expect(prompt).toContain('- slug: bossa');
    expect(prompt).toContain('nome: Bossa (Marca, edp)');
    expect(prompt).toContain('topo: Limão; fundo: Cedro');
  });

  it('sem famílias escolhidas nem DNA, omite essas linhas', () => {
    const prompt = buildDiscoveryPrompt(
      { climate: 'hot', occasion: 'work', families: [], useDna: false },
      [],
      [candidate('a')]
    );
    expect(prompt).not.toContain('predileção');
    expect(prompt).not.toContain('DNA');
  });
});

describe('buildResponseSchema', () => {
  it('picks só aceita os slugs dos candidatos, de 1 a 3', () => {
    const schema = buildResponseSchema(['a', 'b']);
    expect(schema.properties.picks.items.enum).toEqual(['a', 'b']);
    expect(schema.properties.picks.minItems).toBe(1);
    expect(schema.properties.picks.maxItems).toBe(MAX_PICKS);
    expect(schema.required).toEqual(['text', 'picks']);
  });
});

describe('validateAnswer (a conferência do servidor)', () => {
  const candidates = [candidate('a'), candidate('b'), candidate('c'), candidate('d')];
  const answer = (value: unknown) => JSON.stringify(value);

  it('aceita texto e slugs que estão entre os candidatos, na ordem dada', () => {
    expect(
      validateAnswer(answer({ text: '  Escolhi o B e o A.  ', picks: ['b', 'a'] }), candidates)
    ).toEqual({
      text: 'Escolhi o B e o A.',
      picks: ['b', 'a'],
    });
  });

  it('recusa um slug que não é candidato (perfume inventado)', () => {
    expect(
      validateAnswer(answer({ text: 'Oi', picks: ['a', 'inventado'] }), candidates)
    ).toBeNull();
  });

  it.each([
    ['sem picks', { text: 'Oi', picks: [] }],
    ['mais de 3 picks', { text: 'Oi', picks: ['a', 'b', 'c', 'd'] }],
    ['pick repetido', { text: 'Oi', picks: ['a', 'a'] }],
    ['pick que não é texto', { text: 'Oi', picks: [1] }],
    ['picks que não é lista', { text: 'Oi', picks: 'a' }],
    ['texto vazio', { text: '   ', picks: ['a'] }],
    ['texto ausente', { picks: ['a'] }],
    ['texto longo demais', { text: 'x'.repeat(1201), picks: ['a'] }],
  ])('recusa %s', (_label, body) => {
    expect(validateAnswer(answer(body), candidates)).toBeNull();
  });

  it.each(['', 'não é json', 'null', '[]', '"texto"'])(
    'recusa resposta que não é o objeto esperado: %j',
    (raw) => {
      expect(validateAnswer(raw, candidates)).toBeNull();
    }
  );
});
