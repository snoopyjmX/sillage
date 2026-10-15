import { Share2 } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { BlurFade } from '@/components/ui/blur-fade';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { PerfumeImage } from '@/components/perfume/PerfumeImage';
import { PerfumePlaceholder } from '@/components/perfume/PerfumePlaceholder';
import { PerfumeStage } from '@/components/perfume/PerfumeStage';
import { CONCENTRATION_LABELS, FAMILY_LABELS, GENDER_LABELS } from '@/constants/labels';
import { formatCivilDate } from '@/lib/format';
import type { DailyEntry } from '@/types/daily';
import type { WeatherView } from '@/types/weather';

// O diálogo (e o canvas do card) só carrega quando alguém pede para compartilhar: fica fora do
// bundle da Home
const ShareCardDialog = lazy(async () => ({
  default: (await import('@/components/daily/ShareCardDialog')).ShareCardDialog,
}));

interface DailyHighlightProps {
  entry: DailyEntry;
  // Clima de hoje: enfeita o card de compartilhar, que sai sem ele se faltar
  weather: WeatherView;
}

// O Perfume do Dia em destaque: maior que um card de catálogo, mesma linguagem (placeholder pela
// primeira família, chips, link para os detalhes).
export function DailyHighlight({ entry, weather }: DailyHighlightProps) {
  const { perfume } = entry;
  const [shareOpen, setShareOpen] = useState(false);
  // Depois da primeira abertura segue montado, para a animação de fechar terminar
  const [shareMounted, setShareMounted] = useState(false);
  const meta = [GENDER_LABELS[perfume.gender], perfume.releaseYear?.toString()]
    .filter(Boolean)
    .join(' · ');

  return (
    <BlurFade inView>
      <article
        aria-label="Perfume do Dia"
        className="grid overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-floating md:grid-cols-2"
      >
        <PerfumeStage className="h-48 w-full sm:h-60 md:h-auto md:min-h-80">
          <PerfumeImage
            key={perfume.imageUrl}
            url={perfume.imageUrl}
            variant="medium"
            alt={`Frasco do perfume ${perfume.name}, ${perfume.brandName}`}
            width={640}
            height={800}
            className="size-full object-contain p-3"
            fallback={
              <PerfumePlaceholder family={perfume.families[0]} showIcon className="size-full" />
            }
          />
        </PerfumeStage>
        <div className="flex flex-col justify-center gap-3 p-4 sm:p-6 md:p-10">
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
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              to={`/perfumes/${perfume.slug}`}
              className="w-fit rounded-lg text-base font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Ver detalhes de {perfume.name}
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setShareMounted(true);
                setShareOpen(true);
              }}
            >
              <Share2 aria-hidden />
              Compartilhar dia
            </Button>
          </div>
        </div>
        {shareMounted && (
          <Suspense fallback={null}>
            <ShareCardDialog
              open={shareOpen}
              onOpenChange={setShareOpen}
              entry={entry}
              weather={weather}
            />
          </Suspense>
        )}
      </article>
    </BlurFade>
  );
}
