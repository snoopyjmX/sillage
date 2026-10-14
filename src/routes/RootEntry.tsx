// Rota "/": mesma URL, duas telas. Visitante vê a Landing; logado vê a Home. Enquanto a sessão
// carrega, mostra o esqueleto (AuthPending): nunca pisca a Landing para quem já está logado.
import { lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { mayHaveSession } from '@/lib/sessionHint';
import { AuthPending } from './AuthPending';
import { PageFallback } from './PageFallback';

// Os layouts também são lazy: o visitante não baixa o AppShell (Nez, Footer) e o logado não baixa o PublicLayout
const loadAppShell = () => import('@/components/layout/AppShell');
const loadPublicLayout = () => import('@/components/layout/PublicLayout');
const loadHomePage = () => import('@/pages/HomePage');
const loadLandingPage = () => import('@/pages/LandingPage');

const AppShell = lazy(() => loadAppShell().then((module) => ({ default: module.AppShell })));
const PublicLayout = lazy(() =>
  loadPublicLayout().then((module) => ({ default: module.PublicLayout }))
);
const HomePage = lazy(loadHomePage);
const LandingPage = lazy(loadLandingPage);

// A página só pede o layout depois de montado: sem isto, o layout e a Landing viram duas etapas
// em cascata. O visitante (sem sessão guardada) já os baixa em paralelo, assim que este módulo roda.
if (!mayHaveSession()) {
  void loadPublicLayout();
  void loadLandingPage();
}

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
