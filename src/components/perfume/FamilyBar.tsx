import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { FAMILY_LABELS, type OlfactiveFamily } from '@/constants/labels';
import { transitions } from '@/lib/motion';
import type { FamilyShare } from '@/lib/pyramid';

// Classes completas (o Tailwind precisa vê-las inteiras)
const SEGMENT_BG: Record<OlfactiveFamily, string> = {
  citrus: 'bg-family-citrus',
  floral: 'bg-family-floral',
  woody: 'bg-family-woody',
  green: 'bg-family-green',
  aquatic: 'bg-family-aquatic',
  oriental: 'bg-family-oriental',
  spicy: 'bg-family-spicy',
  fruity: 'bg-family-fruity',
  aromatic: 'bg-family-aromatic',
  musky: 'bg-family-musky',
};

interface FamilyBarProps {
  shares: FamilyShare[];
  // Atraso da entrada (s), para escalonar a barra geral e as das camadas
  delay?: number;
  // Cada família da legenda vira atalho para o catálogo filtrado por ela
  linkFamilies?: boolean;
}

// Barra segmentada com o peso de cada família e a legenda visível ("Amadeirado 60%").
// A barra é decorativa (aria-hidden); a lista da legenda leva a informação.
export function FamilyBar({ shares, delay = 0, linkFamilies = false }: FamilyBarProps) {
  const reduceMotion = useReducedMotion() === true;
  if (shares.length === 0) return null;
  return (
    <div data-slot="family-bar" className="flex flex-col gap-2">
      <motion.div
        aria-hidden
        initial={reduceMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={reduceMotion ? { duration: 0 } : { ...transitions.short, delay }}
        className="flex h-2 origin-left gap-0.5 overflow-hidden rounded-full"
      >
        {shares.map(({ family, count }) => (
          <span
            key={family}
            style={{ flexGrow: count }}
            className={`basis-0 ${SEGMENT_BG[family]}`}
          />
        ))}
      </motion.div>
      <ul aria-label="Famílias olfativas" className="flex flex-wrap gap-x-4 gap-y-1">
        {shares.map(({ family, share }) => (
          <li key={family} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden className={`size-2 rounded-full ${SEGMENT_BG[family]}`} />
            {linkFamilies ? (
              <Link
                to={`/catalog?families=${family}`}
                className="inline-flex min-h-11 items-center rounded-sm underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {FAMILY_LABELS[family]} {Math.round(share * 100)}%
              </Link>
            ) : (
              <>
                {FAMILY_LABELS[family]} {Math.round(share * 100)}%
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
