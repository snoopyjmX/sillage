// Origem: própria. Rótulo real, dica e erro ligados ao input por aria-describedby.
import { useId, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';

interface FieldProps extends Omit<ComponentProps<typeof Input>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

export function Field({ label, hint, error, className, ...props }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div data-slot="field" className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
