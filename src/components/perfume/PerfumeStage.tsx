import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PerfumeStageProps {
  children: ReactNode;
  // Proporção e tamanho vêm de quem usa (ex.: aspect-[4/3]); o palco só pinta o fundo
  className?: string;
}

// Palco neutro das fotos de frasco (fundo transparente): gradiente radial pelos tokens --stage*.
// O frasco dentro dele é sempre object-contain, nunca cover.
export function PerfumeStage({ children, className }: PerfumeStageProps) {
  return (
    <div
      data-slot="perfume-stage"
      className={cn(
        'flex items-center justify-center overflow-hidden bg-radial from-stage-highlight to-stage',
        className
      )}
    >
      {children}
    </div>
  );
}
