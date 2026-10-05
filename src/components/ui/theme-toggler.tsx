// Origem: 21st.dev (AnimatedThemeToggler). Adaptado pela curadoria da Seção 10: usa o tema do
// app (ThemeProvider, classe .dark do Tailwind) em vez de mexer no <html> por conta própria;
// sem cores fixas (herda do Button); a transição é a troca suave (fade) da View Transitions API,
// sem o círculo em clip-path (só transform e opacity); sem transição em reduced motion ou sem API.
import { Moon, Sun } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { flushSync } from 'react-dom';
import { useTheme } from '@/hooks/useTheme';
import { applyTheme, type ResolvedTheme } from '@/lib/theme';
import { Button } from './button';

export function ThemeToggler() {
  const { resolvedTheme, setTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const isDark = resolvedTheme === 'dark';
  const Icon = isDark ? Sun : Moon;

  const handleClick = () => {
    const next: ResolvedTheme = isDark ? 'light' : 'dark';
    const commit = () => {
      // O DOM precisa estar no tema novo quando a transição tirar o "depois"
      applyTheme(next);
      flushSync(() => setTheme(next));
    };
    if (reduceMotion || typeof document.startViewTransition !== 'function') {
      commit();
      return;
    }
    document.startViewTransition(commit);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      data-slot="theme-toggler"
      aria-label={isDark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      onClick={handleClick}
    >
      <Icon aria-hidden />
    </Button>
  );
}
