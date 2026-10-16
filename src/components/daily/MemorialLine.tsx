import { PerfumeImage } from '@/components/perfume/PerfumeImage';
import { PerfumePlaceholder } from '@/components/perfume/PerfumePlaceholder';
import { PolaroidLineCarousel, type PolaroidItem } from '@/components/ui/polaroid-line-carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCivilDate } from '@/lib/format';
import type { DailyEntry } from '@/types/daily';

interface MemorialLineProps {
  entries: readonly DailyEntry[];
  // Ex.: "outubro de 2026": entra no rótulo do carrossel
  monthLabel: string;
}

const toItem = ({ date, perfume }: DailyEntry): PolaroidItem => ({
  id: date,
  title: perfume.name,
  caption: `${formatCivilDate(date)} · ${perfume.brandName}`,
  href: `/perfumes/${perfume.slug}`,
  media: (
    <PerfumeImage
      key={perfume.imageUrl}
      url={perfume.imageUrl}
      variant="medium"
      alt={`Frasco do perfume ${perfume.name}, ${perfume.brandName}`}
      width={208}
      height={208}
      className="size-full object-contain p-2"
      fallback={<PerfumePlaceholder family={perfume.families[0]} showIcon className="size-full" />}
    />
  ),
});

// Visão alternativa do memorial: os dias do mês como fotos presas num varal, do mais antigo ao
// mais recente. Só apresenta: tudo chega pronto por props.
export function MemorialLine({ entries, monthLabel }: MemorialLineProps) {
  const ordered = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <PolaroidLineCarousel
      label={`Varal de memórias de ${monthLabel}`}
      items={ordered.map(toItem)}
    />
  );
}

// Mesma silhueta do varal (cinco fotos), para não deslocar a tela
export function MemorialLineSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando o varal"
      className="flex gap-4 overflow-hidden px-4 pt-6"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-72 w-44 shrink-0 rounded-md sm:w-52" />
      ))}
    </div>
  );
}
