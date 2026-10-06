// Origem: própria, inspirada na navbar do 21st.dev e reescrita com motion/react (nunca framer-motion).
// Barra superior de vidro (docs/PRODUCT.md, Seção 9): marca, links (a partir de 768 px) e tema.
// No celular os links ficam num menu lateral aberto pelo botão hambúrguer. A área segura do topo
// entra como padding.
import { Menu } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ThemeToggler } from '@/components/ui/theme-toggler';
import { NAV_ITEMS } from '@/constants/navigation';
import { useAuth } from '@/hooks/useAuth';
import { transitions } from '@/lib/motion';
import { InstallAppButton } from './InstallAppButton';
import { NavLinkItem } from './NavLinkItem';

function Brand() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {/* Logo da marca: sem inversão de cor no escuro (distorceria a cor) */}
      <img src="/favicon-32x32.png" alt="" width={32} height={32} className="size-8" />
      <span className="font-heading text-2xl font-semibold text-primary">Sillage</span>
    </Link>
  );
}

export function Navbar() {
  const { status } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const closeMenu = () => setMenuOpen(false);
  const guest = status === 'unauthenticated';

  return (
    <motion.header
      className="glass-bar sticky top-0 z-40 pt-[env(safe-area-inset-top)]"
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0, transition: transitions.page }}
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Brand />
        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLinkItem key={item.key} item={item} variant="top" />
          ))}
        </nav>
        <div className="flex items-center gap-1">
          {guest && (
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
              <Link to="/login">Entrar</Link>
            </Button>
          )}
          <InstallAppButton className="hidden md:inline-flex" />
          <ThemeToggler />
          <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                <Menu className="size-5" aria-hidden />
              </Button>
            </DrawerTrigger>
            <DrawerContent side="right">
              <DrawerHeader>
                <DrawerTitle>Menu</DrawerTitle>
                <DrawerDescription>Navegue pelo Sillage.</DrawerDescription>
              </DrawerHeader>
              <nav aria-label="Menu principal" className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <NavLinkItem key={item.key} item={item} variant="menu" onNavigate={closeMenu} />
                ))}
              </nav>
              <InstallAppButton variant="outline" onDone={closeMenu} />
              {guest && (
                <Button asChild onClick={closeMenu}>
                  <Link to="/login">Entrar</Link>
                </Button>
              )}
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </motion.header>
  );
}
