import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthLink } from '@/components/auth/AuthLink';
import { ResendConfirmation } from '@/components/auth/ResendConfirmation';
import { SeoHead } from '@/components/seo/SeoHead';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormAlert } from '@/components/ui/form-alert';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { AuthPending } from '@/routes/AuthPending';

// Retorno do link de confirmação do e-mail: o supabase-js lê o token da URL e abre a sessão.
// Com sessão, a conta está confirmada. Sem sessão (link expirado, já usado ou acesso direto),
// oferece reenviar o e-mail.
export default function ConfirmedPage() {
  const { status } = useAuth();
  const online = useOnlineStatus();
  const [email, setEmail] = useState('');

  if (status === 'loading') return <AuthPending />;

  if (status === 'authenticated') {
    return (
      <>
        <SeoHead title="Conta confirmada" description="Seu e-mail foi confirmado." />
        <meta name="robots" content="noindex" />
        <AuthCard
          title="Conta confirmada"
          description="Seu e-mail foi confirmado. Bem-vindo ao Sillage!"
        >
          <Button asChild>
            <Link to="/">Ir para o início</Link>
          </Button>
        </AuthCard>
      </>
    );
  }

  return (
    <>
      <SeoHead title="Link inválido" description="O link de confirmação é inválido ou expirou." />
      <meta name="robots" content="noindex" />
      <AuthCard
        title="Link inválido ou expirado"
        description="Peça um novo e-mail de confirmação para ativar a sua conta."
        footer={
          <>
            Já confirmou? <AuthLink to="/login">Entrar</AuthLink>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {!online && (
            <FormAlert>
              Você está sem conexão. Conecte-se à internet para reenviar o e-mail.
            </FormAlert>
          )}
          <Field
            label="E-mail"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <ResendConfirmation email={email} />
        </div>
      </AuthCard>
    </>
  );
}
