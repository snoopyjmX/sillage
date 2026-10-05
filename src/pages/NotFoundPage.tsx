import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function NotFoundPage() {
  return (
    <>
      <title>Página não encontrada · Sillage</title>
      <meta name="robots" content="noindex" />
      <div className="flex flex-col items-center gap-2 py-10">
        <h1 className="sr-only">Página não encontrada</h1>
        <EmptyState
          icon={Compass}
          title="Não encontramos essa página"
          description="O endereço pode ter mudado ou nunca ter existido. Que tal voltar ao catálogo?"
          action={
            <Button asChild>
              <Link to="/catalog">Ir para o catálogo</Link>
            </Button>
          }
        />
      </div>
    </>
  );
}
