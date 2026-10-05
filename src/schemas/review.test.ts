import { describe, expect, it } from 'vitest';
import { MAX_COMMENT_LENGTH, reviewSchema } from './review';

const valid = { longevity: 4, projection: 3, comment: '  Muito bom  ' };

describe('reviewSchema', () => {
  it('aceita notas de 1 a 5 e apara o comentário', () => {
    expect(reviewSchema.parse(valid)).toEqual({
      longevity: 4,
      projection: 3,
      comment: 'Muito bom',
    });
  });

  it('comentário é opcional (vazio passa)', () => {
    expect(reviewSchema.safeParse({ ...valid, comment: '' }).success).toBe(true);
  });

  it.each([0, 6, 2.5, -1])('rejeita nota %s (RN05)', (value) => {
    expect(reviewSchema.safeParse({ ...valid, longevity: value }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...valid, projection: value }).success).toBe(false);
  });

  it('exige as duas notas, com mensagem em português', () => {
    const result = reviewSchema.safeParse({ ...valid, longevity: undefined });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Escolha a nota de fixação de 1 a 5 estrelas.');
  });

  it('limita o comentário a 1000 caracteres', () => {
    expect(
      reviewSchema.safeParse({ ...valid, comment: 'a'.repeat(MAX_COMMENT_LENGTH) }).success
    ).toBe(true);
    expect(
      reviewSchema.safeParse({ ...valid, comment: 'a'.repeat(MAX_COMMENT_LENGTH + 1) }).success
    ).toBe(false);
  });
});
