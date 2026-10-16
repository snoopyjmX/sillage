import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { dark as darkPalette, font, light as lightPalette, shadow } from '../tokens';
import { mix, useEnter, useWindow } from './motion';

interface FeatureCalloutProps {
  icon: LucideIcon;
  title: string;
  caption: string;
  // Frames locais da cena: entra em `at`, sai em `until` (ou fica até o fim)
  at: number;
  until?: number;
  dark?: boolean;
  style?: CSSProperties;
}

// Pílula de vidro flutuante: ícone Lucide, título em Fraunces e legenda em Inter
export const FeatureCallout = ({
  icon: Icon,
  title,
  caption,
  at,
  until = 100_000,
  dark = false,
  style,
}: FeatureCalloutProps) => {
  const enter = useEnter(at);
  const visible = useWindow(at, until, 20);
  const palette = dark ? darkPalette : lightPalette;
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '16px 28px 16px 16px',
        borderRadius: 999,
        background: dark ? 'rgba(24, 30, 26, 0.74)' : 'rgba(255, 255, 255, 0.74)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${dark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.9)'}`,
        boxShadow: dark ? shadow.stageDark : shadow.modal,
        opacity: Math.min(enter, visible),
        transform: `translateY(${mix(28, 0, enter)}px) scale(${mix(0.94, 1, enter)})`,
        ...style,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: palette.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={28} color={palette.primary} strokeWidth={1.75} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span
          style={{
            fontFamily: font.heading,
            fontWeight: 600,
            fontSize: 26,
            color: palette.foreground,
            lineHeight: 1.15,
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontFamily: font.sans,
            fontSize: 18,
            color: palette.textSecondary,
            lineHeight: 1.3,
          }}
        >
          {caption}
        </span>
      </div>
    </div>
  );
};
