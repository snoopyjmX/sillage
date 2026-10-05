import { MessageSquarePlus, Pencil } from 'lucide-react';
import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserReview } from '@/hooks/useReviews';
import { buildLoginPath } from '@/lib/redirect';
import { ReviewSheet } from './ReviewSheet';

interface ReviewActionsProps {
  perfume: { id: string; name: string };
}

// "Avaliar fragrância": visitante vai para o login e volta aqui; logado abre o formulário
// (com a avaliação atual preenchida, se houver).
export function ReviewActions({ perfume }: ReviewActionsProps) {
  const { status } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mine = useUserReview(perfume.id);

  if (status !== 'authenticated') {
    const handleLogin = () =>
      void navigate(buildLoginPath(`${location.pathname}${location.search}${location.hash}`));
    return (
      <Button variant="outline" disabled={status === 'loading'} onClick={handleLogin}>
        <MessageSquarePlus aria-hidden />
        Avaliar fragrância
      </Button>
    );
  }

  const existing = mine.data ?? null;
  const Icon = existing ? Pencil : MessageSquarePlus;
  return (
    <>
      <Button
        ref={buttonRef}
        variant="outline"
        // Só abre depois de saber se já existe avaliação (senão o formulário abriria vazio)
        disabled={mine.status === 'pending'}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Icon aria-hidden />
        {existing ? 'Editar minha avaliação' : 'Avaliar fragrância'}
      </Button>
      <ReviewSheet
        open={open}
        onOpenChange={setOpen}
        perfume={perfume}
        existing={existing}
        onCloseAutoFocus={(event) => {
          // Esc ou fechar: o foco volta ao botão que abriu o formulário
          event.preventDefault();
          buttonRef.current?.focus();
        }}
      />
    </>
  );
}
