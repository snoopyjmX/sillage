// Origem: própria, inspirada na navbar do 21st.dev e reescrita com motion/react (nunca framer-motion).
// Barra superior de vidro (docs/PRODUCT.md, Seção 9): marca, pílula de navegação e tema.
// A pílula (AdaptivePillNav) vira rótulo + menu lateral abaixo de 768 px. A área segura do topo
// entra como padding.
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { AdaptivePillNav, type AdaptivePillNavMode } from '@/components/ui/adaptive-pill-nav';
import { Button } from '@/components/ui/button';
import { ThemeToggler } from '@/components/ui/theme-toggler';
import { useAuth } from '@/hooks/useAuth';
import { transitions } from '@/lib/motion';
import { InstallAppButton } from './InstallAppButton';

function Brand() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {/* Logo da marca: sem inversão de cor no escuro (distorceria a cor) */}
      <img src="/favicon-32x32.png" alt="" width={32} height={32} className="size-8" />
      <span className="font-heading text-2xl font-semibold text-primary max-[400px]:sr-only">
        Sillage
      </span>
    </Link>
  );
}

interface NavbarProps {
  mode?: AdaptivePillNavMode;
}

export function Navbar({ mode = 'app' }: NavbarProps) {
  const { status } = useAuth();
  const reduceMotion = useReducedMotion();
  const guestInApp = mode === 'app' && status === 'unauthenticated';

  return (
    <motion.header
      className="glass-bar sticky top-0 z-40 pt-[env(safe-area-inset-top)]"
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0, transition: transitions.page }}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4">
        <Brand />
        <AdaptivePillNav
          mode={mode}
          menuExtra={(close) => (
            <>
              <InstallAppButton variant="outline" onDone={close} />
              {guestInApp && (
                <Button asChild onClick={close}>
                  <Link to="/login">Entrar</Link>
                </Button>
              )}
            </>
          )}
        />
        <div className="flex items-center gap-1">
          {guestInApp && (
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
              <Link to="/login">Entrar</Link>
            </Button>
          )}
          <InstallAppButton className="hidden md:inline-flex" />
          <ThemeToggler />
        </div>
      </div>
    </motion.header>
  );
}
