import { FAMILIES, POSITIONS, type NotePosition, type OlfactiveFamily } from '@/constants/labels';
import type { PyramidNote } from '@/types/catalog';

export interface FamilyShare {
  family: OlfactiveFamily;
  count: number;
  // Fração de 0 a 1 do total de notas
  share: number;
}

// Camadas na ordem Topo, Coração, Fundo; camadas sem nota ficam de fora (a pirâmide pode estar incompleta)
export const groupByLayer = (
  notes: PyramidNote[]
): { position: NotePosition; notes: PyramidNote[] }[] =>
  POSITIONS.map((position) => ({
    position,
    notes: notes.filter((note) => note.position === position),
  })).filter((layer) => layer.notes.length > 0);

// Quanto cada família pesa nas notas: do maior para o menor, empate pela ordem de FAMILIES
export const familyBreakdown = (notes: PyramidNote[]): FamilyShare[] =>
  FAMILIES.map((family) => ({
    family,
    count: notes.filter((note) => note.family === family).length,
  }))
    .filter(({ count }) => count > 0)
    .map(({ family, count }) => ({ family, count, share: count / notes.length }))
    .sort((a, b) => b.count - a.count);

export const dominantFamilies = (notes: PyramidNote[], max = 2): OlfactiveFamily[] =>
  familyBreakdown(notes)
    .slice(0, max)
    .map(({ family }) => family);

export const noteCatalogHref = (note: PyramidNote): string =>
  `/catalog?${new URLSearchParams({ notes: note.slug, pos: note.position }).toString()}`;
