import type { ReactNode } from 'react';
import { FamilyBar } from '@/components/perfume/FamilyBar';
import { Meter } from '@/components/ui/meter';
import { Rating } from '@/components/ui/rating';
import { NO_CLIMATE_LABEL, NO_REVIEWS_LABEL } from '@/constants/climate';
import { POSITION_LABELS } from '@/constants/labels';
import type { CompareAffinity, CompareColumnView } from '@/hooks/useCompareColumn';
import { AFFINITY_LABELS } from '@/lib/affinity';
import { formatDecimal, formatPriceCents } from '@/lib/format';

interface CompareTableProps {
  left: CompareColumnView;
  right: CompareColumnView;
}

// Uma linha da comparação: o título (h2) e as duas células lado a lado, cada uma num grupo com o
// nome do perfume (leitores de tela sabem de quem é o valor). Duas colunas até 360 px.
function Row({
  id,
  title,
  left,
  right,
}: {
  id: string;
  title: string;
  left: { name: string; content: ReactNode };
  right: { name: string; content: ReactNode };
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div role="group" aria-label={left.name} className="flex min-w-0 flex-col gap-2">
          {left.content}
        </div>
        <div role="group" aria-label={right.name} className="flex min-w-0 flex-col gap-2">
          {right.content}
        </div>
      </div>
    </section>
  );
}

const Pyramid = ({ view }: { view: CompareColumnView }) =>
  view.notes.length === 0 ? (
    <p className="text-sm text-muted-foreground">Notas ainda não cadastradas.</p>
  ) : (
    <dl className="flex flex-col gap-2">
      {view.notes.map(({ position, notes }) => (
        <div key={position}>
          <dt className="text-xs font-medium text-muted-foreground">{POSITION_LABELS[position]}</dt>
          <dd className="text-sm text-secondary-foreground">
            {notes.map((note) => note.name).join(', ')}
          </dd>
        </div>
      ))}
    </dl>
  );

const Performance = ({ view }: { view: CompareColumnView }) => (
  <>
    {view.longevity === null ? (
      <p className="text-sm font-medium">{NO_REVIEWS_LABEL}</p>
    ) : (
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Fixação</span>
        <Rating readOnly label="Fixação" value={view.longevity} showValue />
      </div>
    )}
    {view.projection.average !== null && (
      <Meter
        label="Rastro"
        value={view.projection.average}
        min={1}
        max={5}
        valueText={`${view.projection.label} (${formatDecimal(view.projection.average)} de 5)`}
      />
    )}
  </>
);

const Climate = ({ view }: { view: CompareColumnView }) =>
  view.fit === null ? (
    <p className="text-sm font-medium">{NO_CLIMATE_LABEL}</p>
  ) : (
    <Meter label="Clima adequado hoje" value={view.fit} valueText={`${view.fit}%`} />
  );

const Price = ({ view }: { view: CompareColumnView }) => {
  const { lowestPriceCents, storeName } = view.perfume;
  return lowestPriceCents === null ? (
    <p className="text-sm text-muted-foreground">Sem oferta encontrada</p>
  ) : (
    <p className="text-sm text-secondary-foreground">
      <span className="font-heading text-xl font-medium text-foreground">
        {formatPriceCents(lowestPriceCents)}
      </span>
      {storeName && <span className="block">na {storeName}</span>}
    </p>
  );
};

const AffinityCell = ({ affinity }: { affinity: CompareAffinity }) => {
  switch (affinity.kind) {
    case 'owned':
      return <p className="text-sm font-medium">Você já tem</p>;
    case 'forming':
      return <p className="text-sm text-muted-foreground">Seu DNA ainda está se formando</p>;
    case 'unknown':
      return <p className="text-sm text-muted-foreground">Sem dados para avaliar</p>;
    case 'ready':
      return (
        <>
          <p className="font-heading text-lg font-medium">
            {AFFINITY_LABELS[affinity.affinity.level]}
          </p>
          <p className="text-sm text-text-secondary">{affinity.affinity.reasons[0]}</p>
          {affinity.affinity.suggestDecant && (
            <p className="text-sm font-medium">Prove num decant antes</p>
          )}
        </>
      );
  }
};

// Comparação lado a lado de dois perfumes: só dados públicos, o clima de hoje e o DNA de quem olha.
// Sem votação nem placar (D13). Só apresenta: tudo chega pronto por props.
export function CompareTable({ left, right }: CompareTableProps) {
  const [l, r] = [left.perfume.name, right.perfume.name];
  const cells = (render: (view: CompareColumnView) => ReactNode) => ({
    left: { name: l, content: render(left) },
    right: { name: r, content: render(right) },
  });

  return (
    <div className="flex flex-col gap-8">
      <Row id="compare-pyramid" title="Pirâmide" {...cells((view) => <Pyramid view={view} />)} />
      <Row
        id="compare-families"
        title="Famílias"
        {...cells((view) => <FamilyBar shares={view.families} linkFamilies />)}
      />
      <Row
        id="compare-performance"
        title="Fixação e rastro"
        {...cells((view) => <Performance view={view} />)}
      />
      <Row
        id="compare-climate"
        title="Clima de hoje"
        {...cells((view) => <Climate view={view} />)}
      />
      <Row id="compare-price" title="Melhor preço" {...cells((view) => <Price view={view} />)} />
      <Row
        id="compare-affinity"
        title="Combina com você?"
        {...cells((view) => <AffinityCell affinity={view.affinity} />)}
      />
    </div>
  );
}
