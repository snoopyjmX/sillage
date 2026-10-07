import { ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { LandingPyramid } from '@/components/landing/LandingPyramid';
import { SeoHead } from '@/components/seo/SeoHead';
import { BlurFade } from '@/components/ui/blur-fade';
import { Button } from '@/components/ui/button';
import { LANDING_FEATURES, LANDING_STEPS } from '@/constants/landing';
import { staggerDelay } from '@/lib/motion';
import { withRedirect } from '@/lib/redirect';

interface AccessButtonsProps {
  registerTo: string;
  loginTo: string;
}

function AccessButtons({ registerTo, loginTo }: AccessButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild size="lg">
        <Link to={registerTo}>
          Criar conta
          <ArrowRight aria-hidden />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link to={loginTo}>Entrar</Link>
      </Button>
    </div>
  );
}

// Rota "/" do visitante (a Home é do logado: ver routes/RootEntry). Estática: não consulta o banco,
// então abre offline pelo shell em precache. Assinatura: a pirâmide em camadas; o resto é calmo.
export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const { hash } = useLocation();
  const redirect = searchParams.get('redirect');
  const registerTo = withRedirect('/register', redirect);
  const loginTo = withRedirect('/login', redirect);

  // Âncora vinda de outra tela (ex.: "/#recursos" no login): leva à seção depois de montar
  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <>
      <SeoHead
        title="Enciclopédia olfativa"
        description="Explore perfumes pelas notas, monte sua coleção e converse com o Nez. Crie sua conta no Sillage."
      />

      <div className="flex flex-col gap-20 pb-6 md:gap-28">
        <section
          id="inicio"
          aria-labelledby="titulo-inicio"
          className="grid scroll-mt-24 items-center gap-10 pt-4 md:grid-cols-2 md:pt-12"
        >
          <div className="flex flex-col items-start gap-5">
            <p className="text-sm font-medium tracking-wide text-primary uppercase">
              Enciclopédia olfativa
            </p>
            <h1
              id="titulo-inicio"
              className="font-heading text-4xl leading-tight font-medium md:text-6xl"
            >
              Descubra perfumes pelas suas notas
            </h1>
            <p className="max-w-xl text-base text-text-secondary md:text-lg">
              Explore o catálogo pela pirâmide olfativa, guarde o que você tem e o que quer, e
              escolha o perfume do seu dia.
            </p>
            <AccessButtons registerTo={registerTo} loginTo={loginTo} />
          </div>
          <LandingPyramid className="mx-auto w-full max-w-md" />
        </section>

        <section
          id="como-funciona"
          aria-labelledby="titulo-como-funciona"
          className="flex scroll-mt-24 flex-col gap-6"
        >
          <h2 id="titulo-como-funciona" className="font-heading text-3xl font-medium">
            Como funciona
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {LANDING_STEPS.map((step, index) => (
              <li key={step.key}>
                <BlurFade
                  inView
                  delay={staggerDelay(index)}
                  className="flex h-full flex-col gap-2 rounded-xl border bg-card p-5 shadow-card"
                >
                  <span className="font-heading text-2xl font-medium text-primary">
                    {index + 1}
                  </span>
                  <h3 className="font-heading text-xl font-medium">{step.title}</h3>
                  <p className="text-sm text-text-secondary">{step.description}</p>
                </BlurFade>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="recursos"
          aria-labelledby="titulo-recursos"
          className="flex scroll-mt-24 flex-col gap-6"
        >
          <h2 id="titulo-recursos" className="font-heading text-3xl font-medium">
            Recursos
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LANDING_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <li key={feature.key}>
                  <BlurFade
                    inView
                    delay={staggerDelay(index)}
                    className="flex h-full flex-col gap-3 rounded-xl border bg-card p-5 shadow-card"
                  >
                    <span className="grid size-10 place-items-center rounded-full bg-accent text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="font-heading text-lg font-medium">{feature.title}</h3>
                    <p className="text-sm text-text-secondary">{feature.description}</p>
                  </BlurFade>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          id="acessar"
          aria-labelledby="titulo-acessar"
          className="flex scroll-mt-24 flex-col items-start gap-4 rounded-2xl border bg-card p-6 shadow-card md:items-center md:p-10 md:text-center"
        >
          <h2 id="titulo-acessar" className="font-heading text-3xl font-medium">
            Entre para explorar
          </h2>
          <p className="max-w-xl text-text-secondary">
            O catálogo, a coleção e o Nez ficam à sua espera na sua conta. Criar a conta é rápido.
          </p>
          <AccessButtons registerTo={registerTo} loginTo={loginTo} />
        </section>
      </div>
    </>
  );
}
