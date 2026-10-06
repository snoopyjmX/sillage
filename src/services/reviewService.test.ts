import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';

// Cada tabela/view tem a sua cadeia simulada; `calls` registra o que o service pediu
const statsMaybeSingle = vi.fn();
const publicLimit = vi.fn();
const ownMaybeSingle = vi.fn();
const updateSingle = vi.fn();
const insertSingle = vi.fn();
const updateEqId = vi.fn();
const insertFn = vi.fn();
const deleteEq = vi.fn();
const getSession = vi.fn();

const from = vi.fn((table: string) => {
  if (table === 'perfume_review_stats') {
    return { select: () => ({ eq: () => ({ maybeSingle: statsMaybeSingle }) }) };
  }
  if (table === 'perfume_reviews_public') {
    return { select: () => ({ eq: () => ({ order: () => ({ limit: publicLimit }) }) }) };
  }
  return {
    select: () => ({ eq: () => ({ maybeSingle: ownMaybeSingle }) }),
    update: (values: unknown) => ({
      eq: (...args: unknown[]) => {
        updateEqId(values, ...args);
        return { select: () => ({ single: updateSingle }) };
      },
    }),
    insert: (values: unknown) => {
      insertFn(values);
      return { select: () => ({ single: insertSingle }) };
    },
    delete: () => ({ eq: deleteEq }),
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => from(table), auth: { getSession: () => getSession() } },
}));

const { reviewService } = await import('./reviewService');

const ownRow = (overrides = {}) => ({
  id: 'r1',
  perfume_id: 'p1',
  longevity_rating: 4,
  projection_rating: 5,
  comment: 'bom',
  updated_at: '2026-10-06T12:00:00Z',
  ...overrides,
});

const input = { longevity: 4, projection: 5, comment: '  bom  ' };

describe('reviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
  });

  it('getPerfumeReviews junta o resumo e as avaliações públicas (sem user_id)', async () => {
    statsMaybeSingle.mockResolvedValue({
      data: { review_count: 2, avg_longevity: 3.5, avg_projection: 4 },
      error: null,
    });
    publicLimit.mockResolvedValue({
      data: [
        {
          id: 'r1',
          longevity_rating: 4,
          projection_rating: 5,
          comment: 'ótimo',
          author_name: 'Ana',
          created_at: '2026-10-06T12:00:00Z',
        },
        {
          id: null,
          longevity_rating: null,
          projection_rating: null,
          comment: null,
          author_name: null,
          created_at: null,
        },
      ],
      error: null,
    });
    const overview = await reviewService.getPerfumeReviews('p1');
    expect(overview.summary).toEqual({ count: 2, avgLongevity: 3.5, avgProjection: 4 });
    expect(overview.reviews).toEqual([
      {
        id: 'r1',
        longevity: 4,
        projection: 5,
        comment: 'ótimo',
        authorName: 'Ana',
        createdAt: '2026-10-06T12:00:00Z',
      },
    ]);
  });

  it('perfume sem avaliações devolve resumo zerado', async () => {
    statsMaybeSingle.mockResolvedValue({ data: null, error: null });
    publicLimit.mockResolvedValue({ data: [], error: null });
    const overview = await reviewService.getPerfumeReviews('p1');
    expect(overview.summary).toEqual({ count: 0, avgLongevity: null, avgProjection: null });
    expect(overview.reviews).toEqual([]);
  });

  it('getUserReview mapeia a linha ou devolve null', async () => {
    ownMaybeSingle.mockResolvedValueOnce({ data: ownRow(), error: null });
    await expect(reviewService.getUserReview('p1')).resolves.toMatchObject({
      id: 'r1',
      longevity: 4,
      projection: 5,
    });
    ownMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(reviewService.getUserReview('p1')).resolves.toBeNull();
  });

  it('upsertReview sem avaliação faz INSERT com o user_id da sessão e comentário aparado', async () => {
    ownMaybeSingle.mockResolvedValue({ data: null, error: null });
    insertSingle.mockResolvedValue({ data: ownRow(), error: null });
    await reviewService.upsertReview('p1', input);
    expect(insertFn).toHaveBeenCalledWith({
      user_id: 'u1',
      perfume_id: 'p1',
      longevity_rating: 4,
      projection_rating: 5,
      comment: 'bom',
    });
    expect(updateEqId).not.toHaveBeenCalled();
  });

  it('upsertReview com avaliação existente faz UPDATE por id (nunca INSERT: RN03 só vale ao criar)', async () => {
    ownMaybeSingle.mockResolvedValue({ data: ownRow(), error: null });
    updateSingle.mockResolvedValue({ data: ownRow({ comment: null }), error: null });
    await reviewService.upsertReview('p1', { ...input, comment: '   ' });
    expect(updateEqId).toHaveBeenCalledWith(
      { longevity_rating: 4, projection_rating: 5, comment: null },
      'id',
      'r1'
    );
    expect(insertFn).not.toHaveBeenCalled();
  });

  it('conflito de unicidade no INSERT vira edição', async () => {
    ownMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: ownRow(), error: null });
    insertSingle.mockResolvedValue({ data: null, error: { code: '23505', message: 'dup' } });
    updateSingle.mockResolvedValue({ data: ownRow(), error: null });
    await reviewService.upsertReview('p1', input);
    expect(updateEqId).toHaveBeenCalled();
  });

  it('RLS recusando o INSERT (RN03) vira review_forbidden, sem texto cru', async () => {
    ownMaybeSingle.mockResolvedValue({ data: null, error: null });
    insertSingle.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'new row violates row-level security policy' },
    });
    const failure = await reviewService.upsertReview('p1', input).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(AppError);
    expect((failure as AppError).code).toBe('review_forbidden');
    expect((failure as AppError).message).not.toMatch(/row-level/);
  });

  it('sem sessão não tenta inserir', async () => {
    ownMaybeSingle.mockResolvedValue({ data: null, error: null });
    getSession.mockResolvedValue({ data: { session: null } });
    const failure = await reviewService.upsertReview('p1', input).catch((e: unknown) => e);
    expect((failure as AppError).code).toBe('session_expired');
    expect(insertFn).not.toHaveBeenCalled();
  });

  it('deleteReview apaga pelo perfume; erro vira review_failed', async () => {
    deleteEq.mockResolvedValueOnce({ error: null });
    await reviewService.deleteReview('p1');
    expect(deleteEq).toHaveBeenCalledWith('perfume_id', 'p1');
    deleteEq.mockResolvedValueOnce({ error: { code: 'XX000', message: 'interno' } });
    const failure = await reviewService.deleteReview('p1').catch((e: unknown) => e);
    expect((failure as AppError).code).toBe('review_failed');
  });
});
