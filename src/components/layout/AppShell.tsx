import { Outlet } from 'react-router-dom';
import { NezAssistant } from '@/components/nez/NezAssistant';
import { NezProvider } from '@/contexts/NezContext';
import { Navbar } from './Navbar';

export function AppShell() {
  return (
    <NezProvider>
      <div className="flex min-h-dvh flex-col">
        <a
          href="#conteudo"
          className="sr-only rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
        >
          Ir para o conteúdo
        </a>
        <Navbar />
        <main
          id="conteudo"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]"
        >
          <Outlet />
        </main>
        <NezAssistant />
      </div>
    </NezProvider>
  );
}
