// Tipos de domínio das Avaliações (RN04, RN05, RN08). Notas são inteiros de 1 a 5.
export interface ReviewInput {
  longevity: number;
  projection: number;
  // Vazio vira null no banco
  comment: string;
}

// A avaliação do usuário logado (tabela perfume_reviews, RLS de dono)
export interface UserReview {
  id: string;
  perfumeId: string;
  longevity: number;
  projection: number;
  comment: string | null;
  updatedAt: string;
}

// Avaliação de qualquer pessoa (view perfume_reviews_public): só o nome de exibição identifica o autor
export interface PublicReview {
  id: string;
  longevity: number;
  projection: number;
  comment: string | null;
  authorName: string;
  createdAt: string;
}

export interface ReviewSummary {
  count: number;
  // Nulos quando não há avaliação
  avgLongevity: number | null;
  avgProjection: number | null;
}

export interface ReviewsOverview {
  summary: ReviewSummary;
  reviews: PublicReview[];
}
