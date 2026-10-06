import { useAuth } from '@/hooks/useAuth';
import { NezDrawer } from './NezDrawer';

// O Nez é só para quem está logado (a Edge Function também exige o JWT)
export function NezAssistant() {
  const { status } = useAuth();
  if (status !== 'authenticated') return null;
  return <NezDrawer />;
}
