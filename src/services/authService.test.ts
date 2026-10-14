import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';

const auth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resend: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
};
vi.mock('@/lib/supabase', () => ({ supabase: { auth } }));

const { authService } = await import('./authService');

describe('authService', () => {
  beforeEach(() => {
    Object.values(auth).forEach((fn) => fn.mockReset());
  });

  it('signIn envia e-mail e senha', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    await authService.signIn('a@b.co', 'segredo123');
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.co',
      password: 'segredo123',
    });
  });

  it('signIn com credencial inválida lança AppError em português, sem o texto cru', async () => {
    auth.signInWithPassword.mockResolvedValue({
      error: { code: 'invalid_credentials', message: 'Invalid login credentials', status: 400 },
    });
    const error = await authService.signIn('a@b.co', 'x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('invalid_credentials');
    expect((error as AppError).message).not.toMatch(/Invalid login/);
  });

  it('signUp passa display_name e timezone em options.data (trigger handle_new_user)', async () => {
    auth.signUp.mockResolvedValue({ data: { session: { access_token: 't' } }, error: null });
    const result = await authService.signUp('a@b.co', 'segredo123', 'Ana', 'America/Sao_Paulo');
    expect(result).toEqual({ needsEmailConfirmation: false });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.co',
      password: 'segredo123',
      options: {
        data: { display_name: 'Ana', timezone: 'America/Sao_Paulo' },
        emailRedirectTo: `${window.location.origin}/auth/confirmed`,
      },
    });
  });

  it('signUp sem sessão sinaliza que falta confirmar o e-mail', async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    await expect(authService.signUp('a@b.co', 'segredo123', 'Ana', 'UTC')).resolves.toEqual({
      needsEmailConfirmation: true,
    });
  });

  it('resendConfirmation reenvia o link de cadastro com o mesmo redirecionamento', async () => {
    auth.resend.mockResolvedValue({ error: null });
    await authService.resendConfirmation('a@b.co');
    expect(auth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'a@b.co',
      options: { emailRedirectTo: `${window.location.origin}/auth/confirmed` },
    });
  });

  it('resendConfirmation com limite de envios vira rate_limited, sem o texto cru', async () => {
    auth.resend.mockResolvedValue({
      error: {
        code: 'over_email_send_rate_limit',
        message: 'email rate limit exceeded',
        status: 429,
      },
    });
    const error = await authService.resendConfirmation('a@b.co').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('rate_limited');
  });

  it('signUp com e-mail repetido vira email_taken', async () => {
    auth.signUp.mockResolvedValue({ error: { code: 'user_already_exists', status: 422 } });
    await expect(authService.signUp('a@b.co', 'segredo123', 'Ana', 'UTC')).rejects.toMatchObject({
      code: 'email_taken',
    });
  });

  it('sendPasswordReset aponta o link para /reset-password desta origem', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    await authService.sendPasswordReset('a@b.co');
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.co', {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  });

  it('updatePassword e signOut repassam erros mapeados', async () => {
    auth.updateUser.mockResolvedValue({ error: { code: 'same_password' } });
    await expect(authService.updatePassword('x')).rejects.toMatchObject({ code: 'same_password' });
    auth.signOut.mockResolvedValue({ error: { status: 0, message: 'Failed to fetch' } });
    await expect(authService.signOut()).rejects.toMatchObject({ code: 'network' });
  });

  it('onAuthStateChange devolve a função que cancela a assinatura', () => {
    const unsubscribe = vi.fn();
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
    authService.onAuthStateChange(vi.fn())();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  describe('deleteAccount', () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
      fetchMock.mockReset();
      vi.stubGlobal('fetch', fetchMock);
      auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
      auth.signOut.mockResolvedValue({ error: null });
    });

    it('204: chama a função com o token e encerra a sessão local', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
      await authService.deleteAccount();
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toMatch(/\/functions\/v1\/delete-account$/);
      expect(init.method).toBe('POST');
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
      expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    });

    it('401 vira session_expired e não encerra a sessão', async () => {
      fetchMock.mockResolvedValue(new Response('{"code":"unauthorized"}', { status: 401 }));
      await expect(authService.deleteAccount()).rejects.toMatchObject({ code: 'session_expired' });
      expect(auth.signOut).not.toHaveBeenCalled();
    });

    it('500 vira account_delete_failed sem expor o corpo', async () => {
      fetchMock.mockResolvedValue(new Response('erro interno do servidor', { status: 500 }));
      const error = await authService.deleteAccount().catch((e: unknown) => e);
      expect(error).toMatchObject({ code: 'account_delete_failed' });
      expect((error as AppError).message).not.toMatch(/interno/);
      expect(auth.signOut).not.toHaveBeenCalled();
    });

    it('sem sessão vira session_expired; sem rede vira network', async () => {
      auth.getSession.mockResolvedValueOnce({ data: { session: null } });
      await expect(authService.deleteAccount()).rejects.toMatchObject({ code: 'session_expired' });
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
      await expect(authService.deleteAccount()).rejects.toMatchObject({ code: 'network' });
    });
  });
});
