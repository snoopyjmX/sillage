import { BlurFade } from '@/components/ui/blur-fade';
import { STAGGER_MAX_ITEMS } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { PerfumeSummary } from '@/types/catalog';
import { PerfumeCard } from './PerfumeCard';

interface PerfumeGridProps {
  perfumes: PerfumeSummary[];
  // Troca de página/filtro: a lista anterior fica meio apagada até a nova chegar
  isRefreshing?: boolean;
}

const BLUR_FADE_STEP = 0.1;

export function PerfumeGrid({ perfumes, isRefreshing = false }: PerfumeGridProps) {
  return (
    <ul
      aria-label="Perfumes"
      aria-busy={isRefreshing}
      className={cn(
        'grid grid-cols-1 gap-4 min-[30rem]:grid-cols-2 xl:grid-cols-3',
        isRefreshing && 'opacity-60'
      )}
    >
      {perfumes.map((perfume, index) => (
        <li key={perfume.id} className="h-full">
          {/* Listas longas aparecem de uma vez: o atraso para no 12º item */}
          <BlurFade
            className="h-full"
            delay={BLUR_FADE_STEP * Math.min(index, STAGGER_MAX_ITEMS)}
            inView
          >
            <PerfumeCard perfume={perfume} />
          </BlurFade>
        </li>
      ))}
    </ul>
  );
}
