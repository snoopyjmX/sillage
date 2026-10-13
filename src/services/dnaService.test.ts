import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';

const rpc = vi.fn();
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: (...args: unknown[]) => rpc(...args) } }));

const { dnaService } = await import('./dnaService');

const data = {
  families: [{ family: 'woody', weight: 5 }],
  top_notes: [],
  wish_family: 'citrus',
  wanted_count: 3,
  perfume_count: 4,
  memorial_days: 2,
};

describe('dnaService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama get_olfactory_dna e devolve o DNA no formato do app', async () => {
    rpc.mockResolvedValue({ data, error: null });
    await expect(dnaService.get()).resolves.toMatchObject({
      wishFamily: 'citrus',
      perfumeCount: 4,
      families: [{ family: 'woody', weight: 5 }],
    });
    expect(rpc).toHaveBeenCalledWith('get_olfactory_dna');
  });

  it('erro do banco vira a mensagem amigável, nunca o texto cru', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'boom interno' } });
    const error = await dnaService.get().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('dna_failed');
    expect((error as AppError).message).not.toContain('boom');
  });

  it('resposta fora do formato é falha, não dado quebrado na tela', async () => {
    rpc.mockResolvedValue({ data: { families: 'x' }, error: null });
    await expect(dnaService.get()).rejects.toMatchObject({ code: 'dna_failed' });
  });
});
