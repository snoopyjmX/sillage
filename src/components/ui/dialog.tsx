// Origem: shadcn/ui (dialog) sobre Radix. Animação reescrita com motion/react (sem tw-animate-css).
// Vidro: no máximo 1 camada aqui (o fundo escurecido é um scrim sólido, sem blur).
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { useControllableState } from '@/hooks/useControllableState';
import { useOverlay } from '@/hooks/useOverlay';
import { OverlayContext } from '@/lib/overlay-context';
import { transitions } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function Dialog({
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

export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  closeLabel?: string;
};

export function DialogContent({
  className,
  children,
  closeLabel = 'Fechar',
  ...props
}: DialogContentProps) {
  const { open } = useOverlay();
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
          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
            <DialogPrimitive.Content asChild forceMount {...props}>
              <motion.div
                data-slot="dialog-content"
                className={cn(
                  'glass pointer-events-auto relative grid w-full max-w-lg gap-4 rounded-2xl p-6 text-popover-foreground shadow-modal outline-none',
                  className
                )}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: transitions.modal }}
                exit={{ opacity: 0, scale: 0.98, transition: transitions.exit }}
              >
                {children}
                <DialogPrimitive.Close
                  aria-label={closeLabel}
                  className="absolute top-2 right-2 grid size-11 place-items-center rounded-lg text-muted-foreground outline-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <X className="size-5" aria-hidden />
                </DialogPrimitive.Close>
              </motion.div>
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5 pr-10', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('font-heading text-2xl leading-tight font-medium', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-text-secondary', className)}
      {...props}
    />
  );
}
