// Origem: shadcn/ui (dropdown-menu) sobre Radix. Animação reescrita com motion/react
// (sem tw-animate-css): só opacity e transform, curtas, e a saída nunca passa de 200 ms.
import { Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { useControllableState } from '@/hooks/useControllableState';
import { useOverlay } from '@/hooks/useOverlay';
import { transitions } from '@/lib/motion';
import { OverlayContext } from '@/lib/overlay-context';
import { cn } from '@/lib/utils';

export function DropdownMenu({
  open,
  defaultOpen = false,
  onOpenChange,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  const [current, setCurrent] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  return (
    <OverlayContext.Provider value={{ open: current, onOpenChange: setCurrent }}>
      <DropdownMenuPrimitive.Root open={current} onOpenChange={setCurrent} {...props} />
    </OverlayContext.Provider>
  );
}

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export function DropdownMenuContent({
  className,
  children,
  sideOffset = 6,
  align = 'center',
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  const { open } = useOverlay();
  return (
    <AnimatePresence>
      {open && (
        <DropdownMenuPrimitive.Portal forceMount>
          <DropdownMenuPrimitive.Content
            asChild
            forceMount
            sideOffset={sideOffset}
            align={align}
            {...props}
          >
            <motion.div
              data-slot="dropdown-menu-content"
              className={cn(
                'z-50 min-w-(--radix-dropdown-menu-trigger-width) rounded-xl border bg-popover p-1 text-popover-foreground shadow-floating outline-none',
                className
              )}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0, transition: transitions.micro }}
              exit={{ opacity: 0, transition: transitions.exit }}
            >
              {children}
            </motion.div>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

const itemClass =
  'relative flex min-h-11 w-full cursor-default items-center gap-2 rounded-lg px-3 text-sm outline-none select-none ' +
  'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50';

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(itemClass, className)}
      {...props}
    />
  );
}

// Seleção única (menuitemradio): o item marcado mostra o check, além de ficar em negrito
export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(itemClass, 'pr-9 data-[state=checked]:font-medium', className)}
      {...props}
    >
      {children}
      <DropdownMenuPrimitive.ItemIndicator className="absolute right-3 grid place-items-center text-primary">
        <Check className="size-4" aria-hidden />
      </DropdownMenuPrimitive.ItemIndicator>
    </DropdownMenuPrimitive.RadioItem>
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}
