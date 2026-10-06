// Origem: 21st.dev, "3d-adaptive-navigation-bar" (avaliada em 2026-10; reescrita, não colada).
// Pílula flutuante de navegação. Alterações: motion/react (não framer-motion), só tokens, itens são
// links (react-router ou âncoras), foco e teclado nativos, aria-current, sombra estática e sem
// animar width/height. Em vez de recolher/expandir, a pílula fica sempre aberta e o item ativo
// ganha um indicador que desliza por layoutId (transform) com o spring físico do token de motion.
// Dois modos: "app" (NAV_ITEMS) e "landing" (âncoras da Landing + Entrar e Criar conta).
// Abaixo de 768 px: pílula compacta com o rótulo ativo e o botão que abre o Drawer.
import { Menu } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { LANDING_ITEMS, NAV_ITEMS } from '@/constants/navigation';
import { transitions } from '@/lib/motion';
import { cn } from '@/lib/utils';

export type AdaptivePillNavMode = 'app' | 'landing';

interface AdaptivePillNavProps {
  mode: AdaptivePillNavMode;
  // Conteúdo extra no fim do menu do celular (ex.: "Instalar app")
  menuExtra?: (close: () => void) => ReactNode;
  className?: string;
}

const itemBase =
  'relative flex h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium ' +
  'whitespace-nowrap outline-none focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-ring';

const menuItemBase =
  'flex h-12 w-full items-center gap-3 rounded-lg px-3 text-base font-medium outline-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

const pillSurface = 'rounded-full border bg-card p-1 shadow-pill';

// Hash atual (a Landing é uma página só; o clique numa âncora dispara hashchange)
const useHash = (enabled: boolean): string => {
  const { hash: routerHash } = useLocation();
  const [hash, setHash] = useState(() => (enabled ? window.location.hash : ''));
  useEffect(() => {
    if (!enabled) return;
    const sync = () => setHash(window.location.hash);
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [enabled]);
  return enabled ? hash || routerHash || LANDING_ITEMS[0]!.hash : '';
};

function ActiveIndicator({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <motion.span
      layoutId="adaptive-pill-active"
      aria-hidden
      className="absolute inset-0 -z-10 rounded-full bg-accent"
      transition={reduceMotion ? { duration: 0 } : transitions.physical}
    />
  );
}

export function AdaptivePillNav({ mode, menuExtra, className }: AdaptivePillNavProps) {
  const reduceMotion = useReducedMotion();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const landing = mode === 'landing';
  const hash = useHash(landing);

  const activeApp = NAV_ITEMS.find((item) =>
    item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
  );
  const activeLanding = LANDING_ITEMS.find((item) => item.hash === hash);
  const activeLabel = (landing ? activeLanding?.label : activeApp?.label) ?? 'Menu';

  return (
    <div className={className}>
      {/* A partir de 768 px: pílula completa */}
      <nav aria-label="Principal" className="hidden md:block">
        <ul className={cn('flex items-center gap-1', pillSurface)}>
          {landing
            ? LANDING_ITEMS.map((item) => {
                const active = item.hash === hash;
                return (
                  <li key={item.key} className="isolate">
                    <a
                      href={item.hash}
                      aria-current={active ? 'location' : undefined}
                      className={cn(itemBase, active ? 'text-primary' : 'hover:bg-accent')}
                    >
                      {active && <ActiveIndicator reduceMotion={reduceMotion} />}
                      {item.label}
                    </a>
                  </li>
                );
              })
            : NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.key} className="isolate">
                    <NavLink
                      to={item.to}
                      // "/" só está ativo na própria página, não em todas
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        cn(itemBase, isActive ? 'text-primary' : 'hover:bg-accent')
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <ActiveIndicator reduceMotion={reduceMotion} />}
                          <Icon className="size-5 shrink-0" aria-hidden />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
          {landing && (
            <li className="flex items-center gap-1 pl-1">
              <Button asChild variant="ghost" size="sm" className="h-11 rounded-full">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm" className="h-11 rounded-full">
                <Link to="/register">Criar conta</Link>
              </Button>
            </li>
          )}
        </ul>
      </nav>

      {/* Abaixo de 768 px: rótulo ativo + botão do menu */}
      <div className={cn('flex items-center gap-1 md:hidden', pillSurface)}>
        <span className="truncate pl-3 text-sm font-medium text-primary">{activeLabel}</span>
        <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Abrir menu">
              <Menu className="size-5" aria-hidden />
            </Button>
          </DrawerTrigger>
          <DrawerContent side="right">
            <DrawerHeader>
              <DrawerTitle>Menu</DrawerTitle>
              <DrawerDescription>Navegue pelo Sillage.</DrawerDescription>
            </DrawerHeader>
            <nav aria-label="Menu principal" className="flex flex-col gap-1">
              {landing
                ? LANDING_ITEMS.map((item) => (
                    <a
                      key={item.key}
                      href={item.hash}
                      onClick={closeMenu}
                      aria-current={item.hash === hash ? 'location' : undefined}
                      className={cn(
                        menuItemBase,
                        item.hash === hash ? 'bg-accent text-primary' : 'hover:bg-accent'
                      )}
                    >
                      {item.label}
                    </a>
                  ))
                : NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.key}
                        to={item.to}
                        end={item.to === '/'}
                        onClick={closeMenu}
                        className={({ isActive }) =>
                          cn(menuItemBase, isActive ? 'bg-accent text-primary' : 'hover:bg-accent')
                        }
                      >
                        <Icon className="size-5 shrink-0" aria-hidden />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
            </nav>
            {menuExtra?.(closeMenu)}
            {landing && (
              <div className="flex flex-col gap-2">
                <Button asChild onClick={closeMenu}>
                  <Link to="/register">Criar conta</Link>
                </Button>
                <Button asChild variant="outline" onClick={closeMenu}>
                  <Link to="/login">Entrar</Link>
                </Button>
              </div>
            )}
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
