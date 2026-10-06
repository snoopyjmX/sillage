import { LogOut } from 'lucide-react';
import { SeoHead } from '@/components/seo/SeoHead';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useSignOut } from '@/hooks/useAuthActions';
import { getErrorMessage } from '@/constants/errors';
import { toast } from '@/lib/toast';

// Versão mínima: só o suficiente para sair da conta. Nome, fuso e exclusão de conta vêm depois.
export default function ProfilePage() {
  const { user } = useAuth();
  const signOut = useSignOut();

  const handleSignOut = () =>
    signOut.mutate(undefined, { onError: (error) => toast.error(getErrorMessage(error)) });

  return (
    <>
      <SeoHead title="Perfil" description="Sua conta no Sillage." />
      <div className="mx-auto w-full max-w-md pt-4 md:pt-10">
        <Card className="gap-6 p-6">
          <CardHeader>
            <h1 className="font-heading text-3xl leading-tight font-medium">Perfil</h1>
            <CardDescription>
              Você entrou como <span className="font-medium text-foreground">{user?.email}</span>.
            </CardDescription>
          </CardHeader>
          <Button
            variant="outline"
            onClick={handleSignOut}
            aria-busy={signOut.isPending || undefined}
          >
            <LogOut aria-hidden />
            {signOut.isPending ? 'Saindo…' : 'Sair'}
          </Button>
        </Card>
      </div>
    </>
  );
}
