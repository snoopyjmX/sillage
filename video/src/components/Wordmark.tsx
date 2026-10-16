import type { CSSProperties } from 'react';
import { Img, staticFile } from 'remotion';
import { font, light } from '../tokens';

interface WordmarkProps {
  size: number;
  color?: string;
  style?: CSSProperties;
}

// Marca do Sillage: o ícone do app ao lado do nome em Fraunces 600
export const Wordmark = ({ size, color = light.primary, style }: WordmarkProps) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.28, ...style }}>
    <Img
      src={staticFile('apple-touch-icon.png')}
      style={{
        width: size * 0.92,
        height: size * 0.92,
        borderRadius: size * 0.22,
        boxShadow: '0 8px 24px rgba(23, 35, 28, 0.12)',
      }}
    />
    <span
      style={{
        fontFamily: font.heading,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: -size * 0.015,
        color,
      }}
    >
      Sillage
    </span>
  </div>
);
