import { Link } from 'react-router-dom';
import { BlurFade } from '@/components/ui/blur-fade';
import { PerfumeImage } from '@/components/perfume/PerfumeImage';
import { PerfumePlaceholder } from '@/components/perfume/PerfumePlaceholder';
import { PerfumeStage } from '@/components/perfume/PerfumeStage';
import { STAGGER_MAX_ITEMS } from '@/lib/motion';
import { formatCivilDate } from '@/lib/format';
import type { DailyEntry } from '@/types/daily';

interface DailyHistoryProps {
  entries: DailyEntry[];
}

const BLUR_FADE_STEP = 0.1;

// Dias anteriores num grid compacto: cada item é um link para o perfume, com a data do dia.
export function DailyHistory({ entries }: DailyHistoryProps) {
  return (
    <ul
      aria-label="Perfumes dos dias anteriores"
      className="grid grid-cols-1 gap-3 min-[30rem]:grid-cols-2 lg:grid-cols-3"
    >
      {entries.map((entry, index) => (
        <li key={entry.date}>
          <BlurFade delay={BLUR_FADE_STEP * Math.min(index, STAGGER_MAX_ITEMS)} inView>
            <Link
              to={`/perfumes/${entry.perfume.slug}`}
              className="flex items-center gap-3 rounded-xl border bg-card p-3 text-card-foreground shadow-subtle outline-none transition-transform duration-150 ease-out hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <PerfumeStage className="size-16 shrink-0 overflow-hidden rounded-lg">
                <PerfumeImage
                  key={entry.perfume.imageUrl}
                  url={entry.perfume.imageUrl}
                  variant="thumb"
                  alt=""
                  width={64}
                  height={64}
                  className="size-full object-contain p-1"
                  fallback={
                    <PerfumePlaceholder family={entry.perfume.families[0]} className="size-full" />
                  }
                />
              </PerfumeStage>
              <span className="flex min-w-0 flex-col">
                <time dateTime={entry.date} className="text-xs text-muted-foreground">
                  {formatCivilDate(entry.date)}
                </time>
                <span className="font-heading truncate text-lg leading-tight font-medium">
                  {entry.perfume.name}
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {entry.perfume.brandName}
                </span>
              </span>
            </Link>
          </BlurFade>
        </li>
      ))}
    </ul>
  );
}
