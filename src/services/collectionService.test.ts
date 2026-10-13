import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';

const order = vi.fn();
const select = vi.fn((columns: string) => ({ order, columns }));
const upsert = vi.fn();
const eq = vi.fn();
const deleteFn = vi.fn(() => ({ eq }));
const updateSelect = vi.fn();
const updateEqStatus = vi.fn(() => ({ select: updateSelect }));
const updateEqPerfume = vi.fn(() => ({ eq: updateEqStatus }));
const update = vi.fn(() => ({ eq: updateEqPerfume }));
const getSession = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ select, upsert, update, delete: deleteFn }),
    auth: { getSession: () => getSession() },
  },
}));

const { collectionService } = await import('./collectionService');

const row = {
  status: 'wanted',
  format: null,
  volume_ml: null,
  updated_at: '2026-10-05T12:00:00Z',
  perfume: {
    id: 'p1',
    slug: 'malbec-signature',
    name: 'Malbec Signature',
    concentration: 'edp',
    gender: 'unisex',
    release_year: 2022,
    image_path: null,
    brand: { name: 'O Boticário', slug: 'o-boticario' },
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
      perfume: { id: 'p1', brandName: 'O Boticário', releaseYear: 2022 },
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

  it('RN11 setStatus: "Quero" envia formato e volume nulos (a troca owned -> wanted limpa os campos)', async () => {
    upsert.mockResolvedValue({ error: null });
    await collectionService.setStatus('p1', 'wanted');
    expect(upsert).toHaveBeenCalledWith(
      { user_id: 'u1', perfume_id: 'p1', status: 'wanted', format: null, volume_ml: null },
      { onConflict: 'user_id, perfume_id' }
    );
  });

  it('RN11 setStatus: "Tenho" envia só o estado e não apaga o que já foi detalhado', async () => {
    upsert.mockResolvedValue({ error: null });
    await collectionService.setStatus('p1', 'owned');
    const [payload] = upsert.mock.calls[0] ?? [];
    expect(payload).not.toHaveProperty('format');
    expect(payload).not.toHaveProperty('volume_ml');
  });

  it('list: pede formato e volume e monta o domínio', async () => {
    order.mockResolvedValue({
      data: [{ ...row, status: 'owned', format: 'decant', volume_ml: 10 }],
      error: null,
    });
    const [item] = await collectionService.list();
    expect(select.mock.calls[0]?.[0]).toContain('format, volume_ml');
    expect(item).toMatchObject({ status: 'owned', format: 'decant', volumeMl: 10 });
  });

  it('setDetails: atualiza formato e volume só da linha em "Tenho" do perfume', async () => {
    updateSelect.mockResolvedValue({ data: [{ id: 'row1' }], error: null });
    await collectionService.setDetails('p1', { format: 'bottle', volumeMl: 100 });
    expect(update).toHaveBeenCalledWith({ format: 'bottle', volume_ml: 100 });
    expect(updateEqPerfume).toHaveBeenCalledWith('perfume_id', 'p1');
    expect(updateEqStatus).toHaveBeenCalledWith('status', 'owned');
  });

  it('setDetails: nenhuma linha afetada é falha, nunca finge que salvou', async () => {
    updateSelect.mockResolvedValue({ data: [], error: null });
    await expect(
      collectionService.setDetails('p1', { format: 'sample', volumeMl: 2 })
    ).rejects.toMatchObject({ code: 'collection_failed' });
  });

  it('setDetails: erro do banco vira a mensagem amigável', async () => {
    updateSelect.mockResolvedValue({
      data: null,
      error: { code: '23514', message: 'check violation' },
    });
    const error = await collectionService
      .setDetails('p1', { format: 'sample', volumeMl: 2 })
      .catch((e: unknown) => e);
    expect(error).toMatchObject({ code: 'collection_failed' });
    expect((error as Error).message).not.toMatch(/check/);
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
