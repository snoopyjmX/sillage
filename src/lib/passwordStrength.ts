// Medidor de força de senha. Regra pura e síncrona; não bloqueia nada (o envio é validado só pelo Zod).
// As exigências vêm do schema de autenticação para medidor e validação nunca divergirem.
import { MIN_PASSWORD_LENGTH, PASSWORD_DIGIT, PASSWORD_LETTER } from '@/schemas/auth';

export type PasswordLevel = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  /** 0 = vazia */
  level: PasswordLevel;
  meetsPolicy: boolean;
  checks: { length: boolean; letter: boolean; digit: boolean };
  weakPattern: boolean;
}

const LONG_PASSWORD_LENGTH = 12;
const SYMBOL = /[^A-Za-z0-9]/;
const REPEATED_CHARS = /(.)\1{3,}/;
const WEAK_SEQUENCES = ['123456', 'abcdef', 'qwerty', 'senha', 'password'];
const WEAK_PATTERN_LEVEL_CAP = 2;

export const evaluatePassword = (value: string): PasswordStrength => {
  const checks = {
    length: value.length >= MIN_PASSWORD_LENGTH,
    letter: PASSWORD_LETTER.test(value),
    digit: PASSWORD_DIGIT.test(value),
  };
  const meetsPolicy = checks.length && checks.letter && checks.digit;
  const lower = value.toLowerCase();
  const weakPattern =
    value.length > 0 &&
    (REPEATED_CHARS.test(value) || WEAK_SEQUENCES.some((sequence) => lower.includes(sequence)));

  if (value.length === 0) return { level: 0, meetsPolicy, checks, weakPattern };
  if (!meetsPolicy) return { level: 1, meetsPolicy, checks, weakPattern };

  const extras = [
    value.length >= LONG_PASSWORD_LENGTH,
    SYMBOL.test(value),
    value !== lower && value !== value.toUpperCase(),
  ].filter(Boolean).length;
  const raw = Math.min(4, 2 + extras);
  const level = (weakPattern ? Math.min(raw, WEAK_PATTERN_LEVEL_CAP) : raw) as PasswordLevel;
  return { level, meetsPolicy, checks, weakPattern };
};
