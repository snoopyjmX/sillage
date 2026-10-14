// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  PerfumeSchema,
  buildMigrationSql,
  resolveSlugs,
  slugify,
  sqlString,
  uniquePerfumers,
  validatePerfume,
} from './ingest-perfume.mjs';

const makeData = (overrides = {}) => ({
  name: "L'Eau d'Été",
  brand: 'Maison Exemplo',
  releaseYear: 2020,
  concentration: 'edp',
  gender: 'unisex',
  perfumers: [],
  description: "Fresco, com toque d'água.",
  notes: [
    { name: 'Bergamota', family: 'citrus', position: 'top', description: 'Cítrica e luminosa.' },
    { name: 'Bergamota', family: 'citrus', position: 'heart', description: 'Repetida.' },
    { name: 'Âmbar', family: 'oriental', position: 'base', description: "Quente d'ambar." },
  ],
  ...overrides,
});

describe('slugify', () => {
  it('remove acentos e símbolos', () => {
    expect(slugify("L'Eau d'Été")).toBe('l-eau-d-ete');
  });
});

describe('sqlString', () => {
  it('dobra aspas simples e aceita null', () => {
    expect(sqlString("d'água")).toBe("'d''água'");
    expect(sqlString(null)).toBe('null');
  });
});

describe('validatePerfume', () => {
  it('aceita dados válidos', () => {
    expect(validatePerfume(makeData(), 'x').name).toBe("L'Eau d'Été");
  });

  it('recusa concentração não confirmada', () => {
    expect(() => validatePerfume(makeData({ concentration: null }), 'x')).toThrow(/não confirmada/);
  });

  it('recusa descrição de nota fora de 1 a 240 caracteres', () => {
    const notes = [{ name: 'A', family: 'citrus', position: 'top', description: 'a'.repeat(241) }];
    expect(PerfumeSchema.safeParse(makeData({ notes })).success).toBe(false);
  });
});

describe('resolveSlugs', () => {
  it('detecta duplicata da mesma marca', () => {
    const result = resolveSlugs(makeData(), new Map([['l-eau-d-ete', 'maison-exemplo']]));
    expect(result.duplicate).toBe(true);
  });

  it('prefixa a marca quando o slug é de outra marca', () => {
    const result = resolveSlugs(makeData(), new Map([['l-eau-d-ete', 'outra']]));
    expect(result).toMatchObject({ duplicate: false, perfumeSlug: 'maison-exemplo-l-eau-d-ete' });
  });
});

describe('buildMigrationSql', () => {
  const sql = buildMigrationSql(makeData(), {
    brandSlug: 'maison-exemplo',
    perfumeSlug: 'l-eau-d-ete',
  });

  it('escapa aspas e usa o tipo de cada enum', () => {
    expect(sql).toContain("'L''Eau d''Été'");
    expect(sql).toContain("'edp'::public.concentration_type");
    expect(sql).toContain("'citrus'::public.olfactive_family");
  });

  it('é idempotente em todas as inserções', () => {
    expect(sql.match(/on conflict/g)).toHaveLength(4);
  });

  it('sem perfumistas, não gera insert de perfumers nem de ligação', () => {
    expect(sql).not.toContain('perfumers');
    expect(sql).not.toContain('perfumer');
  });

  it('cria cada nota uma vez, mas liga em todas as posições', () => {
    expect(sql.match(/\('bergamota', 'Bergamota'/g)).toHaveLength(1);
    expect(sql).toContain("('bergamota', 'top')");
    expect(sql).toContain("('bergamota', 'heart')");
    expect(sql).toContain("('ambar', 'base')");
  });
});

describe('uniquePerfumers', () => {
  it('um por slug, na ordem de crédito, ignorando vazios e repetidos', () => {
    expect(
      uniquePerfumers([
        'Dominique Ropion',
        '  ',
        'Alberto Morillas',
        'dominique  ropion',
        'Éurico Mazzini',
      ])
    ).toEqual([
      { name: 'Dominique Ropion', slug: 'dominique-ropion', position: 1 },
      { name: 'Alberto Morillas', slug: 'alberto-morillas', position: 2 },
      { name: 'Éurico Mazzini', slug: 'eurico-mazzini', position: 3 },
    ]);
  });
});

describe('buildMigrationSql com perfumistas', () => {
  const sql = buildMigrationSql(
    makeData({ perfumers: ["Jean-Claude D'Ellena", 'Alberto Morillas'] }),
    { brandSlug: 'maison-exemplo', perfumeSlug: 'l-eau-d-ete' }
  );

  it('cria os perfumistas e liga ao perfume na ordem de crédito, de forma idempotente', () => {
    expect(sql).toContain('insert into public.perfumers (slug, name) values');
    expect(sql).toContain("('jean-claude-d-ellena', 'Jean-Claude D''Ellena')");
    expect(sql).toContain("('jean-claude-d-ellena', 1)");
    expect(sql).toContain("('alberto-morillas', 2)");
    expect(sql).toContain(
      'insert into public.perfume_perfumers (perfume_id, perfumer_id, position)'
    );
    expect(sql.match(/on conflict/g)).toHaveLength(6);
  });

  it('o texto antigo perfumer não é mais gravado em perfumes', () => {
    expect(sql).not.toMatch(/release_year, perfumer/);
  });
});

describe('PerfumeSchema.perfumers', () => {
  it('exige uma lista de textos (nunca texto solto)', () => {
    expect(() => validatePerfume({ ...makeData(), perfumers: 'Alguém' }, 'x')).toThrow();
    expect(validatePerfume(makeData({ perfumers: ['Alguém'] }), 'x').perfumers).toEqual(['Alguém']);
  });
});

describe('buildMigrationSql com foto obrigatória', () => {
  it('insere o perfume com um image_path provisório da marca/perfume', () => {
    const sql = buildMigrationSql(makeData(), { brandSlug: 'granado', perfumeSlug: 'bossa' });
    expect(sql).toContain('description, image_path)');
    expect(sql).toContain("'granado/bossa.webp'");
  });
});
