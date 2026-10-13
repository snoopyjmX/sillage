import { motion, useReducedMotion } from 'motion/react';
import type { NotePosition } from '@/constants/labels';
import { transitions } from '@/lib/motion';
import { cn } from '@/lib/utils';

// Três faixas de um triângulo (viewBox 100 x 60), do topo para a base. Cada uma é um trapézio
// cujos lados seguem as retas do triângulo; o vão de 1,5 entre elas separa as camadas.
const BANDS: Record<NotePosition, string> = {
  top: '50,0 66.7,20 33.3,20',
  heart: '32.5,21.5 67.5,21.5 83.3,40 16.7,40',
  base: '15.8,41.5 84.2,41.5 100,60 0,60',
};
const ORDER: NotePosition[] = ['top', 'heart', 'base'];

interface PyramidShapeProps {
  // Camadas com notas (as outras ficam quase apagadas) e camadas abertas (ficam realçadas)
  present: Record<NotePosition, boolean>;
  open: Record<NotePosition, boolean>;
  className?: string;
}

// Forma visual da pirâmide: a faixa da camada aberta fica realçada (anima só opacity).
// Decorativa: a informação está nas camadas, ao lado.
export function PyramidShape({ present, open, className }: PyramidShapeProps) {
  const reduceMotion = useReducedMotion() === true;
  return (
    <svg
      aria-hidden
      focusable="false"
      data-slot="pyramid-shape"
      viewBox="0 0 100 60"
      className={cn('block', className)}
    >
      {ORDER.map((position) => (
        <motion.polygon
          key={position}
          data-position={position}
          points={BANDS[position]}
          className="fill-primary"
          initial={false}
          animate={{ opacity: !present[position] ? 0.08 : open[position] ? 1 : 0.28 }}
          transition={reduceMotion ? { duration: 0 } : transitions.short}
        />
      ))}
    </svg>
  );
}
