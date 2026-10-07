import { UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DangerZone } from '@/components/profile/DangerZone';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ProfileHeader, ProfileHeaderSkeleton } from '@/components/profile/ProfileHeader';
import { ProfileStats, ProfileStatsSkeleton } from '@/components/profile/ProfileStats';
import { SeoHead } from '@/components/seo/SeoHead';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { BlurFade } from '@/components/ui/blur-fade';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/constants/errors';
import { useAuth } from '@/hooks/useAuth';
import { useSignOut } from '@/hooks/useAuthActions';
import { useProfile, useRemoveAvatar, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { getInitials } from '@/lib/profile';
import { toast } from '@/lib/toast';
import { listTimezones } from '@/schemas/profile';

const TIMEZONES = listTimezones();

const FormSkeleton = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Carregando o formulário"
    className="flex flex-col gap-4"
  >
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-11 w-44" />
  </div>
);

// Rota privada (RequireAuth). Cabeçalho, resumo, formulário e zona de perigo; cada bloco
// assíncrono tem os seus 4 estados. Nenhuma regra de negócio aqui.
export default function ProfilePage() {
  const { user } = useAuth();
  const signOut = useSignOut();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const summary = useProfileStats();

  const handleSignOut = () =>
    signOut.mutate(undefined, { onError: (error) => toast.error(getErrorMessage(error)) });

  const data = profile.data ?? null;
  const stats = summary.stats;
  const hasNothing = stats !== null && stats.owned + stats.wanted + stats.memorialDays === 0;

  return (
    <>
      <SeoHead title="Perfil" description="Sua conta no Sillage." />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pt-4 md:pt-10">
        <h1 className="font-heading text-3xl font-medium md:text-4xl">Perfil</h1>

        <AsyncBoundary
          status={profile.status}
          isEmpty={data === null}
          loading={
            <div className="flex flex-col gap-8">
              <ProfileHeaderSkeleton />
              <FormSkeleton />
            </div>
          }
          empty={
            <EmptyState
              icon={UserRound}
              title="Não encontramos o seu perfil"
              description="Saia e entre de novo para recarregar a sua conta."
              action={
                <Button variant="outline" onClick={handleSignOut}>
                  Sair
                </Button>
              }
            />
          }
          onRetry={() => void profile.refetch()}
          errorTitle="Não foi possível carregar o perfil"
          errorDescription={profile.error ? getErrorMessage(profile.error) : undefined}
          offlineDescription="Conecte-se à internet para ver e editar o seu perfil."
        >
          {data && (
            <div className="flex flex-col gap-8">
              <BlurFade>
                <ProfileHeader
                  initials={getInitials(data.displayName)}
                  avatarUrl={data.avatarUrl}
                  uploadingAvatar={uploadAvatar.isPending || removeAvatar.isPending}
                  onUploadAvatar={(file) => uploadAvatar.mutate(file)}
                  onRemoveAvatar={() => removeAvatar.mutate()}
                  displayName={data.displayName}
                  timezone={data.timezone}
                  email={user?.email ?? ''}
                  signingOut={signOut.isPending}
                  onSignOut={handleSignOut}
                />
              </BlurFade>

              <BlurFade delay={0.04}>
                <section aria-labelledby="summary-title" className="flex flex-col gap-3">
                  <h2 id="summary-title" className="font-heading text-xl font-medium">
                    Resumo
                  </h2>
                  <AsyncBoundary
                    status={summary.status}
                    isEmpty={hasNothing}
                    loading={<ProfileStatsSkeleton />}
                    empty={
                      <EmptyState
                        title="Sua coleção e o memorial ainda estão vazios"
                        description="Marque perfumes como “Tenho” ou “Quero” e escolha o Perfume do Dia para ver o resumo aqui."
                        action={
                          <Button asChild>
                            <Link to="/catalog">Explorar o catálogo</Link>
                          </Button>
                        }
                      />
                    }
                    onRetry={summary.retry}
                    errorTitle="Não foi possível carregar o resumo"
                    offlineDescription="Conecte-se à internet para ver o resumo."
                  >
                    {stats && <ProfileStats {...stats} />}
                  </AsyncBoundary>
                </section>
              </BlurFade>

              <BlurFade delay={0.08}>
                <section aria-labelledby="edit-title" className="flex flex-col gap-3">
                  <h2 id="edit-title" className="font-heading text-xl font-medium">
                    Seus dados
                  </h2>
                  <ProfileForm
                    values={{ displayName: data.displayName, timezone: data.timezone }}
                    timezones={TIMEZONES}
                    saving={updateProfile.isPending}
                    onSave={(values) => updateProfile.mutate(values)}
                  />
                </section>
              </BlurFade>

              <BlurFade delay={0.12}>
                <DangerZone />
              </BlurFade>
            </div>
          )}
        </AsyncBoundary>
      </div>
    </>
  );
}
