import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, CalendarHeart, Download, Share2 } from 'lucide-react';
import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PerfumeImage } from '@/components/perfume/PerfumeImage';
import { PerfumePlaceholder } from '@/components/perfume/PerfumePlaceholder';
import { PerfumeStage } from '@/components/perfume/PerfumeStage';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { SubmitButton } from '@/components/ui/submit-button';
import { FAMILY_LABELS } from '@/constants/labels';
import { SEASON_LABELS, SEASON_MONTHS, SEASONS } from '@/constants/recap';
import { formatCount, formatInteger } from '@/lib/format';
import { consistencyPercent, familyShift } from '@/lib/recap';
import { transitions } from '@/lib/motion';
import { canShareImages } from '@/lib/shareFile';
import type { AnnualRecap, RecapPerfume } from '@/types/recap';

// Deslocamento horizontal da troca de lâmina (px); com reduced motion a troca é só de opacidade
const SLIDE_OFFSET = 24;

const SLIDE_COUNT = 5;

function SlideShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-96 flex-col justify-center gap-5">
      <h2 className="font-heading text-2xl leading-tight font-medium md:text-3xl">{title}</h2>
      {children}
    </div>
  );
}

function PerfumeLink({ perfume }: { perfume: RecapPerfume }) {
  return (
    <Link
      to={`/perfumes/${perfume.slug}`}
      className="rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {perfume.name}
    </Link>
  );
}

function DaysSlide({ recap }: { recap: AnnualRecap }) {
  return (
    <SlideShell title={`Você vestiu perfume em ${formatCount(recap.daysWorn, 'dia', 'dias')}`}>
      <p className="font-heading text-6xl leading-none font-medium text-primary md:text-7xl">
        {consistencyPercent(recap.consistency)}%
      </p>
      <p className="max-w-prose text-base text-text-secondary">
        {`Em ${recap.year}, isso é ${consistencyPercent(recap.consistency)}% dos ${formatInteger(recap.daysElapsed)} dias do ano até aqui. Um ritmo que diz muito sobre você.`}
      </p>
    </SlideShell>
  );
}

function SignatureSlide({ recap }: { recap: AnnualRecap }) {
  const { signature } = recap;
  if (!signature) return null;
  return (
    <SlideShell title="Sua fragrância assinatura">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <PerfumeStage className="aspect-[4/5] w-full max-w-48 shrink-0 overflow-hidden rounded-xl border">
          <PerfumeImage
            key={signature.imageUrl}
            url={signature.imageUrl}
            variant="medium"
            alt={`Frasco do perfume ${signature.name}, ${signature.brandName}`}
            width={320}
            height={400}
            className="size-full object-contain p-2"
            fallback={<PerfumePlaceholder showIcon className="size-full" />}
          />
        </PerfumeStage>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium tracking-wider text-text-secondary uppercase">
            {signature.brandName}
          </p>
          <p className="font-heading text-3xl leading-tight font-medium">
            <PerfumeLink perfume={signature} />
          </p>
          <p className="text-base text-text-secondary">
            {`Foi o seu perfume do dia em ${formatCount(signature.days, 'dia', 'dias')}.`}
          </p>
        </div>
      </div>
    </SlideShell>
  );
}

function SeasonsSlide({ recap }: { recap: AnnualRecap }) {
  return (
    <SlideShell title="Suas quatro estações">
      <ul className="flex flex-col gap-3">
        {SEASONS.map((season) => {
          const perfume = recap.seasons[season];
          return (
            <li key={season} className="flex flex-col gap-0.5 border-b pb-3 last:border-b-0">
              <span className="text-sm text-text-secondary">
                {SEASON_LABELS[season]} · {SEASON_MONTHS[season]}
              </span>
              <span className="font-heading text-xl font-medium">
                {perfume ? (
                  <>
                    <PerfumeLink perfume={perfume} />
                    <span className="text-sm font-normal text-text-secondary">
                      {` · ${formatCount(perfume.days, 'dia', 'dias')}`}
                    </span>
                  </>
                ) : (
                  <span className="text-base font-normal text-text-secondary">Sem registros</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </SlideShell>
  );
}

function NoteSlide({ recap }: { recap: AnnualRecap }) {
  const { topNote } = recap;
  const shift = familyShift(recap.families);
  return (
    <SlideShell title="A nota que definiu o seu ano">
      {topNote && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-heading text-5xl leading-none font-medium text-primary">
            {topNote.name}
          </p>
          <Chip family={topNote.family}>{FAMILY_LABELS[topNote.family]}</Chip>
        </div>
      )}
      {shift.first && shift.second && (
        <p className="max-w-prose text-base text-text-secondary">
          {shift.changed
            ? `Seu gosto caminhou: no 1º semestre predominou o ${FAMILY_LABELS[shift.first].toLowerCase()}; no 2º, o ${FAMILY_LABELS[shift.second].toLowerCase()}.`
            : `Seu gosto foi constante: o ${FAMILY_LABELS[shift.first].toLowerCase()} predominou nos dois semestres.`}
        </p>
      )}
    </SlideShell>
  );
}

interface SummarySlideProps {
  recap: AnnualRecap;
  onShare: () => void;
  isSharing: boolean;
}

function SummarySlide({ recap, onShare, isSharing }: SummarySlideProps) {
  // Sem painel de compartilhar no aparelho, o botão baixa a imagem (e diz isso)
  const canShare = canShareImages();
  return (
    <SlideShell title={`Seu ${recap.year} em perfumes`}>
      <dl className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-0.5">
          <dt className="text-sm text-text-secondary">Dias com perfume</dt>
          <dd className="font-heading text-2xl font-medium">{formatInteger(recap.daysWorn)}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-sm text-text-secondary">Do ano</dt>
          <dd className="font-heading text-2xl font-medium">
            {consistencyPercent(recap.consistency)}%
          </dd>
        </div>
        {recap.signature && (
          <div className="col-span-2 flex flex-col gap-0.5">
            <dt className="text-sm text-text-secondary">Assinatura</dt>
            <dd className="font-heading text-2xl font-medium">{recap.signature.name}</dd>
          </div>
        )}
        {recap.topNote && (
          <div className="col-span-2 flex flex-col gap-0.5">
            <dt className="text-sm text-text-secondary">Nota do ano</dt>
            <dd className="font-heading text-2xl font-medium">{recap.topNote.name}</dd>
          </div>
        )}
      </dl>
      <div className="flex flex-col gap-2 sm:flex-row">
        <SubmitButton
          loading={isSharing}
          loadingLabel="Gerando a imagem…"
          onClick={onShare}
          className="h-auto min-h-11 w-full whitespace-normal py-2 sm:w-auto"
        >
          {canShare ? <Share2 aria-hidden /> : <Download aria-hidden />}
          {canShare ? 'Compartilhar' : 'Baixar imagem'}
        </SubmitButton>
        <Button
          asChild
          variant="outline"
          className="h-auto min-h-11 w-full whitespace-normal py-2 sm:w-auto"
        >
          <Link to="/memorial">
            <CalendarHeart aria-hidden />
            Ver o Memorial
          </Link>
        </Button>
      </div>
    </SlideShell>
  );
}

interface RecapSlidesProps {
  recap: AnnualRecap;
  onShare: () => void;
  isSharing: boolean;
}

// As 5 lâminas da retrospectiva: dias, assinatura, estações, nota do ano e encerramento. Uma por vez,
// com troca por opacidade e deslocamento (só transform e opacity; sem deslocamento em reduced motion).
export function RecapSlides({ recap, onShare, isSharing }: RecapSlidesProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const go = (next: number) => {
    if (next < 0 || next >= SLIDE_COUNT) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight') go(index + 1);
    if (event.key === 'ArrowLeft') go(index - 1);
  };

  const slides = [
    <DaysSlide key="days" recap={recap} />,
    <SignatureSlide key="signature" recap={recap} />,
    <SeasonsSlide key="seasons" recap={recap} />,
    <NoteSlide key="note" recap={recap} />,
    <SummarySlide key="summary" recap={recap} onShare={onShare} isSharing={isSharing} />,
  ];
  const slide = slides[index];

  return (
    <section
      aria-roledescription="carrossel"
      aria-label={`Seu ano em perfumes, ${recap.year}`}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-4"
    >
      <div
        role="group"
        aria-roledescription="lâmina"
        aria-label={`Lâmina ${index + 1} de ${SLIDE_COUNT}`}
        aria-live="polite"
        className="overflow-hidden rounded-2xl border bg-card p-5 text-card-foreground shadow-card md:p-8"
      >
        {reduceMotion ? (
          <div key={index}>{slide}</div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, x: SLIDE_OFFSET * direction }}
              animate={{ opacity: 1, x: 0, transition: transitions.page }}
              exit={{ opacity: 0, x: -SLIDE_OFFSET * direction, transition: transitions.exit }}
            >
              {slide}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <nav aria-label="Lâminas" className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => go(index - 1)} disabled={index === 0}>
          <ArrowLeft aria-hidden />
          Anterior
        </Button>
        <p aria-hidden className="text-sm text-text-secondary">
          {index + 1} de {SLIDE_COUNT}
        </p>
        <Button
          variant="outline"
          onClick={() => go(index + 1)}
          disabled={index === SLIDE_COUNT - 1}
        >
          Próxima
          <ArrowRight aria-hidden />
        </Button>
      </nav>
    </section>
  );
}
