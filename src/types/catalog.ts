// Tipos de domínio do catálogo (o front não usa as linhas cruas do banco).
import type {
  ConcentrationType,
  NotePosition,
  OlfactiveFamily,
  PerfumeGender,
} from '@/constants/labels';

export interface PerfumeSummary {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  brandSlug: string;
  concentration: ConcentrationType;
  gender: PerfumeGender;
  releaseYear: number | null;
  imagePath: string | null;
  // Vem da função search_perfumes (derivada das notas), na ordem do enum
  families: OlfactiveFamily[];
}

export interface PerfumeSearchResult {
  items: PerfumeSummary[];
  // Zero quando a página pedida passa do fim (limitação documentada em docs/DATABASE.md)
  total: number;
}

export interface BrandOption {
  slug: string;
  name: string;
}

export interface NoteOption {
  slug: string;
  name: string;
  family: OlfactiveFamily;
}

export interface PyramidNote {
  slug: string;
  name: string;
  family: OlfactiveFamily;
  position: NotePosition;
}

export interface PerfumeDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  brandName: string;
  brandSlug: string;
  concentration: ConcentrationType;
  gender: PerfumeGender;
  releaseYear: number | null;
  // URL pública da imagem (bucket perfume-images); nula enquanto não houver foto
  imageUrl: string | null;
  // Pirâmide montada no cliente: todas as notas, cada uma com a sua posição
  notes: PyramidNote[];
}

export type { NotePosition };
