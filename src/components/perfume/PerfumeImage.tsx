import { useState, type ReactNode } from 'react';
import { imageSources, imageSrcSet, type ImageVariant } from '@/lib/images';
import { cn } from '@/lib/utils';

interface PerfumeImageProps {
  url: string | null | undefined;
  variant: ImageVariant;
  alt: string;
  width: number;
  height: number;
  // Quando nenhuma fonte carrega (ou não há imagem)
  fallback: ReactNode;
  className?: string;
  priority?: boolean;
  // Quando informado, a primeira tentativa usa srcset (320w/640w/1280w) para o navegador escolher
  sizes?: string;
}

// Tenta a variante pedida; se não existir, cai no original; sem nenhum, mostra o `fallback`.
// Use `key={url}` para recomeçar a cadeia quando o perfume muda.
export function PerfumeImage({
  url,
  variant,
  alt,
  width,
  height,
  fallback,
  className,
  priority = false,
  sizes,
}: PerfumeImageProps) {
  const sources = imageSources(url, variant);
  const [attempt, setAttempt] = useState(0);
  const src = sources[attempt];
  if (!src) return <>{fallback}</>;
  // O srcset só vale na primeira tentativa; se falhar, a cadeia segue com o src simples
  const srcSet = sizes && attempt === 0 && url ? imageSrcSet(url) : undefined;
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setAttempt((current) => current + 1)}
      className={cn(className)}
    />
  );
}
