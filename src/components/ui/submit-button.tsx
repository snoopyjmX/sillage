// Origem: própria. Botão de envio com estado de carregamento acessível: continua focável
// (aria-disabled, não disabled), anuncia "ocupado" e ignora cliques repetidos.
import { LoaderCircle } from 'lucide-react';
import { motion } from 'motion/react';
import type { ComponentProps, MouseEvent } from 'react';
import { Button } from './button';

interface SubmitButtonProps extends Omit<ComponentProps<typeof Button>, 'type'> {
  loading?: boolean;
  loadingLabel?: string;
}

export function SubmitButton({
  loading = false,
  loadingLabel = 'Enviando…',
  children,
  onClick,
  ...props
}: SubmitButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <Button
      type="submit"
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <motion.span
          aria-hidden
          className="inline-flex"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
        >
          <LoaderCircle className="size-5" />
        </motion.span>
      )}
      {loading ? loadingLabel : children}
    </Button>
  );
}
