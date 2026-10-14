import { FlaskConical } from 'lucide-react';
import type { OlfactiveFamily } from '@/constants/labels';
import { cn } from '@/lib/utils';

// Classes completas (o Tailwind precisa vê-las inteiras). Fundo suave na cor da família principal.
const PLACEHOLDER_BG: Record<OlfactiveFamily, string> = {
  citrus: 'bg-family-citrus',
  floral: 'bg-family-floral',
  woody: 'bg-family-woody',
  green: 'bg-family-green',
  aquatic: 'bg-family-aquatic',
  oriental: 'bg-family-oriental',
  spicy: 'bg-family-spicy',
  fruity: 'bg-family-fruity',
  aromatic: 'bg-family-aromatic',
  musky: 'bg-family-musky',
};

interface PerfumePlaceholderProps {
  family?: OlfactiveFamily;
  // Mostra o ícone do frasco (hero); o card usa só o fundo
  showIcon?: boolean;
  className?: string;
}

// Fallback de foto que não carrega (URL quebrada ou offline): fundo na cor da família
// principal, sem logo.
export function PerfumePlaceholder({
  family,
  showIcon = false,
  className,
}: PerfumePlaceholderProps) {
  return (
    <div
      aria-hidden
      data-slot="perfume-placeholder"
      className={cn(
        'grid w-full place-items-center',
        family ? PLACEHOLDER_BG[family] : 'bg-muted',
        className
      )}
    >
      {showIcon && <FlaskConical className="size-1/4 text-foreground/40" strokeWidth={1} />}
    </div>
  );
}
