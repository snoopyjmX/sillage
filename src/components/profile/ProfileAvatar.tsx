import { Camera, Trash2, User } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useState, type ChangeEvent } from 'react';
import { AVATAR_ACCEPT } from '@/lib/avatar';
import { transitions } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  initials: string;
  avatarUrl?: string | null;
  editable?: boolean;
  uploading?: boolean;
  onUpload?: (file: File) => void;
  onRemove?: () => void;
}

const ACTION_CLASS =
  'grid size-8 cursor-pointer place-items-center rounded-full border bg-card text-foreground shadow-card transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

// Foto quando há `avatarUrl` (e ela carrega); senão as iniciais. A imagem é decorativa: o nome vem
// ao lado, em texto. Momento de assinatura da tela: entra com escala e opacidade (transform + opacity).
// Editável: a câmera é um <input type="file"> real (teclado e leitor de tela) e há "remover".
export function ProfileAvatar({
  initials,
  avatarUrl,
  editable = false,
  uploading = false,
  onUpload,
  onRemove,
}: ProfileAvatarProps) {
  const reduced = useReducedMotion();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = Boolean(avatarUrl) && failedUrl !== avatarUrl;

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Limpa para poder escolher o mesmo arquivo de novo
    event.target.value = '';
    if (file) onUpload?.(file);
  };

  return (
    <div className="relative shrink-0" aria-busy={uploading || undefined}>
      <motion.span
        aria-hidden
        data-slot="profile-avatar"
        className={cn(
          'grid size-16 place-items-center overflow-hidden rounded-full bg-accent font-heading text-2xl font-medium text-primary',
          uploading && 'opacity-60'
        )}
        initial={reduced ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1, transition: transitions.physical }}
      >
        {showPhoto && avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            width={64}
            height={64}
            decoding="async"
            onError={() => setFailedUrl(avatarUrl)}
            className="size-16 rounded-full object-cover"
          />
        ) : initials === '' ? (
          <User className="size-7" />
        ) : (
          initials
        )}
      </motion.span>

      {editable && (
        <>
          <label
            className={cn(
              ACTION_CLASS,
              'absolute -right-1 -bottom-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
              uploading && 'pointer-events-none opacity-60'
            )}
          >
            <Camera aria-hidden className="size-4" />
            <span className="sr-only">Alterar foto de perfil</span>
            <input
              type="file"
              accept={AVATAR_ACCEPT}
              className="sr-only"
              disabled={uploading}
              onChange={handleFile}
            />
          </label>
          {showPhoto && (
            <button
              type="button"
              aria-label="Remover foto de perfil"
              disabled={uploading}
              onClick={() => onRemove?.()}
              className={cn(ACTION_CLASS, 'absolute -top-1 -right-1 disabled:opacity-60')}
            >
              <Trash2 aria-hidden className="size-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
