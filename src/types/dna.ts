// DNA olfativo do usuário (resultado de public.get_olfactory_dna()).
import type { OlfactiveFamily } from '@/constants/labels';

export interface DnaFamilyWeight {
  family: OlfactiveFamily;
  weight: number;
}

export interface DnaNote {
  slug: string;
  name: string;
  family: OlfactiveFamily;
  weight: number;
}

export interface OlfactoryDna {
  // Do mais pesado ao mais leve
  families: DnaFamilyWeight[];
  topNotes: DnaNote[];
  // Família mais frequente em "Quero"; nula sem itens nessa lista
  wishFamily: OlfactiveFamily | null;
  wantedCount: number;
  // Perfumes distintos em "Tenho" ou no memorial
  perfumeCount: number;
  memorialDays: number;
}
