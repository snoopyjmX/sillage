// Regras puras do Perfil (docs/PRODUCT.md, seção de perfil).
import type { CollectionItem, CollectionStatus } from '@/types/collection';

const firstLetter = (word: string): string =>
  Array.from(word).find((char) => /\p{L}/u.test(char)) ?? '';

// Iniciais do avatar: primeira letra da primeira e da última palavra do nome, em maiúscula pt-BR.
// Acentos ficam ("Álvaro Éder" -> "ÁÉ"); emoji e símbolos não são letras e são ignorados; uma
// palavra dá uma inicial. Sem nenhuma letra devolve "" (o avatar mostra um ícone no lugar).
export const getInitials = (name: string): string => {
  const words = name
    .normalize('NFC')
    .split(/\s+/)
    .map(firstLetter)
    .filter((letter) => letter !== '');
  const first = words[0];
  if (first === undefined) return '';
  const last = words.length > 1 ? words[words.length - 1] : '';
  return `${first}${last}`.toLocaleUpperCase('pt-BR');
};

// Contagem real por estado da coleção (RN02)
export const countByStatus = (
  items: readonly CollectionItem[]
): Record<CollectionStatus, number> => ({
  owned: items.filter((item) => item.status === 'owned').length,
  wanted: items.filter((item) => item.status === 'wanted').length,
});
