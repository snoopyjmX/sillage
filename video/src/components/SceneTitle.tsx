import type { CSSProperties } from 'react';
import { dark as darkPalette, font, light as lightPalette } from '../tokens';
import { mix, useEnter } from './motion';

interface SceneTitleProps {
  kicker: string;
  title: string;
  body?: string;
  dark?: boolean;
  delay?: number;
  width?: number;
  style?: CSSProperties;
}

// Bloco editorial de cada cena: selo em caixa alta, título em Fraunces e uma frase de apoio
export const SceneTitle = ({
  kicker,
  title,
  body,
  dark = false,
  delay = 0,
  width = 560,
  style,
}: SceneTitleProps) => {
  const palette = dark ? darkPalette : lightPalette;
  const kickerIn = useEnter(delay);
  const titleIn = useEnter(delay + 8);
  const bodyIn = useEnter(delay + 18);
  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 150,
        width,
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        ...style,
      }}
    >
      <span
        style={{
          alignSelf: 'flex-start',
          padding: '8px 16px',
          borderRadius: 999,
          background: palette.accent,
          color: palette.primary,
          fontFamily: font.sans,
          fontWeight: 600,
          fontSize: 16,
          letterSpacing: 2.4,
          textTransform: 'uppercase',
          opacity: kickerIn,
          transform: `translateY(${mix(16, 0, kickerIn)}px)`,
        }}
      >
        {kicker}
      </span>
      <h2
        style={{
          margin: 0,
          fontFamily: font.heading,
          fontWeight: 600,
          fontSize: 68,
          lineHeight: 1.04,
          letterSpacing: -1,
          color: palette.foreground,
          opacity: titleIn,
          transform: `translateY(${mix(24, 0, titleIn)}px)`,
        }}
      >
        {title}
      </h2>
      {body && (
        <p
          style={{
            margin: 0,
            fontFamily: font.sans,
            fontSize: 24,
            lineHeight: 1.5,
            color: palette.textSecondary,
            opacity: bodyIn,
            transform: `translateY(${mix(20, 0, bodyIn)}px)`,
          }}
        >
          {body}
        </p>
      )}
    </div>
  );
};
