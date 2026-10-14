import { useEffect, useState } from 'react';

// Espera entre dois reenvios do link de confirmação (o servidor também limita; isto evita o
// clique repetido e mostra ao usuário quando poderá pedir de novo).
export const RESEND_COOLDOWN_SECONDS = 60;

// Contagem regressiva em segundos. `start` reinicia; 0 significa liberado.
export const useResendCooldown = (seconds = RESEND_COOLDOWN_SECONDS) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  return { remaining, start: () => setRemaining(seconds) };
};
