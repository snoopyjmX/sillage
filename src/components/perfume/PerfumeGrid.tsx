import { motion, useReducedMotion } from 'motion/react';
import { staggerDelay, transitions } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { PerfumeSummary } from '@/types/catalog';
import { PerfumeCard } from './PerfumeCard';

interface PerfumeGridProps {
  perfumes: PerfumeSummary[];
  // Troca de página/filtro: a lista anterior fica meio apagada até a nova chegar
  isRefreshing?: boolean;
}

export function PerfumeGrid({ perfumes, isRefreshing = false }: PerfumeGridProps) {
  const reduceMotion = useReducedMotion();

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
        <motion.li
          key={perfume.id}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { ...transitions.page, delay: staggerDelay(index) },
          }}
        >
          <PerfumeCard perfume={perfume} />
        </motion.li>
      ))}
    </ul>
  );
}
