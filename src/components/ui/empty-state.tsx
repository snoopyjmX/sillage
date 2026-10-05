// Origem: própria. Os textos vêm de quem usa; o componente não tem copy fixa.
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}
    >
      {Icon && (
        <span className="grid size-12 place-items-center rounded-full bg-accent text-primary">
          <Icon className="size-6" aria-hidden />
        </span>
      )}
      <h3 className="font-heading text-xl font-medium">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
