import {
  FAMILIES,
  POSITIONS,
  type NotePosition,
  type ConcentrationType,
  type OlfactiveFamily,
  type PerfumeGender,
} from '@/constants/labels';
import type { PerfumeDetail, PerfumeSummary, PyramidNote } from '@/types/catalog';

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
  imageUrl: detail.imageUrl ?? null,
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

// A URL pública vem do service (só ele importa o Supabase)
export const fromPerfumeRow = (row: PerfumeRow, imageUrl?: string | null): PerfumeSummary => {
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
    imageUrl: imageUrl ?? null,
    // Na ordem do enum, como a função de busca devolve
    families: FAMILIES.filter((family) => present.has(family)),
  };
};

export type NotesByPosition = { position: NotePosition; notes: PyramidNote[] }[];

// Notas agrupadas por posição (topo, coração, fundo); posição sem notas some
export const groupNotesByPosition = (notes: readonly PyramidNote[]): NotesByPosition =>
  POSITIONS.map((position) => ({
    position,
    notes: notes.filter((note) => note.position === position),
  })).filter((group) => group.notes.length > 0);
