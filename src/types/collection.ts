// Tipos de domínio da Coleção (RN02): um perfume tem um único estado por usuário.
import type { Database } from '@/types/database.types';
import type { PerfumeSummary } from '@/types/catalog';

export type CollectionStatus = Database['public']['Enums']['collection_status'];

export interface CollectionItem {
  status: CollectionStatus;
  updatedAt: string;
  perfume: PerfumeSummary;
}
