import { Skeleton } from '@/components/ui/skeleton';
import { formatInteger } from '@/lib/format';

interface StatCardProps {
  label: string;
  value: number;
  hint: string;
}

const StatCard = ({ label, value, hint }: StatCardProps) => (
  <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-subtle">
    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
    <dd className="flex flex-col gap-1">
      <span className="font-heading text-3xl leading-tight font-medium text-foreground">
        {formatInteger(value)}
      </span>
      <span className="text-sm text-muted-foreground">{hint}</span>
    </dd>
  </div>
);

export function ProfileStatsSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando o resumo"
      className="grid gap-3 sm:grid-cols-3"
    >
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}

interface ProfileStatsProps {
  owned: number;
  wanted: number;
  memorialDays: number;
}

// Cartões de resumo: números reais da coleção e do memorial. Só apresenta.
export function ProfileStats({ owned, wanted, memorialDays }: ProfileStatsProps) {
  return (
    <dl aria-label="Resumo" className="grid gap-3 sm:grid-cols-3">
      <StatCard label="Tenho" value={owned} hint={owned === 1 ? 'perfume' : 'perfumes'} />
      <StatCard label="Quero" value={wanted} hint={wanted === 1 ? 'perfume' : 'perfumes'} />
      <StatCard
        label="No memorial"
        value={memorialDays}
        hint={memorialDays === 1 ? 'dia registrado' : 'dias registrados'}
      />
    </dl>
  );
}
