// Origem: 21st.dev (HoverButton). Adaptado pela curadoria da Seção 10: cores só por tokens
// (sem props de cor em hexadecimal), brilho animado só por transform e opacity, sem
// tw-animate-css, desligado em reduced motion e em toque, alvo de 44 px e foco visível.
import { useState, type ComponentProps, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';

type HoverGlowButtonProps = Omit<ComponentProps<'button'>, 'onPointerMove'>;

export function HoverGlowButton({
  className,
  children,
  type = 'button',
  onPointerEnter,
  onPointerLeave,
  ...props
}: HoverGlowButtonProps) {
  const [glow, setGlow] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const isMouse = (event: PointerEvent<HTMLButtonElement>) => event.pointerType === 'mouse';

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isMouse(event)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setGlow({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  const handlePointerEnter = (event: PointerEvent<HTMLButtonElement>) => {
    if (isMouse(event)) setActive(true);
    onPointerEnter?.(event);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLButtonElement>) => {
    setActive(false);
    onPointerLeave?.(event);
  };

  const unavailable = props['aria-disabled'] === true || props['aria-disabled'] === 'true';
  const showGlow = active && !unavailable && !props.disabled;

  return (
    <button
      type={type}
      data-slot="hover-glow-button"
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={cn(
        'relative isolate inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-lg border bg-card px-5 text-base font-medium whitespace-nowrap text-primary',
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'transition-transform duration-150 ease-out active:scale-[0.97]',
        'motion-reduce:transition-none motion-reduce:active:scale-100',
        'disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        data-slot="hover-glow"
        className={cn(
          'pointer-events-none absolute top-0 left-0 -z-10 size-48 rounded-full opacity-0',
          'transition-[transform,opacity] duration-300 ease-out motion-reduce:hidden',
          showGlow && 'opacity-25'
        )}
        style={{
          transform: `translate(${glow.x}px, ${glow.y}px) translate(-50%, -50%) scale(${showGlow ? 1 : 0})`,
          background: 'radial-gradient(circle, var(--primary) 10%, transparent 70%)',
        }}
      />
      {children}
    </button>
  );
}
