import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';

const order = vi.fn();
const select = vi.fn((columns: string) => ({ order, columns }));
const upsert = vi.fn();
const eq = vi.fn();
const deleteFn = vi.fn(() => ({ eq }));
const getSession = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ select, upsert, delete: deleteFn }),
    auth: { getSession: () => getSession() },
  },
}));

const { collectionService } = await import('./collectionService');

const row = {
  status: 'wanted',
  updated_at: '2026-10-05T12:00:00Z',
  perfume: {
    id: 'p1',
    slug: 'amyi-2-15',
    name: 'Amyi 2.15',
    concentration: 'edp',
    gender: 'unisex',
    release_year: 2022,
    image_path: null,
    brand: { name: 'Amyi', slug: 'amyi' },
    perfume_notes: [
      { note: { family: 'woody' } },
      { note: { family: 'citrus' } },
      { note: { family: 'citrus' } },
    ],
  },
};

describe('collectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
  });

  it('list: uma consulta com perfume e marca, mais recentes primeiro', async () => {
    order.mockResolvedValue({ data: [row], error: null });
    await collectionService.list();
    expect(select).toHaveBeenCalledTimes(1);
    expect(select.mock.calls[0]?.[0]).toContain('perfume:perfumes(*, brand:brands(*)');
    expect(order).toHaveBeenCalledWith('updated_at', { ascending: false });
  });

  it('list: monta o domínio com famílias únicas na ordem do enum', async () => {
    order.mockResolvedValue({ data: [row], error: null });
    const [item] = await collectionService.list();
    expect(item).toMatchObject({
      status: 'wanted',
      updatedAt: '2026-10-05T12:00:00Z',
      perfume: { id: 'p1', brandName: 'Amyi', releaseYear: 2022 },
    });
    expect(item?.perfume.families).toEqual(['citrus', 'woody']);
  });

  it('list: erro do banco vira AppError sem texto cru', async () => {
    order.mockResolvedValue({ data: null, error: { code: '42501', message: 'rls violation' } });
    const error = await collectionService.list().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('collection_failed');
    expect((error as AppError).message).not.toMatch(/rls/);
  });

  it('setStatus: upsert com onConflict (user_id, perfume_id) para trocar o estado na mesma linha', async () => {
    upsert.mockResolvedValue({ error: null });
    await collectionService.setStatus('p1', 'owned');
    expect(upsert).toHaveBeenCalledWith(
      { user_id: 'u1', perfume_id: 'p1', status: 'owned' },
      { onConflict: 'user_id, perfume_id' }
    );
  });

  it('setStatus: sem sessão não chama o banco', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    await expect(collectionService.setStatus('p1', 'owned')).rejects.toMatchObject({
      code: 'session_expired',
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('setStatus: falha de rede vira o código network', async () => {
    upsert.mockResolvedValue({ error: { message: 'Failed to fetch' } });
    await expect(collectionService.setStatus('p1', 'wanted')).rejects.toMatchObject({
      code: 'network',
    });
  });

  it('remove: apaga pelo perfume_id', async () => {
    eq.mockResolvedValue({ error: null });
    await collectionService.remove('p1');
    expect(eq).toHaveBeenCalledWith('perfume_id', 'p1');
  });

  it('remove: erro vira collection_failed', async () => {
    eq.mockResolvedValue({ error: { code: 'XX000', message: 'boom' } });
    await expect(collectionService.remove('p1')).rejects.toMatchObject({
      code: 'collection_failed',
    });
  });
});
