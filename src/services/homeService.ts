// Dados da Home: sugestão do dia e descobertas. Só catálogo público (RLS de leitura aberta, RN07).
import { SUGGESTION_CANDIDATE_LIMIT } from '@/constants/climate';
import type { OlfactiveFamily, PerfumeGender } from '@/constants/labels';
import { pickDaily } from '@/lib/climate';
import { parseCatalogSearchParams } from '@/schemas/catalogSearch';
import { perfumeService } from '@/services/perfumeService';
import { reviewService } from '@/services/reviewService';
import type { PerfumeDetail } from '@/types/catalog';
import type { ReviewSummary } from '@/types/review';

export interface DailySuggestion {
  perfume: PerfumeDetail;
  summary: ReviewSummary;
}

const DEFAULT_FILTERS = parseCatalogSearchParams(new URLSearchParams());

export const homeService = {
  // Candidatos pelas famílias (vazio = catálogo todo) e pelo gênero (nulo = todos), por nome;
  // o índice vem da data (RN10)
  getDailySuggestion: async (
    date: string,
    families: OlfactiveFamily[],
    gender?: PerfumeGender | null
  ): Promise<DailySuggestion | null> => {
    const { items } = await perfumeService.search(
      { ...DEFAULT_FILTERS, families, genders: gender ? [gender] : [], sort: 'name_asc' },
      SUGGESTION_CANDIDATE_LIMIT
    );
    const pick = pickDaily(items, date);
    if (!pick) return null;
    const [perfume, summary] = await Promise.all([
      perfumeService.getBySlug(pick.slug),
      reviewService.getSummary(pick.id),
    ]);
    return { perfume, summary };
  },

  // Novidades: os lançamentos mais recentes do catálogo
  getRecent: async (limit: number) =>
    (await perfumeService.search({ ...DEFAULT_FILTERS, sort: 'newest' }, limit)).items,
};
