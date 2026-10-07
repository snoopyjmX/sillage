import { Link } from 'react-router-dom';
import { PerfumePlaceholder } from '@/components/perfume/PerfumePlaceholder';
import { PerfumeImage } from '@/components/perfume/PerfumeImage';
import { BlurFade } from '@/components/ui/blur-fade';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Meter } from '@/components/ui/meter';
import { Rating } from '@/components/ui/rating';
import { Skeleton } from '@/components/ui/skeleton';
import { NO_CLIMATE_LABEL, NO_REVIEWS_LABEL } from '@/constants/climate';
import { CONCENTRATION_LABELS, POSITION_LABELS } from '@/constants/labels';
import type { SuggestionView } from '@/hooks/useDailySuggestion';
import { formatDecimal } from '@/lib/format';

interface DailySuggestionCardProps {
  suggestion: SuggestionView;
  // Já é o Perfume do Dia de hoje
  isWornToday: boolean;
  // Está na coleção como "Tenho": só assim pode virar Perfume do Dia (RN06)
  isOwned: boolean;
  isWearing: boolean;
  onWear: () => void;
}

// Sugestão do dia (RN10): imagem, notas por posição, medidores e as duas ações. Só apresenta.
export function DailySuggestionCard({
  suggestion,
  isWornToday,
  isOwned,
  isWearing,
  onWear,
}: DailySuggestionCardProps) {
  const { perfume, notes, longevity, projection, fit } = suggestion;
  return (
    <BlurFade inView>
      <article
        aria-label="Sugestão do dia"
        className="grid overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-floating md:grid-cols-[2fr_3fr]"
      >
        <div className="grid aspect-[4/3] place-items-center bg-accent md:aspect-auto md:min-h-96">
          <PerfumeImage
            key={perfume.imageUrl}
            url={perfume.imageUrl}
            variant="medium"
            alt={`Frasco do perfume ${perfume.name}, ${perfume.brandName}`}
            width={640}
            height={640}
            priority
            className="size-full object-contain p-6"
            fallback={
              <PerfumePlaceholder
                family={perfume.notes[0]?.family}
                showIcon
                className="size-full"
              />
            }
          />
        </div>
        <div className="flex flex-col gap-4 p-6 md:p-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Sugestão do dia · {perfume.brandName}
            </h2>
            <h3 className="font-heading text-3xl leading-tight font-medium md:text-4xl">
              {perfume.name}
            </h3>
            <div>
              <Chip variant="concentration">{CONCENTRATION_LABELS[perfume.concentration]}</Chip>
            </div>
            {perfume.description && (
              <p className="line-clamp-3 text-sm text-text-secondary">{perfume.description}</p>
            )}
          </div>

          {notes.length > 0 && (
            <dl className="flex flex-col gap-2">
              {notes.map(({ position, notes: group }) => (
                <div key={position} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <dt className="w-16 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    {POSITION_LABELS[position]}
                  </dt>
                  <dd>
                    <ul
                      aria-label={`Notas de ${POSITION_LABELS[position].toLowerCase()}`}
                      className="flex flex-wrap gap-1.5"
                    >
                      {group.map((note) => (
                        <li key={note.slug}>
                          <Chip>{note.name}</Chip>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Fixação</span>
              {longevity === null ? (
                <span className="text-sm font-medium">{NO_REVIEWS_LABEL}</span>
              ) : (
                <Rating readOnly label="Fixação" value={longevity} showValue />
              )}
            </div>
            {projection.average === null ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-muted-foreground">Rastro</span>
                <span className="text-sm font-medium">{projection.label}</span>
              </div>
            ) : (
              <Meter
                label="Rastro"
                value={projection.average}
                min={1}
                max={5}
                valueText={`${projection.label} (${formatDecimal(projection.average)} de 5)`}
              />
            )}
            {fit === null ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-muted-foreground">Clima adequado</span>
                <span className="text-sm font-medium">{NO_CLIMATE_LABEL}</span>
              </div>
            ) : (
              <Meter label="Clima adequado" value={fit} valueText={`${fit}%`} />
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              onClick={onWear}
              disabled={isWornToday || !isOwned || isWearing}
              aria-busy={isWearing}
            >
              {isWornToday
                ? 'Você já veste hoje'
                : !isOwned
                  ? 'Adicione a Tenho para vestir'
                  : isWearing
                    ? 'Salvando…'
                    : 'Vestir hoje'}
            </Button>
            <Button asChild variant="outline">
              <Link to={`/perfumes/${perfume.slug}`}>Ver detalhes</Link>
            </Button>
          </div>
        </div>
      </article>
    </BlurFade>
  );
}

// Mesmas dimensões do card, para não deslocar o layout
export function DailySuggestionSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando a sugestão do dia"
      className="grid overflow-hidden rounded-2xl border bg-card shadow-floating md:grid-cols-[2fr_3fr]"
    >
      <Skeleton className="aspect-[4/3] w-full rounded-none md:aspect-auto md:min-h-96" />
      <div className="flex flex-col gap-4 p-6 md:p-8">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-1.5">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-32" />
        </div>
      </div>
    </div>
  );
}
