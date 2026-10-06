// Acesso a dados das Avaliações (RN03, RN04, RN05, RN08). Só services importam o cliente do Supabase.
// A autorização é a RLS: a tabela perfume_reviews é do dono; a leitura pública vem das views
// perfume_review_stats (agregados) e perfume_reviews_public (sem user_id).
import { AppError, toAppError } from '@/constants/errors';
import { supabase } from '@/lib/supabase';
import type {
  PublicReview,
  ReviewInput,
  ReviewsOverview,
  ReviewSummary,
  UserReview,
} from '@/types/review';

export const PUBLIC_REVIEWS_LIMIT = 20;

const FORBIDDEN = '42501'; // RLS recusou: RN03 (insert) quando o perfume não está em "Tenho" nem no histórico
const UNIQUE_VIOLATION = '23505';

// Erro cru do Supabase nunca chega à interface
const toReviewError = (error: Parameters<typeof toAppError>[0]): AppError => {
  if (error.code === FORBIDDEN) return new AppError('review_forbidden', { cause: error });
  const appError = toAppError(error);
  return appError.code === 'unknown' ? new AppError('review_failed', { cause: error }) : appError;
};

interface OwnRow {
  id: string;
  perfume_id: string;
  longevity_rating: number;
  projection_rating: number;
  comment: string | null;
  updated_at: string;
}

const OWN_COLUMNS = 'id, perfume_id, longevity_rating, projection_rating, comment, updated_at';

const toUserReview = (row: OwnRow): UserReview => ({
  id: row.id,
  perfumeId: row.perfume_id,
  longevity: row.longevity_rating,
  projection: row.projection_rating,
  comment: row.comment,
  updatedAt: row.updated_at,
});

// Leitura do usuário logado; a RLS devolve só as próprias linhas
const requireUserId = async (): Promise<string> => {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new AppError('session_expired');
  return userId;
};

const getSummary = async (perfumeId: string): Promise<ReviewSummary> => {
  const { data, error } = await supabase
    .from('perfume_review_stats')
    .select('review_count, avg_longevity, avg_projection')
    .eq('perfume_id', perfumeId)
    .maybeSingle();
  if (error) throw toReviewError(error);
  return {
    count: data?.review_count ?? 0,
    avgLongevity: data?.avg_longevity ?? null,
    avgProjection: data?.avg_projection ?? null,
  };
};

const getPublicReviews = async (perfumeId: string): Promise<PublicReview[]> => {
  const { data, error } = await supabase
    .from('perfume_reviews_public')
    .select('id, longevity_rating, projection_rating, comment, author_name, created_at')
    .eq('perfume_id', perfumeId)
    .order('created_at', { ascending: false })
    .limit(PUBLIC_REVIEWS_LIMIT);
  if (error) throw toReviewError(error);

  // O gerador de tipos marca toda coluna de view como anulável; no banco estas não são
  return data.flatMap((row) =>
    row.id &&
    row.longevity_rating !== null &&
    row.projection_rating !== null &&
    row.author_name &&
    row.created_at
      ? [
          {
            id: row.id,
            longevity: row.longevity_rating,
            projection: row.projection_rating,
            comment: row.comment,
            authorName: row.author_name,
            createdAt: row.created_at,
          },
        ]
      : []
  );
};

export const reviewService = {
  // Só a média e a contagem públicas (RN08)
  getSummary,

  // Resumo (média e contagem) e as avaliações mais recentes, visíveis a qualquer pessoa
  getPerfumeReviews: async (perfumeId: string): Promise<ReviewsOverview> => {
    const [summary, reviews] = await Promise.all([
      getSummary(perfumeId),
      getPublicReviews(perfumeId),
    ]);
    return { summary, reviews };
  },

  getUserReview: async (perfumeId: string): Promise<UserReview | null> => {
    const { data, error } = await supabase
      .from('perfume_reviews')
      .select(OWN_COLUMNS)
      .eq('perfume_id', perfumeId)
      .maybeSingle();
    if (error) throw toReviewError(error);
    return data ? toUserReview(data) : null;
  },

  // RN04: uma avaliação por usuário e perfume. Não é um upsert cego: o WITH CHECK do INSERT (RN03)
  // roda antes de o conflito ser detectado, o que impediria editar depois de sair de "Tenho".
  // Existe -> UPDATE por id (só notas e comentário); não existe -> INSERT.
  upsertReview: async (perfumeId: string, input: ReviewInput): Promise<UserReview> => {
    const values = {
      longevity_rating: input.longevity,
      projection_rating: input.projection,
      comment: input.comment.trim() === '' ? null : input.comment.trim(),
    };

    const update = async (id: string): Promise<UserReview> => {
      const { data, error } = await supabase
        .from('perfume_reviews')
        .update(values)
        .eq('id', id)
        .select(OWN_COLUMNS)
        .single();
      if (error) throw toReviewError(error);
      return toUserReview(data);
    };

    const existing = await reviewService.getUserReview(perfumeId);
    if (existing) return update(existing.id);

    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('perfume_reviews')
      .insert({ user_id: userId, perfume_id: perfumeId, ...values })
      .select(OWN_COLUMNS)
      .single();
    if (error) {
      // Outra aba criou no meio do caminho: vira edição
      if (error.code === UNIQUE_VIOLATION) {
        const created = await reviewService.getUserReview(perfumeId);
        if (created) return update(created.id);
      }
      throw toReviewError(error);
    }
    return toUserReview(data);
  },

  // A RLS limita o delete às linhas do próprio usuário
  deleteReview: async (perfumeId: string): Promise<void> => {
    const { error } = await supabase.from('perfume_reviews').delete().eq('perfume_id', perfumeId);
    if (error) throw toReviewError(error);
  },
};
