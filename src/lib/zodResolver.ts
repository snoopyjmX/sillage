// Ponte mínima entre Zod e react-hook-form (evita uma dependência só para isso).
// Mostra só o primeiro erro de cada campo, na ordem em que o schema os declara.
import type { FieldError, FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import type { z } from 'zod';

export const zodResolver =
  <T extends FieldValues>(schema: z.ZodType<T>): Resolver<T> =>
  (values) => {
    const result = schema.safeParse(values);
    if (result.success) return { values: result.data, errors: {} };

    const errors: Record<string, FieldError> = {};
    for (const issue of result.error.issues) {
      const name = issue.path[0];
      if (typeof name !== 'string' || name in errors) continue;
      errors[name] = { type: issue.code, message: issue.message };
    }
    return { values: {}, errors: errors as FieldErrors<T> };
  };
