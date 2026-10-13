import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import {
  POSITION_LABELS,
  POSITIONS,
  type NotePosition,
  type OlfactiveFamily,
} from '@/constants/labels';
import { LAYER_DETAILS } from '@/constants/pyramid';
import { springs, staggerDelay } from '@/lib/motion';
import { cn } from '@/lib/utils';

// Três trapézios de alturas iguais (viewBox 100 x 80), do topo para a base. Os lados seguem as
// retas do triângulo; o vão de 1,5 entre as faixas separa as camadas.
const BANDS: Record<NotePosition, string> = {
  top: '50,0 66.25,26 33.75,26',
  heart: '32.81,27.5 67.19,27.5 83.13,53 16.88,53',
  base: '15.94,54.5 84.06,54.5 100,80 0,80',
};
// Classes completas (o Tailwind precisa vê-las inteiras)
const DOT_CLASSES: Record<OlfactiveFamily, string> = {
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
const MAX_DOTS = 8;
// A faixa de baixo entra primeiro: a pirâmide "sobe" ao aparecer
const ENTER_RANK: Record<NotePosition, number> = { base: 0, heart: 1, top: 2 };

interface PyramidShapeProps {
  // Famílias das notas de cada camada, uma por nota (vazia = camada sem notas)
  families: Record<NotePosition, OlfactiveFamily[]>;
  // Camada em destaque (hover ou foco na camada correspondente)
  active: NotePosition | null;
  onActiveChange: (position: NotePosition | null) => void;
  className?: string;
}

// Pirâmide grande, com o nome e o tempo de cada camada dentro da faixa e um ponto por nota
// (cor da família). Decorativa (aria-hidden): a informação completa está nas camadas ao lado.
// Anima só opacity e transform; em reduced motion aparece pronta.
export function PyramidShape({ families, active, onActiveChange, className }: PyramidShapeProps) {
  const reduceMotion = useReducedMotion() === true;
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true });
  const visible = reduceMotion || seen;

  return (
    <div
      ref={ref}
      aria-hidden
      data-slot="pyramid-shape"
      className={cn('relative aspect-[5/4] w-full', className)}
    >
      <svg focusable="false" viewBox="0 0 100 80" className="absolute inset-0 size-full">
        {POSITIONS.map((position) => {
          const empty = families[position].length === 0;
          return (
            <motion.polygon
              key={position}
              data-position={position}
              points={BANDS[position]}
              className={empty ? 'fill-muted' : 'fill-primary'}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{
                opacity: visible ? 1 : 0,
                y: visible ? 0 : 6,
                scale: active === position ? 1.03 : 1,
              }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { ...springs.modal, delay: staggerDelay(ENTER_RANK[position]) * 3 }
              }
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid grid-rows-3">
        {POSITIONS.map((position) => {
          const list = families[position];
          const empty = list.length === 0;
          return (
            <motion.div
              key={position}
              onMouseEnter={() => onActiveChange(position)}
              onMouseLeave={() => onActiveChange(null)}
              className={cn(
                'flex flex-col items-center justify-end gap-0.5 pb-1 text-center md:pb-2',
                empty ? 'text-muted-foreground' : 'text-primary-foreground'
              )}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: visible ? 1 : 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { ...springs.modal, delay: staggerDelay(ENTER_RANK[position]) * 3 + 0.1 }
              }
            >
              <span className="font-heading text-sm leading-none font-medium md:text-base">
                {POSITION_LABELS[position]}
              </span>
              <span className="text-xs leading-none">
                {empty ? 'sem notas' : LAYER_DETAILS[position].timing}
              </span>
              {!empty && (
                <span className="mt-0.5 flex gap-1">
                  {list.slice(0, MAX_DOTS).map((family, index) => (
                    <span
                      key={index}
                      className={cn(
                        'size-2 rounded-full ring-1 ring-primary-foreground',
                        DOT_CLASSES[family]
                      )}
                    />
                  ))}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
