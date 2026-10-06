// Rodapé do Sillage: wordmark com a definição da palavra e três colunas nomeadas como a pirâmide
// olfativa (Topo, Coração, Fundo). O rastro decorativo sobe só com transform e opacity, em loop
// lento; some em reduced motion. Usado no AppShell e na Landing.
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { OPEN_METEO_ATTRIBUTION } from '@/constants/weather';
import { useAuth } from '@/hooks/useAuth';
import { durations, easings } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface FooterLink {
  label: string;
  to: string;
}

interface FooterColumn {
  note: string;
  title: string;
  links: readonly FooterLink[];
}

const MEMBER_COLUMNS: readonly FooterColumn[] = [
  {
    note: 'Topo',
    title: 'Explorar',
    links: [
      { label: 'Catálogo', to: '/catalog' },
      { label: 'Coleção', to: '/collection' },
    ],
  },
  {
    note: 'Coração',
    title: 'Sua conta',
    links: [
      { label: 'Perfil', to: '/profile' },
      { label: 'Perfume do Dia', to: '/' },
    ],
  },
];

const GUEST_COLUMNS: readonly FooterColumn[] = [
  {
    note: 'Topo',
    title: 'Explorar',
    links: [
      { label: 'Entrar', to: '/login' },
      { label: 'Criar conta', to: '/register' },
    ],
  },
  {
    note: 'Coração',
    title: 'Sua conta',
    links: [{ label: 'Esqueci minha senha', to: '/forgot-password' }],
  },
];

const WISPS = [
  { left: 'left-[8%]', delay: 0 },
  { left: 'left-[16%]', delay: 3 },
  { left: 'left-[24%]', delay: 6 },
] as const;

// Fios de vapor decorativos: sobem e se dissipam
function Trail() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 start-0 w-1/2 sm:w-1/3">
      {WISPS.map((wisp) => (
        <motion.span
          key={wisp.left}
          className={cn(
            'absolute bottom-0 h-24 w-2 rounded-full bg-gradient-to-t from-primary/25 to-transparent',
            wisp.left
          )}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.8, 0], y: [0, -64] }}
          transition={{
            duration: durations.ambient,
            ease: easings.out,
            repeat: Infinity,
            delay: wisp.delay,
          }}
        />
      ))}
    </div>
  );
}

function Column({ column }: { column: FooterColumn }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-text-muted uppercase">{column.note}</p>
      <h2 className="mt-1 font-heading text-lg font-semibold">{column.title}</h2>
      <ul className="mt-2 flex flex-col">
        {column.links.map((link) => (
          <li key={link.to + link.label}>
            <Link
              to={link.to}
              className="inline-flex min-h-11 items-center rounded-lg text-sm text-text-secondary outline-none hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const { status } = useAuth();
  const reduceMotion = useReducedMotion();
  const columns = status === 'authenticated' ? MEMBER_COLUMNS : GUEST_COLUMNS;

  return (
    <footer className={cn('relative mt-12 overflow-hidden border-t', className)}>
      {!reduceMotion && <Trail />}
      <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-heading text-5xl font-semibold text-primary">Sillage</p>
          <p className="mt-2 max-w-xs text-sm text-text-secondary">
            <em>Sillage</em>: o rastro que o perfume deixa no ar depois que você passa.
          </p>
        </div>
        {columns.map((column) => (
          <Column key={column.note} column={column} />
        ))}
        <div>
          <p className="text-xs font-medium tracking-wide text-text-muted uppercase">Fundo</p>
          <h2 className="mt-1 font-heading text-lg font-semibold">Projeto</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-text-secondary">
            <li>Feito por João Marcelo</li>
            <li>Versão {__PKG_VERSION__}</li>
          </ul>
        </div>
      </div>
      {/* Atribuição exigida pela licença CC BY 4.0 do Open-Meteo, em linha própria */}
      <div className="relative mx-auto flex w-full max-w-6xl flex-wrap gap-x-4 px-4 pb-4 text-xs text-text-muted">
        <a
          href={OPEN_METEO_ATTRIBUTION.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm underline underline-offset-4 outline-none hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {OPEN_METEO_ATTRIBUTION.text}
        </a>
      </div>
    </footer>
  );
}
