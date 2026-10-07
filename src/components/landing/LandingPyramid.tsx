// Momento de assinatura da Landing: a pirâmide olfativa (Topo, Coração, Fundo) revelada em
// camadas. Decorativa (aria-hidden): o texto equivalente está nas seções. Anima só opacity e y,
// com os tokens de lib/motion.ts; em reduced motion aparece pronta.
import { motion, useReducedMotion } from 'motion/react';
import { PYRAMID_LAYERS } from '@/constants/landing';
import { staggerDelay, transitions } from '@/lib/motion';
import { cn } from '@/lib/utils';

const LAYER_STYLE = {
  top: 'bg-accent text-foreground',
  heart: 'bg-secondary text-foreground',
  base: 'bg-primary text-primary-foreground',
} as const;

export function LandingPyramid({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden className={cn('flex flex-col items-center gap-2', className)}>
      {PYRAMID_LAYERS.map((layer, index) => (
        <motion.div
          key={layer.key}
          data-layer={layer.key}
          className={cn(
            'flex flex-col items-center rounded-2xl border px-4 py-4 text-center shadow-card',
            layer.width,
            LAYER_STYLE[layer.key]
          )}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { ...transitions.page, delay: staggerDelay(index) * 4 },
          }}
        >
          <span className="font-heading text-xl font-medium">{layer.label}</span>
          <span className="text-sm opacity-80">{layer.hint}</span>
        </motion.div>
      ))}
    </div>
  );
}
