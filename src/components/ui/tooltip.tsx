// Origem: Radix Tooltip (pacote radix-ui já instalado), com os tokens do Sillage. Sem animação:
// aparece e some na hora (nada de tw-animate-css).
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-w-64 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-floating',
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
