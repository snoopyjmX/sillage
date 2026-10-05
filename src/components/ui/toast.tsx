// Origem: shadcn/ui (sonner). O disparo fica em @/lib/toast. Sonner anima por CSS
// (transform/opacity) e respeita prefers-reduced-motion por conta própria.
import type { CSSProperties } from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useTheme } from '@/hooks/useTheme';

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme}
      position="top-center"
      richColors
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--success-bg': 'var(--popover)',
          '--success-text': 'var(--success)',
          '--success-border': 'var(--border)',
          '--warning-bg': 'var(--popover)',
          '--warning-text': 'var(--warning)',
          '--warning-border': 'var(--border)',
          '--error-bg': 'var(--popover)',
          '--error-text': 'var(--error)',
          '--error-border': 'var(--border)',
          '--border-radius': 'var(--radius-lg)',
        } as CSSProperties
      }
      {...props}
    />
  );
}
