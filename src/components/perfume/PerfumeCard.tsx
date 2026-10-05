import { Link } from 'react-router-dom';
import { CollectionToggle } from '@/components/collection/CollectionToggle';
import { Chip } from '@/components/ui/chip';
import { CONCENTRATION_LABELS, FAMILY_LABELS, GENDER_LABELS } from '@/constants/labels';
import { cn } from '@/lib/utils';
import type { PerfumeSummary } from '@/types/catalog';
import { PerfumePlaceholder } from './PerfumePlaceholder';

const MAX_FAMILY_CHIPS = 3;

interface PerfumeCardProps {
  perfume: PerfumeSummary;
}

// Sem fotos por enquanto (image_path nulo por direitos de imagem): o placeholder usa a primeira
// família da lista (a função devolve na ordem do enum) e nenhum logo.
export function PerfumeCard({ perfume }: PerfumeCardProps) {
  const mainFamily = perfume.families[0];
  const meta = [GENDER_LABELS[perfume.gender], perfume.releaseYear?.toString()]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-card',
        'transition-transform duration-150 ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        'has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring'
      )}
    >
      <Link to={`/perfumes/${perfume.slug}`} className="flex flex-1 flex-col outline-none">
        <PerfumePlaceholder family={mainFamily} className="aspect-[4/3]" />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {perfume.brandName}
          </p>
          <h2 className="font-heading text-xl leading-tight font-medium">{perfume.name}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="concentration">{CONCENTRATION_LABELS[perfume.concentration]}</Chip>
            <span className="text-sm text-muted-foreground">{meta}</span>
          </div>
          {perfume.families.length > 0 && (
            <ul aria-label="Famílias olfativas" className="mt-auto flex flex-wrap gap-1.5 pt-2">
              {perfume.families.slice(0, MAX_FAMILY_CHIPS).map((family) => (
                <li key={family}>
                  <Chip family={family}>{FAMILY_LABELS[family]}</Chip>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Link>
      <div className="px-4 pb-4">
        <CollectionToggle perfume={perfume} className="w-full" />
      </div>
    </article>
  );
}
