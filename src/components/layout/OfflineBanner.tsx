// Faixa discreta, só quando a conexão cai (docs/PRODUCT.md, Seção 11). Anima só opacity e y.
import { WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { OFFLINE_BANNER_TEXT } from '@/constants/offline';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { transitions } from '@/lib/motion';

interface OfflineBannerProps {
  text?: string;
}

export function OfflineBanner({ text = OFFLINE_BANNER_TEXT }: OfflineBannerProps) {
  const online = useOnlineStatus();
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          role="status"
          data-testid="offline-banner"
          className="border-b bg-secondary text-text-secondary"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, transition: transitions.page }}
          exit={{ opacity: 0, transition: transitions.exit }}
        >
          <p className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-2 text-sm">
            <WifiOff className="size-4 shrink-0" aria-hidden />
            {text}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
