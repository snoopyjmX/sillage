import { TypingAnimation } from '@/components/ui/typing-animation';

interface HomeHeaderProps {
  // "outubro de 2026"
  edition: string;
}

// Cabeçalho da Home. O momento de assinatura da tela é a digitação do título.
export function HomeHeader({ edition }: HomeHeaderProps) {
  return (
    <header className="flex flex-col items-start gap-3 pt-4 md:pt-8">
      <p className="inline-flex h-7 items-center rounded-full bg-badge-concentration px-3 text-xs font-medium tracking-wider text-badge-concentration-foreground uppercase">
        Edição diária · <time className="ms-1">{edition}</time>
      </p>
      <h1 className="font-heading text-4xl leading-tight font-medium md:text-6xl">
        <TypingAnimation>Descubra a fragrância de hoje</TypingAnimation>
      </h1>
      <p className="max-w-xl text-base text-text-secondary">
        Um perfume por dia, no seu fuso, e o histórico de tudo que você já vestiu.
      </p>
    </header>
  );
}
