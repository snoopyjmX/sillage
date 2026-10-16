import { AbsoluteFill, interpolateColors, useCurrentFrame } from 'remotion';
import { dark, light } from '../tokens';

interface SillageAmbientBgProps {
  // 0 = tema claro, 1 = tema escuro (valores intermediários fazem a virada)
  darkness?: number;
}

const THREADS = [
  { x: 180, amp: 46, speed: 0.6, phase: 0.0, width: 1.6 },
  { x: 420, amp: 30, speed: 0.45, phase: 1.3, width: 1.1 },
  { x: 760, amp: 58, speed: 0.5, phase: 2.1, width: 1.4 },
  { x: 1140, amp: 36, speed: 0.4, phase: 0.7, width: 1.0 },
  { x: 1480, amp: 52, speed: 0.55, phase: 2.8, width: 1.5 },
  { x: 1760, amp: 28, speed: 0.35, phase: 1.9, width: 1.1 },
];

// Fio de rastro olfativo: curva vertical que sobe e ondula devagar (como o rodapé do app)
const threadPath = (x: number, amp: number, t: number, phase: number): string => {
  const points: string[] = [];
  for (let i = 0; i <= 24; i += 1) {
    const y = 1180 - i * 52;
    const dx = Math.sin(i * 0.42 + t + phase) * amp * (0.35 + i / 30);
    points.push(`${i === 0 ? 'M' : 'L'} ${(x + dx).toFixed(1)} ${y}`);
  }
  return points.join(' ');
};

// Fundo editorial: base do tema, brilho suave de acento e fios orgânicos lentos
export const SillageAmbientBg = ({ darkness = 0 }: SillageAmbientBgProps) => {
  const frame = useCurrentFrame();
  const background = interpolateColors(darkness, [0, 1], [light.background, dark.background]);
  const glow = interpolateColors(darkness, [0, 1], [light.accent, dark.accent]);
  const thread = interpolateColors(darkness, [0, 1], [light.primary, dark.primary]);
  const t = frame / 60;

  return (
    <AbsoluteFill style={{ background }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 70% at ${50 + Math.sin(t * 0.3) * 8}% 35%, ${glow} 0%, transparent 70%)`,
          opacity: 0.9,
        }}
      />
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {THREADS.map((item, index) => (
          <path
            key={index}
            d={threadPath(item.x, item.amp, t * item.speed, item.phase)}
            fill="none"
            stroke={thread}
            strokeWidth={item.width}
            strokeLinecap="round"
            strokeDasharray="6 14"
            strokeDashoffset={-frame * 0.6 * item.speed}
            opacity={0.16}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
