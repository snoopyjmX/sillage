import type { CSSProperties, ReactNode } from 'react';
import { font } from '../tokens';
import { mix, useEnter } from './motion';

interface PillProps {
  children: ReactNode;
  background: string;
  color: string;
  at: number;
  style?: CSSProperties;
}

// Chip arredondado com entrada em mola (famílias olfativas, formatos da coleção)
export const Pill = ({ children, background, color, at, style }: PillProps) => {
  const enter = useEnter(at);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        borderRadius: 999,
        background,
        color,
        fontFamily: font.sans,
        fontWeight: 500,
        fontSize: 20,
        opacity: enter,
        transform: `translateY(${mix(14, 0, enter)}px) scale(${mix(0.9, 1, enter)})`,
        ...style,
      }}
    >
      {children}
    </span>
  );
};
