import { Link } from 'react-router-dom';
import { BlurFade } from '@/components/ui/blur-fade';
import { Chip } from '@/components/ui/chip';
import { PerfumePlaceholder } from '@/components/perfume/PerfumePlaceholder';
import { CONCENTRATION_LABELS, FAMILY_LABELS, GENDER_LABELS } from '@/constants/labels';
import { formatCivilDate } from '@/lib/format';
import type { DailyEntry } from '@/types/daily';

interface DailyHighlightProps {
  entry: DailyEntry;
}

// O Perfume do Dia em destaque: maior que um card de catálogo, mesma linguagem (placeholder pela
// primeira família, chips, link para os detalhes).
export function DailyHighlight({ entry }: DailyHighlightProps) {
  const { perfume } = entry;
  const meta = [GENDER_LABELS[perfume.gender], perfume.releaseYear?.toString()]
    .filter(Boolean)
    .join(' · ');

  return (
    <BlurFade inView>
      <article
        aria-label="Perfume do Dia"
        className="grid overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-floating md:grid-cols-2"
      >
        <PerfumePlaceholder
          family={perfume.families[0]}
          showIcon
          className="aspect-[4/3] md:aspect-auto md:min-h-80"
        />
        <div className="flex flex-col justify-center gap-3 p-6 md:p-10">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {perfume.brandName}
          </p>
          <h3 className="font-heading text-3xl leading-tight font-medium md:text-4xl">
            {perfume.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="concentration">{CONCENTRATION_LABELS[perfume.concentration]}</Chip>
            <span className="text-sm text-muted-foreground">{meta}</span>
          </div>
          {perfume.families.length > 0 && (
            <ul aria-label="Famílias olfativas" className="flex flex-wrap gap-1.5">
              {perfume.families.map((family) => (
                <li key={family}>
                  <Chip family={family}>{FAMILY_LABELS[family]}</Chip>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-muted-foreground">
            Escolhido em {formatCivilDate(entry.date)}.
          </p>
          <Link
            to={`/perfumes/${perfume.slug}`}
            className="w-fit rounded-lg text-base font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Ver detalhes de {perfume.name}
          </Link>
        </div>
      </article>
    </BlurFade>
  );
}
