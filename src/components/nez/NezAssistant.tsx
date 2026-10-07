import { lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';

// O drawer (Dialog, Drawer, chat) sai do pacote inicial: só carrega para quem está logado
const NezDrawer = lazy(() =>
  import('./NezDrawer').then((module) => ({ default: module.NezDrawer }))
);

// O Nez é só para quem está logado (a Edge Function também exige o JWT)
export function NezAssistant() {
  const { status } = useAuth();
  if (status !== 'authenticated') return null;
  return (
    <Suspense fallback={null}>
      <NezDrawer />
    </Suspense>
  );
}
