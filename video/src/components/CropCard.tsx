import type { CSSProperties } from 'react';
import { Img, staticFile } from 'remotion';
import { radius, shadow } from '../tokens';

// Recorte em CSS px de uma captura desktop (1280 de largura)
export interface Crop {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CropCardProps {
  src: string;
  crop: Crop;
  width: number;
  dark?: boolean;
  style?: CSSProperties;
}

// Destaque de um trecho real da tela (card SOTD, gaveta do Nez, bloco de afinidade) em cartão de vidro
export const CropCard = ({ src, crop, width, dark = false, style }: CropCardProps) => {
  const scale = width / crop.w;
  return (
    <div
      style={{
        position: 'absolute',
        width,
        height: crop.h * scale,
        borderRadius: radius.xxl,
        overflow: 'hidden',
        border: `1px solid ${dark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.9)'}`,
        boxShadow: dark ? shadow.stageDark : shadow.stage,
        ...style,
      }}
    >
      <Img
        src={staticFile(`captures/${src}`)}
        style={{
          position: 'absolute',
          width: 1280 * scale,
          left: -crop.x * scale,
          top: -crop.y * scale,
        }}
      />
    </div>
  );
};
