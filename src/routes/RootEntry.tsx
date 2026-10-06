// Rota "/": mesma URL, duas telas. Visitante vê a Landing; logado vê a Home. Enquanto a sessão
// carrega, mostra o esqueleto (AuthPending): nunca pisca a Landing para quem já está logado.
import { lazy, Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { useAuth } from '@/hooks/useAuth';
import { AuthPending } from './AuthPending';
import { PageFallback } from './PageFallback';

const HomePage = lazy(() => import('@/pages/HomePage'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));

export function RootEntry() {
  const { status } = useAuth();

  if (status === 'loading') return <AuthPending />;
  if (status === 'authenticated') {
    return (
      <AppShell>
        <Suspense fallback={<PageFallback />}>
          <HomePage />
        </Suspense>
      </AppShell>
    );
  }
  return (
    <PublicLayout>
      <Suspense fallback={<PageFallback />}>
        <LandingPage />
      </Suspense>
    </PublicLayout>
  );
}
