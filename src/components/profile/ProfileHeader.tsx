import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileAvatar } from './ProfileAvatar';

interface ProfileHeaderProps {
  initials: string;
  displayName: string;
  timezone: string;
  email: string;
  signingOut: boolean;
  onSignOut: () => void;
}

export function ProfileHeaderSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando o perfil" className="flex gap-4">
      <Skeleton className="size-16 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2 py-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
    </div>
  );
}

// Cabeçalho: avatar de iniciais, nome de exibição, fuso e e-mail. Só apresenta.
export function ProfileHeader({
  initials,
  displayName,
  timezone,
  email,
  signingOut,
  onSignOut,
}: ProfileHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <ProfileAvatar initials={initials} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="truncate font-heading text-2xl leading-tight font-medium">
            {displayName}
          </h2>
          <p className="text-sm text-muted-foreground">Fuso: {timezone}</p>
          <p className="truncate text-sm text-muted-foreground">
            Você entrou como <span className="font-medium text-foreground">{email}</span>.
          </p>
        </div>
      </div>
      <Button variant="outline" onClick={onSignOut} aria-busy={signingOut || undefined}>
        <LogOut aria-hidden />
        {signingOut ? 'Saindo…' : 'Sair'}
      </Button>
    </header>
  );
}
