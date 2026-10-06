import { Rating } from '@/components/ui/rating';
import { formatLongDate } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  authorName: string;
  // ISO
  date: string;
  longevity: number;
  projection: number;
  comment: string | null;
  highlight?: boolean;
}

// Uma avaliação pública. O comentário é texto do usuário: sempre renderizado como texto.
export function ReviewCard({
  authorName,
  date,
  longevity,
  projection,
  comment,
  highlight = false,
}: ReviewCardProps) {
  return (
    <article
      className={cn(
        'flex h-full flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-card',
        highlight && 'border-primary'
      )}
    >
      <header className="flex flex-col">
        <h3 className="font-heading text-lg leading-tight font-medium">{authorName}</h3>
        <time dateTime={date} className="text-xs text-muted-foreground">
          {formatLongDate(date)}
        </time>
      </header>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-text-secondary">Fixação</span>
          <Rating readOnly label="Fixação" value={longevity} showValue />
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-text-secondary">Projeção</span>
          <Rating readOnly label="Projeção" value={projection} showValue />
        </div>
      </div>
      {comment && <p className="text-sm whitespace-pre-line break-words">{comment}</p>}
    </article>
  );
}
