import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';

const auth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
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
      options: { data: { display_name: 'Ana', timezone: 'America/Sao_Paulo' } },
    });
  });

  it('signUp sem sessão sinaliza que falta confirmar o e-mail', async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    await expect(authService.signUp('a@b.co', 'segredo123', 'Ana', 'UTC')).resolves.toEqual({
      needsEmailConfirmation: true,
    });
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
});
