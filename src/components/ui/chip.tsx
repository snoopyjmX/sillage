// Origem: própria. Chip neutro, de família olfativa (10) e selo de concentração.
// Se receber `selected` ou `onClick`, vira um botão com aria-pressed.
import { cva } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import type { OlfactiveFamily } from '@/constants/labels';
import { cn } from '@/lib/utils';

// Classes completas (o Tailwind precisa vê-las inteiras)
const familyClasses: Record<OlfactiveFamily, string> = {
  citrus: 'bg-family-citrus text-family-citrus-foreground',
  floral: 'bg-family-floral text-family-floral-foreground',
  woody: 'bg-family-woody text-family-woody-foreground',
  green: 'bg-family-green text-family-green-foreground',
  aquatic: 'bg-family-aquatic text-family-aquatic-foreground',
  oriental: 'bg-family-oriental text-family-oriental-foreground',
  spicy: 'bg-family-spicy text-family-spicy-foreground',
  fruity: 'bg-family-fruity text-family-fruity-foreground',
  aromatic: 'bg-family-aromatic text-family-aromatic-foreground',
  musky: 'bg-family-musky text-family-musky-foreground',
};

const chipVariants = cva(
  'relative inline-flex shrink-0 items-center gap-1 font-medium whitespace-nowrap select-none',
  {
    variants: {
      variant: {
        neutral: 'h-8 rounded-full border bg-secondary px-3 text-sm text-secondary-foreground',
        family: 'h-8 rounded-full px-3 text-sm',
        concentration:
          'h-6 rounded-sm bg-badge-concentration px-2 text-xs tracking-wider text-badge-concentration-foreground uppercase',
      },
      interactive: {
        true: [
          // área de toque de 44px sem aumentar o chip
          'cursor-pointer outline-none after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[""]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          'transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
        ],
        false: '',
      },
      selected: {
        true: 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        false: '',
      },
    },
    defaultVariants: { variant: 'neutral', interactive: false, selected: false },
  }
);

type ChipProps = Omit<ComponentProps<'span'>, 'onClick'> & {
  variant?: 'neutral' | 'concentration';
  family?: OlfactiveFamily;
  selected?: boolean;
  onClick?: ComponentProps<'button'>['onClick'];
};

export function Chip({
  className,
  variant,
  family,
  selected,
  onClick,
  children,
  ...props
}: ChipProps) {
  const resolved = family ? 'family' : (variant ?? 'neutral');
  const interactive = selected !== undefined || onClick !== undefined;
  const classes = cn(
    chipVariants({ variant: resolved, interactive, selected: selected === true }),
    family && familyClasses[family],
    className
  );
  const dataProps = { 'data-slot': 'chip', 'data-variant': resolved, 'data-family': family };

  if (interactive) {
    return (
      <button
        type="button"
        aria-pressed={selected === true}
        onClick={onClick}
        className={classes}
        {...dataProps}
        {...(props as ComponentProps<'button'>)}
      >
        {children}
      </button>
    );
  }
  return (
    <span className={classes} {...dataProps} {...props}>
      {children}
    </span>
  );
}
