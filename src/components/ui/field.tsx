// Origem: própria. Rótulo real, dica e erro ligados ao input por aria-describedby.
import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';

interface FieldProps extends Omit<ComponentProps<typeof Input>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
  // Controle à direita dentro do campo (ex.: mostrar/ocultar senha)
  endAdornment?: ReactNode;
}

export function Field({ label, hint, error, endAdornment, className, ...props }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div data-slot="field" className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={endAdornment ? 'pr-12' : undefined}
          {...props}
        />
        {endAdornment && <div className="absolute inset-y-0 right-0 flex">{endAdornment}</div>}
      </div>
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {/* Região viva sempre montada: o erro que surge nela é anunciado */}
      <div aria-live="polite" className="empty:hidden">
        {error && (
          <p id={errorId} className="text-sm text-error">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
