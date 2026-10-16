import type { CSSProperties } from 'react';
import { Img, staticFile } from 'remotion';
import { dark as darkPalette, font, light as lightPalette, radius, shadow } from '../tokens';

// Captura desktop: 1280×800 CSS px (salva em 2x)
const VIEWPORT_W = 1280;
const VIEWPORT_H = 800;
export const BAR_H = 46;

interface BrowserFrameProps {
  src: string;
  url: string;
  width: number;
  // Rolagem em CSS px da página capturada (a captura pode ser de página inteira)
  scroll?: number;
  // Zoom dentro da janela, centrado em `focus` (CSS px da página)
  zoom?: number;
  focus?: { x: number; y: number };
  dark?: boolean;
  style?: CSSProperties;
}

export const browserHeight = (width: number): number => (width * VIEWPORT_H) / VIEWPORT_W + BAR_H;

// Janela desktop minimalista: barra de vidro, três pontos discretos, URL do Sillage e recorte arredondado
export const BrowserFrame = ({
  src,
  url,
  width,
  scroll = 0,
  zoom = 1,
  focus = { x: VIEWPORT_W / 2, y: VIEWPORT_H / 2 },
  dark = false,
  style,
}: BrowserFrameProps) => {
  const palette = dark ? darkPalette : lightPalette;
  const scale = width / VIEWPORT_W;
  const viewportHeight = VIEWPORT_H * scale;
  return (
    <div
      style={{
        position: 'absolute',
        width,
        height: viewportHeight + BAR_H,
        borderRadius: radius.xl,
        overflow: 'hidden',
        background: palette.surface,
        border: `1px solid ${palette.border}`,
        boxShadow: dark ? shadow.stageDark : shadow.stage,
        ...style,
      }}
    >
      <div
        style={{
          height: BAR_H,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 18px',
          background: dark ? 'rgba(24, 30, 26, 0.72)' : 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              style={{
                width: 11,
                height: 11,
                borderRadius: '50%',
                background: dark ? 'rgba(238, 243, 236, 0.18)' : 'rgba(23, 35, 28, 0.14)',
              }}
            />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            maxWidth: 520,
            margin: '0 auto',
            height: 28,
            borderRadius: 999,
            background: palette.secondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: font.sans,
            fontSize: 14,
            fontWeight: 500,
            color: palette.textSecondary,
            letterSpacing: 0.2,
          }}
        >
          <span style={{ color: palette.primary, marginRight: 6 }}>●</span>
          {url}
        </div>
        <div style={{ width: 57 }} />
      </div>
      <div style={{ position: 'relative', height: viewportHeight, overflow: 'hidden' }}>
        <Img
          src={staticFile(`captures/${src}`)}
          style={{
            position: 'absolute',
            left: 0,
            top: -scroll * scale,
            width,
            display: 'block',
            transform: `scale(${zoom})`,
            transformOrigin: `${focus.x * scale}px ${focus.y * scale}px`,
          }}
        />
      </div>
    </div>
  );
};
