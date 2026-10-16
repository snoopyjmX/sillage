import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { calmSpring } from '../tokens';

type SpringConfig = { damping: number; mass: number; stiffness: number };

// Progresso 0 → 1 de uma entrada com mola, começando em `delay` (frames locais da cena)
export const useEnter = (delay = 0, config: SpringConfig = calmSpring): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};

// Progresso linear e suavizado entre dois frames (para pans e zooms longos)
export const useSpan = (from: number, to: number): number => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // easeInOutCubic: começa e termina devagar, sem tranco
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};

// Janela de visibilidade: entra em `start`, sai em `end`, com rampas de `ramp` frames
export const useWindow = (start: number, end: number, ramp = 24): number => {
  const frame = useCurrentFrame();
  return interpolate(frame, [start, start + ramp, end - ramp, end], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

export const mix = (from: number, to: number, t: number): number => from + (to - from) * t;
