import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';

const maybeSingle = vi.fn();
const selectAfterUpdate = vi.fn();
const eq = vi.fn(() => ({ select: selectAfterUpdate }));
const update = vi.fn(() => ({ eq }));
const select = vi.fn(() => ({ maybeSingle }));
const from = vi.fn((table: string) => ({ select, update, table }));
const getSession = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => from(table),
    auth: { getSession: () => getSession() },
  },
}));

const { profileService } = await import('./profileService');

const values = { displayName: 'Ana', timezone: 'America/Sao_Paulo' };

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
  });

  it('get lê nome e fuso do próprio perfil', async () => {
    maybeSingle.mockResolvedValue({
      data: { display_name: 'Ana', timezone: 'America/Sao_Paulo' },
      error: null,
    });
    await expect(profileService.get()).resolves.toEqual(values);
    expect(from).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith('display_name, timezone');
  });

  it('get sem linha devolve null', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(profileService.get()).resolves.toBeNull();
  });

  it('get com erro vira mensagem amigável, nunca a crua', async () => {
    maybeSingle.mockResolvedValue({
      data: null,
      error: { code: 'XX000', message: 'boom interno' },
    });
    const failure = await profileService.get().catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(AppError);
    expect((failure as AppError).code).toBe('profile_load_failed');
    expect((failure as AppError).message).not.toContain('boom');
  });

  it('update grava só nome e fuso, filtrando pelo id da sessão', async () => {
    selectAfterUpdate.mockResolvedValue({ data: [{ id: 'u1' }], error: null });
    await profileService.update(values);
    expect(update).toHaveBeenCalledWith({ display_name: 'Ana', timezone: 'America/Sao_Paulo' });
    expect(eq).toHaveBeenCalledWith('id', 'u1');
  });

  it('NEGADO: update que afeta 0 linhas (RLS) falha em vez de fingir sucesso', async () => {
    selectAfterUpdate.mockResolvedValue({ data: [], error: null });
    await expect(profileService.update(values)).rejects.toMatchObject({ code: 'profile_failed' });
  });

  it('update sem sessão não chega ao banco', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    await expect(profileService.update(values)).rejects.toMatchObject({ code: 'session_expired' });
    expect(update).not.toHaveBeenCalled();
  });

  it('update com erro de rede mantém o código de rede', async () => {
    selectAfterUpdate.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });
    await expect(profileService.update(values)).rejects.toMatchObject({ code: 'network' });
  });
});
