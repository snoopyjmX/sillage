// Origem: shadcn/ui (input), adaptado. 16 px de fonte evita o zoom do iOS ao focar.
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-base text-foreground',
        'placeholder:text-muted-foreground',
        'outline-none focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring',
        'aria-invalid:border-destructive aria-invalid:focus-visible:outline-destructive',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}
