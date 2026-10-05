import type { Transition, Variants } from 'motion/react';

// Tokens de motion (docs/PRODUCT.md, Seção 10). Componentes importam daqui; não repetem números.
// Só transform e opacity são animados (altura apenas no Drawer).

export const easings = {
  out: 'easeOut',
  standard: [0.22, 1, 0.36, 1],
} as const satisfies Record<string, Transition['ease']>;

export const durations = {
  micro: 0.15, // 120-180 ms
  short: 0.24, // 200-280 ms
  page: 0.36, // 320-420 ms
  exit: 0.18, // saídas nunca passam de 200 ms
} as const;

export const springs = {
  modal: { type: 'spring', stiffness: 380, damping: 34 },
  physical: { type: 'spring', stiffness: 400, damping: 30 },
} as const satisfies Record<string, Transition>;

export const transitions = {
  micro: { duration: durations.micro, ease: easings.out },
  short: { duration: durations.short, ease: easings.standard },
  page: { duration: durations.page, ease: easings.standard },
  exit: { duration: durations.exit, ease: easings.out },
  modal: springs.modal,
  physical: springs.physical,
} as const satisfies Record<string, Transition>;

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.short },
  exit: { opacity: 0, transition: transitions.exit },
};

export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: transitions.page },
  exit: { opacity: 0, transition: transitions.exit },
};

// Stagger: no máximo 12 itens, até 40 ms entre eles. Listas longas aparecem de uma vez.
export const STAGGER_MAX_ITEMS = 12;
export const STAGGER_STEP = 0.04;

export const staggerDelay = (index: number): number =>
  index < STAGGER_MAX_ITEMS ? index * STAGGER_STEP : 0;
