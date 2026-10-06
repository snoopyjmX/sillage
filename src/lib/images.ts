// Variantes de imagem geradas por scripts/process-images.mjs: slug-thumb/-medium/-large.webp.
// `image_path` aponta para o arquivo-base (slug.webp); se a variante não existir, vale o original.
export type ImageVariant = 'thumb' | 'medium' | 'large';

export const variantUrl = (url: string, variant: ImageVariant): string =>
  /\.webp$/i.test(url) ? url.replace(/\.webp$/i, `-${variant}.webp`) : url;

// Fontes em ordem de tentativa: a variante primeiro, o original como fallback (sem repetir)
export const imageSources = (url: string | null | undefined, variant: ImageVariant): string[] => {
  if (!url) return [];
  const preferred = variantUrl(url, variant);
  return preferred === url ? [url] : [preferred, url];
};
