// Moldura das telas de autenticação (fora do AppShell): formulário de um lado e, a partir de md,
// painel de marca do outro. Só tokens, sem imagem externa.
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TypingAnimation } from '@/components/ui/typing-animation';

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

const PYRAMID_LAYERS = [
  { label: 'Topo', width: 'w-1/3', tone: 'border bg-card text-foreground' },
  { label: 'Coração', width: 'w-2/3', tone: 'border border-primary bg-card text-foreground' },
  { label: 'Base', width: 'w-full', tone: 'bg-primary text-primary-foreground' },
] as const;

const focusRing =
  'rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

function BrandPanel() {
  return (
    <aside
      data-slot="auth-brand-panel"
      className="hidden flex-col justify-between border-l bg-accent p-10 md:flex lg:p-14"
    >
      <div className="flex items-center gap-2">
        <img src="/favicon-32x32.png" alt="" width={32} height={32} className="size-8" />
        <span className="font-heading text-2xl font-semibold text-primary">Sillage</span>
      </div>

      {/* Pirâmide olfativa decorativa: o conteúdo real está na página de cada perfume */}
      <div aria-hidden className="mx-auto flex w-full max-w-xs flex-col items-center gap-2">
        {PYRAMID_LAYERS.map(({ label, width, tone }) => (
          <div
            key={label}
            className={`${width} ${tone} rounded-lg py-2 text-center text-sm font-medium`}
          >
            {label}
          </div>
        ))}
      </div>

      <figure className="flex flex-col gap-3">
        <blockquote>
          <TypingAnimation
            as="p"
            startDelay={400}
            className="font-heading text-3xl leading-tight font-medium text-foreground"
          >
            Todo perfume deixa um rastro. O seu começa aqui.
          </TypingAnimation>
        </blockquote>
        <figcaption className="text-sm text-text-secondary">— Sillage</figcaption>
      </figure>
    </aside>
  );
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <main id="conteudo" className="flex flex-col px-4 py-6 md:px-10">
        <Link
          to="/"
          className={`inline-flex min-h-11 items-center gap-2 self-start px-1 text-sm font-medium text-foreground ${focusRing}`}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 py-8">
          <header className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl leading-tight font-medium">{title}</h1>
            {description && <p className="text-muted-foreground">{description}</p>}
          </header>
          {children}
          {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>
      <BrandPanel />
    </div>
  );
}
