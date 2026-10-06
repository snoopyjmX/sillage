import { useState, type ReactNode } from 'react';
import { imageSources, type ImageVariant } from '@/lib/images';
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
}: PerfumeImageProps) {
  const sources = imageSources(url, variant);
  const [attempt, setAttempt] = useState(0);
  const src = sources[attempt];
  if (!src) return <>{fallback}</>;
  return (
    <img
      src={src}
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
