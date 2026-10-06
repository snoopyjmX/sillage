// Layout das telas abertas a visitantes (Landing, login, cadastro, recuperação de senha).
// Pequeno de propósito: sem Nez, sem navegação privada. Barra com a marca, a pílula em modo
// "landing" e o tema; abaixo, o Footer.
import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { OFFLINE_PUBLIC_BANNER_TEXT } from '@/constants/offline';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { OfflineBanner } from './OfflineBanner';

// `children` serve à rota "/" (Landing do visitante); nas demais, o conteúdo vem do <Outlet />.
export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
      >
        Ir para o conteúdo
      </a>
      <Navbar mode="landing" />
      <OfflineBanner text={OFFLINE_PUBLIC_BANNER_TEXT} />
      <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-8">
        {children ?? <Outlet />}
      </main>
      <Footer className="pb-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
