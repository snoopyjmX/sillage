// Rota "/": mesma URL, duas telas. Visitante vê a Landing; logado vê a Home. Enquanto a sessão
// carrega, mostra o esqueleto (AuthPending): nunca pisca a Landing para quem já está logado.
import { lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthPending } from './AuthPending';
import { PageFallback } from './PageFallback';

// Os layouts também são lazy: o visitante não baixa o AppShell (Nez, Footer) e o logado não baixa o PublicLayout
const AppShell = lazy(() =>
  import('@/components/layout/AppShell').then((module) => ({ default: module.AppShell }))
);
const PublicLayout = lazy(() =>
  import('@/components/layout/PublicLayout').then((module) => ({ default: module.PublicLayout }))
);
const HomePage = lazy(() => import('@/pages/HomePage'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));

export function RootEntry() {
  const { status } = useAuth();

  if (status === 'loading') return <AuthPending />;
  if (status === 'authenticated') {
    return (
      <Suspense fallback={<PageFallback />}>
        <AppShell>
          <HomePage />
        </AppShell>
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<PageFallback />}>
      <PublicLayout>
        <LandingPage />
      </PublicLayout>
    </Suspense>
  );
}
