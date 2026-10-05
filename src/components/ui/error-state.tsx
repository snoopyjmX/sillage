// Origem: própria. Nunca recebe mensagem crua do Supabase: o texto vem de constants/errors.ts.
import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Algo deu errado',
  description = 'Não foi possível carregar agora. Tente novamente em instantes.',
  onRetry,
  retryLabel = 'Tentar novamente',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      data-slot="error-state"
      className={cn('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}
    >
      <span className="grid size-12 place-items-center rounded-full bg-accent text-error">
        <CircleAlert className="size-6" aria-hidden />
      </span>
      <h3 className="font-heading text-xl font-medium">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
