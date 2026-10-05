// Origem: própria, sobre Radix Dialog + motion/react (o Drawer do shadcn usa a lib vaul,
// que traz animação própria; a regra do projeto é uma única biblioteca de animação).
// Arrastar para baixo fecha (só pela alça, para não brigar com a rolagem do conteúdo).
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { useControllableState } from '@/hooks/useControllableState';
import { useOverlay } from '@/hooks/useOverlay';
import { OverlayContext } from '@/lib/overlay-context';
import { transitions } from '@/lib/motion';
import { cn } from '@/lib/utils';

const DRAG_CLOSE_DISTANCE = 100;
const DRAG_CLOSE_VELOCITY = 500;

export function Drawer({
  open,
  defaultOpen = false,
  onOpenChange,
  ...props
}: ComponentProps<typeof DialogPrimitive.Root>) {
  const [current, setCurrent] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  return (
    <OverlayContext.Provider value={{ open: current, onOpenChange: setCurrent }}>
      <DialogPrimitive.Root open={current} onOpenChange={setCurrent} {...props} />
    </OverlayContext.Provider>
  );
}

export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

type DrawerContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  side?: 'bottom' | 'right';
};

export function DrawerContent({
  className,
  children,
  side = 'bottom',
  ...props
}: DrawerContentProps) {
  const { open, onOpenChange } = useOverlay();
  const dragControls = useDragControls();
  const isBottom = side === 'bottom';
  const hidden = isBottom ? { y: '100%' } : { x: '100%' };
  const shown = isBottom ? { y: 0 } : { x: 0 };

  return (
    <AnimatePresence>
      {open && (
        <DialogPrimitive.Portal forceMount>
          <DialogPrimitive.Overlay asChild forceMount>
            <motion.div
              className="fixed inset-0 z-50 bg-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: transitions.short }}
              exit={{ opacity: 0, transition: transitions.exit }}
            />
          </DialogPrimitive.Overlay>
          <DialogPrimitive.Content asChild forceMount {...props}>
            <motion.div
              data-slot="drawer-content"
              data-side={side}
              className={cn(
                'glass fixed z-50 flex flex-col text-popover-foreground shadow-modal outline-none',
                isBottom
                  ? 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]'
                  : 'inset-y-0 right-0 w-full max-w-sm rounded-l-2xl',
                className
              )}
              initial={{ opacity: 0, ...hidden }}
              animate={{ opacity: 1, ...shown, transition: transitions.modal }}
              exit={{ opacity: 0, ...hidden, transition: transitions.exit }}
              drag={isBottom ? 'y' : false}
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > DRAG_CLOSE_DISTANCE || info.velocity.y > DRAG_CLOSE_VELOCITY) {
                  onOpenChange(false);
                }
              }}
            >
              {isBottom && (
                <div
                  className="flex h-6 shrink-0 cursor-grab touch-none items-center justify-center"
                  onPointerDown={(event) => dragControls.start(event)}
                  aria-hidden
                >
                  <span className="h-1 w-10 rounded-full bg-muted-foreground/40" />
                </div>
              )}
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6 pt-2">
                {children}
              </div>
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

export function DrawerHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

export function DrawerFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-2', className)} {...props} />;
}

export function DrawerTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('font-heading text-2xl leading-tight font-medium', className)}
      {...props}
    />
  );
}

export function DrawerDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
