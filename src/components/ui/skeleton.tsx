// Origem: shadcn/ui (skeleton), com shimmer por transform (desliga em reduced motion).
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      className={cn(
        'skeleton relative overflow-hidden rounded-md bg-muted',
        'after:absolute after:inset-0 after:animate-[shimmer_1.6s_ease-in-out_infinite] after:bg-linear-to-r after:from-transparent after:via-card/70 after:to-transparent',
        className
      )}
      {...props}
    />
  );
}
