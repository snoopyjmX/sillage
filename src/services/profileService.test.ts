import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';

const maybeSingle = vi.fn();
const selectAfterUpdate = vi.fn();
const eq = vi.fn(() => ({ select: selectAfterUpdate }));
const update = vi.fn(() => ({ eq }));
const select = vi.fn(() => ({ maybeSingle }));
const from = vi.fn((table: string) => ({ select, update, table }));
const getSession = vi.fn();
const upload = vi.fn();
const remove = vi.fn();
const getPublicUrl = vi.fn();
const storageFrom = vi.fn((bucket: string) => ({ bucket, upload, remove, getPublicUrl }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => from(table),
    auth: { getSession: () => getSession() },
    storage: { from: (bucket: string) => storageFrom(bucket) },
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
      data: { display_name: 'Ana', timezone: 'America/Sao_Paulo', avatar_url: null },
      error: null,
    });
    await expect(profileService.get()).resolves.toEqual({ ...values, avatarUrl: null });
    expect(from).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith('display_name, timezone, avatar_url');
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

  describe('avatar', () => {
    const blob = new Blob(['x'], { type: 'image/webp' });

    beforeEach(() => {
      upload.mockResolvedValue({ error: null });
      remove.mockResolvedValue({ error: null });
      getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn/avatars/u1/avatar.webp' } });
      selectAfterUpdate.mockResolvedValue({ data: [{ id: 'u1' }], error: null });
    });

    it('uploadAvatar envia para <id>/avatar.webp, quebra o cache e grava a URL', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(123);
      const url = await profileService.uploadAvatar(blob);
      expect(storageFrom).toHaveBeenCalledWith('avatars');
      expect(upload).toHaveBeenCalledWith('u1/avatar.webp', blob, {
        contentType: 'image/webp',
        upsert: true,
      });
      expect(url).toBe('https://cdn/avatars/u1/avatar.webp?t=123');
      expect(update).toHaveBeenCalledWith({ avatar_url: url });
      expect(eq).toHaveBeenCalledWith('id', 'u1');
      vi.restoreAllMocks();
    });

    it('uploadAvatar sem sessão não chega ao storage', async () => {
      getSession.mockResolvedValue({ data: { session: null } });
      await expect(profileService.uploadAvatar(blob)).rejects.toMatchObject({
        code: 'session_expired',
      });
      expect(upload).not.toHaveBeenCalled();
    });

    it('falha do storage vira avatar_failed sem expor a mensagem crua', async () => {
      upload.mockResolvedValue({ error: { message: 'bucket policy violada' } });
      const failure = await profileService.uploadAvatar(blob).catch((error: unknown) => error);
      expect((failure as AppError).code).toBe('avatar_failed');
      expect((failure as AppError).message).not.toContain('policy');
      expect(update).not.toHaveBeenCalled();
    });

    it('NEGADO: update de perfil com 0 linhas falha em vez de fingir sucesso', async () => {
      selectAfterUpdate.mockResolvedValue({ data: [], error: null });
      await expect(profileService.uploadAvatar(blob)).rejects.toMatchObject({
        code: 'avatar_failed',
      });
    });

    it('removeAvatar apaga o arquivo e zera avatar_url', async () => {
      await profileService.removeAvatar();
      expect(remove).toHaveBeenCalledWith(['u1/avatar.webp']);
      expect(update).toHaveBeenCalledWith({ avatar_url: null });
    });

    it('removeAvatar com erro no storage não mexe no perfil', async () => {
      remove.mockResolvedValue({ error: { message: 'boom' } });
      await expect(profileService.removeAvatar()).rejects.toMatchObject({
        code: 'avatar_failed',
      });
      expect(update).not.toHaveBeenCalled();
    });
  });
});
