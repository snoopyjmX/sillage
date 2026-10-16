import type { CollectionItem } from '@/types/collection';

// "Lírio" casa com "lirio": compara sem acento e sem caixa
export const foldText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

// Busca em memória na coleção já carregada: o texto (todas as palavras) precisa aparecer no nome
// ou na marca do perfume. Texto vazio devolve tudo.
export const filterCollection = <T extends Pick<CollectionItem, 'perfume'>>(
  items: readonly T[],
  query: string
): T[] => {
  const words = foldText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...items];
  return items.filter(({ perfume }) => {
    const haystack = foldText(`${perfume.name} ${perfume.brandName}`);
    return words.every((word) => haystack.includes(word));
  });
};
