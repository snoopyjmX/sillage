import { describe, expect, it } from 'vitest';
import { evaluatePassword } from '@/lib/passwordStrength';
import { registerSchema } from '@/schemas/auth';

describe('evaluatePassword', () => {
  it.each([
    ['', 0],
    ['abc', 1],
    ['abcdefgh', 1],
    ['abcdefg1', 2],
    ['Lavanda7', 3],
    ['Lavanda7!Mar', 4],
  ])('%j → nível %i', (value, level) => {
    expect(evaluatePassword(value).level).toBe(level);
  });

  it('marca a falta de número', () => {
    expect(evaluatePassword('abcdefgh').checks.digit).toBe(false);
  });

  it.each(['12345678a', 'qwerty12', 'aaaa1234'])('%s tem padrão fraco e nível ≤ 2', (value) => {
    const result = evaluatePassword(value);
    expect(result.weakPattern).toBe(true);
    expect(result.level).toBeLessThanOrEqual(2);
  });

  it('meetsPolicy equivale ao schema do Zod', () => {
    const samples = ['', 'abc', 'abcdefgh', '12345678', 'abcdefg1', 'Abcdefg1!', 'a1'.repeat(36)];
    for (const value of samples) {
      const expected = registerSchema.shape.password.safeParse(value).success;
      expect(evaluatePassword(value).meetsPolicy).toBe(expected);
    }
  });
});
