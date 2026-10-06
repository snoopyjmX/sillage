// Origem: 21st.dev (TypingAnimation). Adaptado pela curadoria da Seção 10: o texto completo fica
// para leitores de tela (a digitação é só visual, `aria-hidden`), o espaço do texto é reservado
// para não deslocar o layout, o cursor pisca só por opacity e tudo aparece pronto em reduced motion.
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState, type ElementType } from 'react';
import { cn } from '@/lib/utils';

const TYPING_SPEED_MS = 60;

interface TypingAnimationProps {
  children: string;
  className?: string;
  as?: ElementType;
  // Atraso antes de começar, em ms
  startDelay?: number;
  speed?: number;
  cursor?: boolean;
}

export function TypingAnimation({
  children: text,
  className,
  as: Component = 'span',
  startDelay = 0,
  speed = TYPING_SPEED_MS,
  cursor = true,
}: TypingAnimationProps) {
  const reduceMotion = useReducedMotion();
  // O progresso guarda o texto a que pertence: ao chegar outro texto, a digitação recomeça do zero
  const [progress, setProgress] = useState({ text, count: 0 });
  const count = progress.text === text ? progress.count : 0;
  const done = reduceMotion || count >= text.length;
  const typed = reduceMotion ? text : text.slice(0, count);

  useEffect(() => {
    if (reduceMotion) return;
    let interval: number | undefined;
    const timeout = window.setTimeout(() => {
      const startedAt = performance.now();
      // Posição calculada pelo relógio (não por contagem de ticks): abas em segundo plano, que
      // atrasam os timers, não deixam a digitação lenta nem parada no meio
      interval = window.setInterval(() => {
        const next = Math.min(text.length, Math.floor((performance.now() - startedAt) / speed) + 1);
        setProgress((current) =>
          current.text === text && current.count === next ? current : { text, count: next }
        );
        if (next >= text.length) window.clearInterval(interval);
      }, speed);
    }, startDelay);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [reduceMotion, text, speed, startDelay]);

  return (
    <Component data-slot="typing-animation" className={cn(className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {typed}
        {cursor && !reduceMotion && (
          <motion.span
            className="-mr-0.5 ml-0.5 inline-block h-[0.9em] w-0.5 translate-y-[0.1em] bg-primary"
            animate={{ opacity: done ? [1, 0, 1] : 1 }}
            transition={done ? { duration: 1, repeat: Infinity } : { duration: 0 }}
          />
        )}
        <span className="invisible">{text.slice(typed.length)}</span>
      </span>
    </Component>
  );
}
