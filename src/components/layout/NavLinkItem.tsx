// Item de navegação compartilhado pela barra superior (desktop) e pelo menu do celular.
import { NavLink } from 'react-router-dom';
import type { NavItem } from '@/constants/navigation';
import { cn } from '@/lib/utils';

interface NavLinkItemProps {
  item: NavItem;
  variant: 'top' | 'menu';
  // Chamado ao navegar (o menu do celular fecha por aqui)
  onNavigate?: () => void;
}

const base =
  'relative flex items-center rounded-lg text-sm font-medium outline-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

const layout = {
  top: 'h-11 justify-center gap-2 px-3',
  menu: 'h-12 w-full gap-3 px-3 text-base',
} as const;

export function NavLinkItem({ item, variant, onNavigate }: NavLinkItemProps) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      // "/" só está ativo na própria página, não em todas
      end={item.to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          base,
          layout[variant],
          isActive ? 'bg-accent text-primary' : 'text-foreground hover:bg-accent'
        )
      }
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span>{item.label}</span>
    </NavLink>
  );
}
