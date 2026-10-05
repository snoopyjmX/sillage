// Item de navegação compartilhado pela navbar (desktop) e pela navegação inferior (celular).
import { NavLink } from 'react-router-dom';
import type { NavItem } from '@/constants/navigation';
import { cn } from '@/lib/utils';

interface NavLinkItemProps {
  item: NavItem;
  variant: 'top' | 'bottom';
}

const base =
  'relative flex items-center justify-center rounded-lg text-sm font-medium outline-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

const layout = {
  top: 'h-11 flex-row gap-2 px-3',
  bottom: 'min-h-14 w-full flex-col gap-0.5 px-1 py-1.5 text-xs',
} as const;

export function NavLinkItem({ item, variant }: NavLinkItemProps) {
  const Icon = item.icon;
  const content = (
    <>
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className="flex flex-col items-center leading-tight">
        <span>{item.label}</span>
        {!item.to && <span className="text-xs font-normal">em breve</span>}
      </span>
    </>
  );

  if (!item.to) {
    // Sem rota ainda: não é um link, só um item desabilitado e anunciado como tal
    return (
      <span
        role="link"
        aria-disabled="true"
        aria-label={`${item.label}, em breve`}
        className={cn(base, layout[variant], 'cursor-not-allowed text-muted-foreground')}
      >
        {content}
      </span>
    );
  }

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          base,
          layout[variant],
          isActive ? 'bg-accent text-primary' : 'text-foreground hover:bg-accent'
        )
      }
    >
      {content}
    </NavLink>
  );
}
