import { Check, ChevronDown, Heart, Plus, Trash2, type LucideIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverGlowButton } from '@/components/ui/hover-glow-button';
import { useAuth } from '@/hooks/useAuth';
import {
  COLLECTION_STATUS_LABELS,
  useCollectionStatus,
  useRemoveFromCollection,
  useSetCollectionStatus,
} from '@/hooks/useCollection';
import { buildLoginPath } from '@/lib/redirect';
import type { PerfumeSummary } from '@/types/catalog';
import type { CollectionStatus } from '@/types/collection';

interface CollectionToggleProps {
  perfume: PerfumeSummary;
  className?: string;
}

const STATUS_ICONS: Record<CollectionStatus, LucideIcon> = { owned: Check, wanted: Heart };

const isStatus = (value: string): value is CollectionStatus =>
  value === 'owned' || value === 'wanted';

// Três estados (nenhum, Tenho, Quero) num botão só. Visitante vai para o login e volta aqui.
// O nome do perfume entra só para leitores de tela: vários cards têm o mesmo botão na página.
export function CollectionToggle({ perfume, className }: CollectionToggleProps) {
  const { status: authStatus } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const current = useCollectionStatus(perfume.id) ?? null;
  const setStatus = useSetCollectionStatus();
  const remove = useRemoveFromCollection();

  const Icon = current ? STATUS_ICONS[current] : Plus;
  const label = current ? COLLECTION_STATUS_LABELS[current] : 'Adicionar à Coleção';
  const content = (
    <>
      <Icon className="size-4 shrink-0" aria-hidden />
      <span>
        {label}
        <span className="sr-only">: {perfume.name}</span>
      </span>
    </>
  );

  if (authStatus !== 'authenticated') {
    const handleLogin = () =>
      void navigate(buildLoginPath(`${location.pathname}${location.search}${location.hash}`));
    return (
      <HoverGlowButton
        className={className}
        disabled={authStatus === 'loading'}
        onClick={handleLogin}
      >
        {content}
      </HoverGlowButton>
    );
  }

  const handleStatusChange = (value: string) => {
    if (isStatus(value) && value !== current) setStatus.mutate({ perfume, status: value });
  };
  const handleRemove = () => remove.mutate({ perfume });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HoverGlowButton className={className}>
          {content}
          <ChevronDown className="size-4 shrink-0" aria-hidden />
        </HoverGlowButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent aria-label={`Coleção: ${perfume.name}`}>
        <DropdownMenuRadioGroup value={current ?? ''} onValueChange={handleStatusChange}>
          <DropdownMenuRadioItem value="owned">
            {COLLECTION_STATUS_LABELS.owned}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="wanted">
            {COLLECTION_STATUS_LABELS.wanted}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        {current && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleRemove}>
              <Trash2 className="size-4" aria-hidden />
              Remover da coleção
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
