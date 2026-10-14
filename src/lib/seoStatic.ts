// Metas estáticas do index.html: existem para os crawlers, que não executam JS.
// Tira as meta tags estáticas do index.html (data-static-seo); o <title> fica até o SeoHead trocá-lo. Roda uma vez, antes do primeiro render:
// elas só existem para os crawlers, que não executam JS. Depois disso, o SeoHead de cada página
// é a única fonte, então nada fica desatualizado numa navegação dentro do app.
export const removeStaticSeoTags = (): void => {
  document.head.querySelectorAll('meta[data-static-seo]').forEach((element) => element.remove());
};
