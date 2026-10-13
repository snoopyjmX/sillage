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

const SRCSET_WIDTHS: Record<ImageVariant, number> = { thumb: 320, medium: 640, large: 1280 };

// srcset a partir das variantes (320w, 640w, 1280w); sem .webp não há variantes e devolve undefined
export const imageSrcSet = (url: string): string | undefined =>
  /.webp$/i.test(url)
    ? (Object.keys(SRCSET_WIDTHS) as ImageVariant[])
        .map((variant) => `${variantUrl(url, variant)} ${SRCSET_WIDTHS[variant]}w`)
        .join(', ')
    : undefined;
