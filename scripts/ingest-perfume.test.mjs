// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  PerfumeSchema,
  buildMigrationSql,
  resolveSlugs,
  slugify,
  sqlString,
  validatePerfume,
} from './ingest-perfume.mjs';

const makeData = (overrides = {}) => ({
  name: "L'Eau d'Été",
  brand: 'Maison Exemplo',
  releaseYear: 2020,
  concentration: 'edp',
  gender: 'unisex',
  perfumer: null,
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

  it('cria cada nota uma vez, mas liga em todas as posições', () => {
    expect(sql.match(/\('bergamota', 'Bergamota'/g)).toHaveLength(1);
    expect(sql).toContain("('bergamota', 'top')");
    expect(sql).toContain("('bergamota', 'heart')");
    expect(sql).toContain("('ambar', 'base')");
  });
});
