// Origem: própria. Alterna claro -> escuro -> sistema.
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { THEMES, type Theme } from '@/lib/theme';
import { Button } from './button';

const ICONS = { light: Sun, dark: Moon, system: Monitor } as const;
const LABELS: Record<Theme, string> = { light: 'Claro', dark: 'Escuro', system: 'Sistema' };

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = ICONS[theme];
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length] ?? 'system';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Tema: ${LABELS[theme]}. Alternar para ${LABELS[next].toLowerCase()}`}
      onClick={() => setTheme(next)}
    >
      <Icon aria-hidden />
    </Button>
  );
}
