// Tipos de domínio da Coleção (RN02): um perfume tem um único estado por usuário.
import type { CollectionFormat } from '@/constants/collection';
import type { Database } from '@/types/database.types';
import type { PerfumeSummary } from '@/types/catalog';

export type CollectionStatus = Database['public']['Enums']['collection_status'];
export type { CollectionFormat };

// Formato e volume (RN11): só existem com status "owned"; os dois nulos = "não informado"
export interface CollectionDetails {
  format: CollectionFormat | null;
  volumeMl: number | null;
}

export interface CollectionItem extends CollectionDetails {
  status: CollectionStatus;
  updatedAt: string;
  perfume: PerfumeSummary;
}
