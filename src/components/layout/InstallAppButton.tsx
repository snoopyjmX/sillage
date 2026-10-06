// "Instalar app": Android/Chrome usa o evento `beforeinstallprompt`; iOS/Safari abre uma folha
// explicando "Compartilhar → Adicionar à Tela de Início". Some quando já está instalado ou quando
// o navegador não suporta instalação.
import { Download, Share, SquarePlus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { cn } from '@/lib/utils';

interface InstallAppButtonProps {
  className?: string;
  variant?: 'ghost' | 'outline';
  onDone?: () => void;
}

export function InstallAppButton({ className, variant = 'ghost', onDone }: InstallAppButtonProps) {
  const { mode, install } = useInstallPrompt();
  const [iosOpen, setIosOpen] = useState(false);
  if (!mode) return null;

  const handleClick = () => {
    if (mode === 'ios') {
      setIosOpen(true);
      return;
    }
    void install();
    onDone?.();
  };

  return (
    <>
      <Button variant={variant} size="sm" className={cn(className)} onClick={handleClick}>
        <Download className="size-4" aria-hidden />
        Instalar app
      </Button>
      <Dialog open={iosOpen} onOpenChange={setIosOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar o Sillage</DialogTitle>
            <DialogDescription>
              No iPhone e no iPad a instalação é feita pelo Safari.
            </DialogDescription>
          </DialogHeader>
          <ol className="flex flex-col gap-3 text-text-secondary">
            <li className="flex items-center gap-3">
              <Share className="size-5 shrink-0 text-primary" aria-hidden />
              <span>
                Toque em <strong className="text-foreground">Compartilhar</strong>.
              </span>
            </li>
            <li className="flex items-center gap-3">
              <SquarePlus className="size-5 shrink-0 text-primary" aria-hidden />
              <span>
                Escolha <strong className="text-foreground">Adicionar à Tela de Início</strong>.
              </span>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
