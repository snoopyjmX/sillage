// Origem: 21st.dev (BlurFade). Adaptado pela curadoria da Seção 10: o desfoque (`filter`) é opt-in
// e vem desligado, porque só transform e opacity podem ser animados; durações vêm de lib/motion.ts;
// em reduced motion o conteúdo aparece pronto, sem animar.
import { motion, useInView, useReducedMotion, type Variants } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { durations, easings } from '@/lib/motion';

type Direction = 'up' | 'down' | 'left' | 'right';

interface BlurFadeProps {
  children: ReactNode;
  className?: string;
  // Atraso em segundos (quem usa em lista limita com STAGGER_MAX_ITEMS)
  delay?: number;
  duration?: number;
  // Deslocamento inicial em px, no sentido de `direction`
  offset?: number;
  direction?: Direction;
  // Só anima quando entra na tela (uma vez)
  inView?: boolean;
  inViewMargin?: string;
  // Desfoque inicial (ex.: '6px'); opt-in, pois `filter` não é transform nem opacity
  blur?: string;
}

const AXIS: Record<Direction, { axis: 'x' | 'y'; sign: 1 | -1 }> = {
  up: { axis: 'y', sign: 1 },
  down: { axis: 'y', sign: -1 },
  left: { axis: 'x', sign: 1 },
  right: { axis: 'x', sign: -1 },
};

export function BlurFade({
  children,
  className,
  delay = 0,
  duration = durations.page,
  offset = 6,
  direction = 'down',
  inView = false,
  inViewMargin = '-50px',
  blur,
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const seen = useInView(ref, { once: true, margin: inViewMargin as `${number}px` });
  const visible = !inView || seen;

  if (reduceMotion) {
    return (
      <div data-slot="blur-fade" className={className}>
        {children}
      </div>
    );
  }

  const { axis, sign } = AXIS[direction];
  const variants: Variants = {
    hidden: { [axis]: sign * offset, opacity: 0, ...(blur ? { filter: `blur(${blur})` } : {}) },
    visible: { [axis]: 0, opacity: 1, ...(blur ? { filter: 'blur(0px)' } : {}) },
  };

  return (
    <motion.div
      ref={ref}
      data-slot="blur-fade"
      className={className}
      variants={variants}
      initial="hidden"
      animate={visible ? 'visible' : 'hidden'}
      transition={{ delay, duration, ease: easings.standard }}
    >
      {children}
    </motion.div>
  );
}
