import { User } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { transitions } from '@/lib/motion';

interface ProfileAvatarProps {
  initials: string;
}

// Avatar de iniciais (upload de foto está fora do MVP). Decorativo: o nome vem ao lado, em texto.
// Momento de assinatura da tela: entra com escala e opacidade (transform + opacity).
export function ProfileAvatar({ initials }: ProfileAvatarProps) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      data-slot="profile-avatar"
      className="grid size-16 shrink-0 place-items-center rounded-full bg-accent font-heading text-2xl font-medium text-primary"
      initial={reduced ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1, transition: transitions.physical }}
    >
      {initials === '' ? <User className="size-7" /> : initials}
    </motion.span>
  );
}
