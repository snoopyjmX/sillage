import { describe, expect, it } from 'vitest';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from './auth';

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('schemas de autenticação', () => {
  it('login exige e-mail válido e senha preenchida', () => {
    expect(loginSchema.safeParse({ email: ' a@b.co ', password: 'x' }).success).toBe(true);
    expect(messages(loginSchema.safeParse({ email: 'abc', password: '' }))).toEqual([
      'Informe um e-mail válido, como nome@exemplo.com.',
      'Informe sua senha.',
    ]);
  });

  it('cadastro exige nome, e-mail e senha com 8+ caracteres, letra e número', () => {
    const ok = { displayName: ' Ana ', email: 'ana@exemplo.com', password: 'abcdefg1' };
    expect(registerSchema.parse(ok).displayName).toBe('Ana');
    expect(registerSchema.safeParse({ ...ok, displayName: '  ' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...ok, password: 'abc1' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...ok, password: 'abcdefgh' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...ok, password: '12345678' }).success).toBe(false);
  });

  it('recuperação pede só o e-mail', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'ana@exemplo.com' }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
  });

  it('redefinição exige senhas iguais', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'abcdefg1',
      confirmPassword: 'abcdefg2',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['confirmPassword']);
    expect(
      resetPasswordSchema.safeParse({ password: 'abcdefg1', confirmPassword: 'abcdefg1' }).success
    ).toBe(true);
  });
});
