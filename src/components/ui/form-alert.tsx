// Origem: própria. Erro do formulário (role="alert", anunciado na hora) ou aviso (role="status").
import { CircleAlert, CircleCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormAlertProps {
  tone?: 'error' | 'success';
  children: ReactNode;
  className?: string;
}

export function FormAlert({ tone = 'error', children, className }: FormAlertProps) {
  const Icon = tone === 'error' ? CircleAlert : CircleCheck;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      data-slot="form-alert"
      className={cn(
        'flex items-start gap-2 rounded-lg border bg-accent p-3 text-sm text-foreground',
        tone === 'error' ? 'border-error' : 'border-success',
        className
      )}
    >
      <Icon
        className={cn('mt-0.5 size-4 shrink-0', tone === 'error' ? 'text-error' : 'text-success')}
        aria-hidden
      />
      <p>{children}</p>
    </div>
  );
}
