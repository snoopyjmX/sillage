// Moldura das telas de autenticação (fora do AppShell): logo e formulário de um lado e, a partir de
// md, painel de marca do outro, com a arte local ao fundo. Só tokens, sem imagem externa.
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '@/components/layout/Navbar';
import { TypingAnimation } from '@/components/ui/typing-animation';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

// Arte decorativa (docs/DESIGN_SYSTEM.md, "Arte das telas de auth"): WebP servido pelo próprio site.
// A largura 1200 é a do original; o painel ocupa metade da tela (sizes).
const ART_WIDTH = 1200;
const ART_HEIGHT = 1888;
const ART_WIDTHS = [640, 960, 1200] as const;
const ART_SRCSET = ART_WIDTHS.map((w) => `/auth-art/auth-art-${w}.webp ${w}w`).join(', ');
const ART_SRC = '/auth-art/auth-art-960.webp';
// Mesmo ponto de corte do `md:` do Tailwind (48rem): abaixo dele o painel nem aparece
const PANEL_QUERY = '(min-width: 48rem)';

const focusRing =
  'rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

function BrandPanel() {
  // A <img> só entra na árvore a partir de md: no celular o painel está oculto e a arte não é baixada
  const showArt = useMediaQuery(PANEL_QUERY);

  return (
    <aside
      data-slot="auth-brand-panel"
      className="relative isolate hidden flex-col justify-end overflow-hidden border-l bg-accent p-10 md:flex lg:p-14"
    >
      {showArt && (
        <img
          data-slot="auth-art"
          src={ART_SRC}
          srcSet={ART_SRCSET}
          sizes="50vw"
          width={ART_WIDTH}
          height={ART_HEIGHT}
          alt=""
          aria-hidden
          decoding="async"
          fetchPriority="low"
          className="absolute inset-0 -z-20 size-full object-cover"
        />
      )}
      {/* Camada de token: garante o contraste da frase sobre a arte clara (mais forte no escuro) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-t from-background/80 via-background/40 to-background/10 dark:from-background/90 dark:via-background/80 dark:to-background/70"
      />

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
        <figcaption className="text-sm text-foreground">— Sillage</figcaption>
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
          <div className="self-start">
            <Brand alwaysShowName />
          </div>
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
