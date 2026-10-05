import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Navbar } from './Navbar';

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
      >
        Ir para o conteúdo
      </a>
      <Navbar />
      {/* pb-24: espaço para a navegação inferior (celular) + área segura */}
      <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 md:pb-10">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
