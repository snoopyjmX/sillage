import { Fingerprint } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FamilyBar } from '@/components/perfume/FamilyBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { dnaFootnote, dnaShares, progressText, wishLine } from '@/lib/olfactoryDna';
import type { OlfactoryDna } from '@/types/dna';

export function OlfactoryDnaSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando o seu DNA olfativo">
      <Skeleton className="h-52 w-full rounded-xl" />
    </div>
  );
}

interface OlfactoryDnaEmptyProps {
  missing: number;
}

// Menos perfumes que o mínimo (D3): o vazio mostra o progresso e convida a explorar
export function OlfactoryDnaEmpty({ missing }: OlfactoryDnaEmptyProps) {
  return (
    <EmptyState
      icon={Fingerprint}
      title={progressText(missing)}
      description="O DNA mistura os perfumes em “Tenho” e os dias do memorial."
      action={
        <Button asChild>
          <Link to="/catalog">Explorar o catálogo</Link>
        </Button>
      }
    />
  );
}

interface OlfactoryDnaCardProps {
  dna: OlfactoryDna;
}

// Perfil sensorial: famílias que mais aparecem, notas recorrentes e, às vezes, para onde os desejos
// apontam. Só apresenta; as regras vivem em lib/olfactoryDna.ts.
export function OlfactoryDnaCard({ dna }: OlfactoryDnaCardProps) {
  const wish = wishLine(dna);
  return (
    <Card className="gap-5">
      <FamilyBar shares={dnaShares(dna)} />

      {dna.topNotes.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Notas que mais aparecem
          </h3>
          <ul aria-label="Notas que mais aparecem" className="flex flex-wrap gap-x-1.5">
            {dna.topNotes.map((note) => (
              <li key={note.slug}>
                <Link
                  to={`/catalog?notes=${encodeURIComponent(note.slug)}`}
                  className="inline-flex min-h-11 items-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Chip>{note.name}</Chip>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {wish && <p className="text-sm font-medium">{wish}</p>}

      <p className="text-sm text-muted-foreground">{dnaFootnote(dna)}</p>
    </Card>
  );
}
