import { describe, expect, it } from 'vitest';
import { applyReviewToSummary, overallAverage } from './reviews';

const summary = { count: 2, avgLongevity: 3, avgProjection: 4 };

describe('applyReviewToSummary', () => {
  it('nova avaliação entra na média e na contagem', () => {
    expect(applyReviewToSummary(summary, null, { longevity: 5, projection: 5 })).toEqual({
      count: 3,
      avgLongevity: 3.7,
      avgProjection: 4.3,
    });
  });

  it('editar troca a avaliação anterior sem mudar a contagem', () => {
    expect(
      applyReviewToSummary(
        summary,
        { longevity: 2, projection: 3 },
        { longevity: 4, projection: 5 }
      )
    ).toEqual({ count: 2, avgLongevity: 4, avgProjection: 5 });
  });

  it('remover a única avaliação zera tudo', () => {
    expect(
      applyReviewToSummary(
        { count: 1, avgLongevity: 4, avgProjection: 5 },
        { longevity: 4, projection: 5 },
        null
      )
    ).toEqual({ count: 0, avgLongevity: null, avgProjection: null });
  });

  it('primeira avaliação de um perfume sem nenhuma', () => {
    expect(
      applyReviewToSummary({ count: 0, avgLongevity: null, avgProjection: null }, null, {
        longevity: 3,
        projection: 4,
      })
    ).toEqual({ count: 1, avgLongevity: 3, avgProjection: 4 });
  });
});

describe('overallAverage', () => {
  it('média entre fixação e projeção, com 1 casa', () => {
    expect(overallAverage({ count: 2, avgLongevity: 3, avgProjection: 4.4 })).toBe(3.7);
  });
  it('sem avaliações é null', () => {
    expect(overallAverage({ count: 0, avgLongevity: null, avgProjection: null })).toBeNull();
  });
});
