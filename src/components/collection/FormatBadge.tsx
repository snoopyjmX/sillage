import { Droplet, FlaskConical, Pipette, type LucideIcon } from 'lucide-react';
import type { CollectionFormat } from '@/constants/collection';
import { formatBadgeLabel } from '@/lib/collectionFormat';
import type { CollectionDetails } from '@/types/collection';

export const FORMAT_ICONS: Record<CollectionFormat, LucideIcon> = {
  bottle: FlaskConical,
  decant: Pipette,
  sample: Droplet,
};

// Selo discreto do formato no card ("Frasco 100 ml"). Sem formato, nada (D8): não presumimos "Frasco".
export function FormatBadge(details: CollectionDetails) {
  const label = formatBadgeLabel(details);
  if (details.format === null || label === null) return null;
  const Icon = FORMAT_ICONS[details.format];
  return (
    <span
      data-slot="format-badge"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground"
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
