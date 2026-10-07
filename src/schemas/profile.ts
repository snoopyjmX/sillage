// Validação do formulário de perfil. O banco só exige `display_name not null` (sem limite de
// tamanho): o limite de 60 caracteres é o mesmo do cadastro e é conservador, só do front.
// O fuso precisa ser um identificador IANA que o `Intl` conhece (docs/SECURITY.md).
import { z } from 'zod';
import { MAX_NAME_LENGTH } from '@/schemas/auth';

const TIMEZONE_FORMAT = /^[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+)*$/;

export const isValidTimezone = (value: string): boolean => {
  if (!TIMEZONE_FORMAT.test(value)) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Informe como podemos chamar você.')
    .max(MAX_NAME_LENGTH, `O nome pode ter no máximo ${MAX_NAME_LENGTH} caracteres.`),
  timezone: z
    .string()
    .trim()
    .min(1, 'Informe o seu fuso horário.')
    .refine(isValidTimezone, 'Fuso horário inválido. Escolha um da lista, como America/Sao_Paulo.'),
});

export type ProfileValues = z.infer<typeof profileSchema>;

// Fusos que o navegador conhece, para a lista de sugestões do campo
export const listTimezones = (): string[] => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return [];
  }
};
