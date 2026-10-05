import {
  FAMILIES,
  type ConcentrationType,
  type OlfactiveFamily,
  type PerfumeGender,
} from '@/constants/labels';
import type { PerfumeDetail, PerfumeSummary } from '@/types/catalog';

// A página de detalhes tem o perfume completo; a coleção guarda o resumo (o mesmo do card).
// Famílias derivadas das notas, na ordem do enum, como a função de busca devolve.
export const toPerfumeSummary = (detail: PerfumeDetail): PerfumeSummary => ({
  id: detail.id,
  slug: detail.slug,
  name: detail.name,
  brandName: detail.brandName,
  brandSlug: detail.brandSlug,
  concentration: detail.concentration,
  gender: detail.gender,
  releaseYear: detail.releaseYear,
  imagePath: null,
  families: FAMILIES.filter((family) => detail.notes.some((note) => note.family === family)),
});

// Linha de `perfumes` com marca e famílias das notas (select das consultas de coleção e do dia)
export interface PerfumeRow {
  id: string;
  slug: string;
  name: string;
  concentration: ConcentrationType;
  gender: PerfumeGender;
  release_year: number | null;
  image_path: string | null;
  brand: { name: string; slug: string };
  perfume_notes: { note: { family: OlfactiveFamily } }[];
}

// Select compartilhado: uma consulta só (perfume + marca + famílias das notas), sem N+1.
export const PERFUME_ROW_SELECT =
  'perfume:perfumes(*, brand:brands(*), perfume_notes(note:notes(family)))';

export const fromPerfumeRow = (row: PerfumeRow): PerfumeSummary => {
  const present = new Set(row.perfume_notes.map(({ note }) => note.family));
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brandName: row.brand.name,
    brandSlug: row.brand.slug,
    concentration: row.concentration,
    gender: row.gender,
    releaseYear: row.release_year,
    imagePath: row.image_path,
    // Na ordem do enum, como a função de busca devolve
    families: FAMILIES.filter((family) => present.has(family)),
  };
};
