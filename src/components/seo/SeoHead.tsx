import { useEffect } from 'react';

const SITE_NAME = 'Sillage';
const DEFAULT_IMAGE_PATH = '/og-image.jpg';
const DEFAULT_DESCRIPTION =
  'Sillage: catálogo de perfumes de nicho com pirâmide olfativa, coleção, avaliações e o Perfume do Dia.';

interface SeoHeadProps {
  title?: string;
  description?: string;
  imageUrl?: string | null;
  type?: 'website' | 'article';
}

// O React 19 move <title> e <meta> para o <head>, sem biblioteca. As tags estáticas do index.html
// (data-static-seo) servem aos crawlers sem JS; ao montar, saem do <head> para não duplicar.
// Cada página monta o seu SeoHead, então a URL lida aqui é a da rota atual.
export function SeoHead({
  title,
  description = DEFAULT_DESCRIPTION,
  imageUrl,
  type = 'website',
}: SeoHeadProps) {
  useEffect(() => {
    document.head.querySelectorAll('[data-static-seo]').forEach((element) => element.remove());
  }, []);

  const fullTitle = title && title !== SITE_NAME ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const url = window.location.href;
  const image = new URL(imageUrl ?? DEFAULT_IMAGE_PATH, window.location.origin).href;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}
