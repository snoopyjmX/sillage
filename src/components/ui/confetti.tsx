// Origem: própria, sobre canvas-confetti (docs/ARCHITECTURE.md, Fase 8). Cores lidas dos tokens
// em tempo de execução (nenhuma cor literal); desligado em reduced motion pela própria lib.
import confetti from 'canvas-confetti';

const TOKEN_COLORS = ['--primary', '--success', '--warning', '--chip-floral', '--chip-aquatic'];
const PARTICLE_COUNT = 90;
const SPREAD = 70;
const ORIGIN_Y = 0.7;

const readTokenColors = (): string[] => {
  const styles = getComputedStyle(document.documentElement);
  return TOKEN_COLORS.map((token) => styles.getPropertyValue(token).trim()).filter(Boolean);
};

// Dois jatos laterais, de baixo para o centro. Chamar de um handler ou efeito de sucesso.
export const fireConfetti = (): void => {
  const colors = readTokenColors();
  const shared = {
    particleCount: PARTICLE_COUNT,
    spread: SPREAD,
    startVelocity: 55,
    colors,
    disableForReducedMotion: true,
    zIndex: 60,
  };
  void confetti({ ...shared, angle: 60, origin: { x: 0, y: ORIGIN_Y } });
  void confetti({ ...shared, angle: 120, origin: { x: 1, y: ORIGIN_Y } });
};
