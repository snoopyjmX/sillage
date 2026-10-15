// Origem: própria. O <input type="checkbox"> nativo continua sendo o elemento real (papel, teclado,
// formulários); o visual é só CSS. Sem animação. O label garante o alvo de toque de 44 px.
import type { ComponentProps, ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type CheckboxProps = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  /** Texto visível, vem de quem usa. */
  label: ReactNode;
};

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label
      data-slot="checkbox"
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3 text-sm has-[:disabled]:cursor-not-allowed',
        className
      )}
    >
      <span className="relative size-5 shrink-0">
        <input
          type="checkbox"
          className={cn(
            'peer size-5 cursor-[inherit] appearance-none rounded-sm border border-input bg-card',
            'checked:border-primary checked:bg-primary hover:border-primary',
            'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          {...props}
        />
        <Check
          aria-hidden
          className="pointer-events-none absolute inset-0 size-5 p-0.5 text-primary-foreground opacity-0 peer-checked:opacity-100"
        />
      </span>
      {label}
    </label>
  );
}
