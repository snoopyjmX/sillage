// Tipos de domínio da retrospectiva anual (Fase 23). Vêm de get_annual_recap, já no formato do app.
import type { OlfactiveFamily } from '@/constants/labels';

export type Season = 'summer' | 'autumn' | 'winter' | 'spring';

export interface RecapPerfume {
  slug: string;
  name: string;
  brandName: string;
  imageUrl: string | null;
  // Dias vestidos no período (ano ou estação)
  days: number;
}

export interface FamilyWeight {
  family: OlfactiveFamily;
  weight: number;
}

export interface AnnualRecap {
  year: number;
  daysWorn: number;
  daysElapsed: number;
  // 0 a 1: dias vestidos / dias decorridos
  consistency: number;
  signature: RecapPerfume | null;
  seasons: Record<Season, RecapPerfume | null>;
  topNote: { slug: string; name: string; family: OlfactiveFamily; weight: number } | null;
  // Pesos das famílias em cada semestre, do maior ao menor
  families: { firstSemester: FamilyWeight[]; secondSemester: FamilyWeight[] };
}
