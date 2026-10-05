// Validação do formulário de avaliação (RN05: notas inteiras de 1 a 5; comentário até 1000).
import { z } from 'zod';

export const MAX_COMMENT_LENGTH = 1000;

const rating = (label: string) =>
  z
    .number({ error: `Escolha a nota de ${label} de 1 a 5 estrelas.` })
    .int(`Escolha a nota de ${label} de 1 a 5 estrelas.`)
    .min(1, `Escolha a nota de ${label} de 1 a 5 estrelas.`)
    .max(5, `Escolha a nota de ${label} de 1 a 5 estrelas.`);

export const reviewSchema = z.object({
  longevity: rating('fixação'),
  projection: rating('projeção'),
  comment: z
    .string()
    .trim()
    .max(MAX_COMMENT_LENGTH, `O comentário pode ter no máximo ${MAX_COMMENT_LENGTH} caracteres.`),
});

// Formulário: as notas começam sem valor (o usuário precisa escolher)
export interface ReviewFormValues {
  longevity: number | undefined;
  projection: number | undefined;
  comment: string;
}

export type ReviewValues = z.infer<typeof reviewSchema>;
