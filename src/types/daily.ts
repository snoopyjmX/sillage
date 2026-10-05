// Tipos de domínio do Perfume do Dia (RN06): um por usuário e por data, no fuso do perfil.
import type { PerfumeSummary } from '@/types/catalog';

export interface DailyEntry {
  // Data civil AAAA-MM-DD (coluna `date`, sem fuso)
  date: string;
  perfume: PerfumeSummary;
}

export interface DailyOverview {
  today: DailyEntry | null;
  // Dias anteriores, do mais recente para o mais antigo
  history: DailyEntry[];
}
