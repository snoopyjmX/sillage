// Validação dos formulários de autenticação (docs/PRODUCT.md, Seções 7 e 11). Textos em pt-BR.
import { z } from 'zod';

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72; // limite do bcrypt usado pelo GoTrue
export const MAX_NAME_LENGTH = 60;

const email = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .max(254, 'E-mail muito longo.')
  .pipe(z.email('Informe um e-mail válido, como nome@exemplo.com.'));

const newPassword = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
  .max(MAX_PASSWORD_LENGTH, `A senha pode ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.`)
  .regex(/[A-Za-z]/, 'Inclua pelo menos uma letra.')
  .regex(/\d/, 'Inclua pelo menos um número.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha.'),
});

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Informe como podemos chamar você.')
    .max(MAX_NAME_LENGTH, `O nome pode ter no máximo ${MAX_NAME_LENGTH} caracteres.`),
  email,
  password: newPassword,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string().min(1, 'Repita a nova senha.') })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não são iguais.',
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
