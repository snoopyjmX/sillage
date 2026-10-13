// A URL do comparador é entrada do usuário (docs/PRODUCT.md, Seção 8): os slugs passam por Zod e
// valor inválido vira "nenhum", sem quebrar a página. `/compare?a=<slug>&b=<slug>` é compartilhável.
import { z } from 'zod';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugSchema = z.string().max(80).regex(SLUG);

export interface CompareSelection {
  a: string | null;
  b: string | null;
}

const readSlug = (value: string | null): string | null => {
  const parsed = slugSchema.safeParse(value ?? '');
  return parsed.success ? parsed.data : null;
};

export const parseCompareParams = (params: URLSearchParams): CompareSelection => ({
  a: readSlug(params.get('a')),
  b: readSlug(params.get('b')),
});

// Caminho do comparador; slot sem perfume fica de fora
export const buildComparePath = ({ a, b }: CompareSelection): string => {
  const params = new URLSearchParams();
  if (a) params.set('a', a);
  if (b) params.set('b', b);
  const query = params.toString();
  return query === '' ? '/compare' : `/compare?${query}`;
};

// Os dois lados escolhidos e diferentes: só então há o que comparar
export const isComparable = ({ a, b }: CompareSelection): boolean =>
  a !== null && b !== null && a !== b;
