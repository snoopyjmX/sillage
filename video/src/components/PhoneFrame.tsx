import type { CSSProperties } from 'react';
import { Img, staticFile } from 'remotion';
import { radius } from '../tokens';

// Captura mobile: 390×844 CSS px (salva em 2x)
const VIEWPORT_W = 390;
const VIEWPORT_H = 844;
const BEZEL = 11;

interface PhoneFrameProps {
  src: string;
  width: number;
  scroll?: number;
  style?: CSSProperties;
}

export const phoneHeight = (width: number): number =>
  ((width - BEZEL * 2) * VIEWPORT_H) / VIEWPORT_W + BEZEL * 2;

// Moldura mobile: aro escuro fino, cantos de aparelho atual e sombra de palco
export const PhoneFrame = ({ src, width, scroll = 0, style }: PhoneFrameProps) => {
  const inner = width - BEZEL * 2;
  const scale = inner / VIEWPORT_W;
  return (
    <div
      style={{
        position: 'absolute',
        width,
        height: phoneHeight(width),
        padding: BEZEL,
        borderRadius: 54,
        background: 'linear-gradient(145deg, #2A322D, #0F1411 55%, #1C231F)',
        boxShadow:
          '0 50px 120px rgba(15, 20, 17, 0.38), 0 14px 36px rgba(15, 20, 17, 0.25), inset 0 0 0 1.5px rgba(255, 255, 255, 0.12)',
        ...style,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: inner,
          height: VIEWPORT_H * scale,
          borderRadius: 54 - BEZEL,
          overflow: 'hidden',
          background: '#0F1411',
        }}
      >
        <Img
          src={staticFile(`captures/${src}`)}
          style={{ position: 'absolute', left: 0, top: -scroll * scale, width: inner }}
        />
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            width: inner * 0.3,
            height: 26,
            marginLeft: -(inner * 0.15),
            borderRadius: radius.xl,
            background: '#050806',
          }}
        />
      </div>
    </div>
  );
};
