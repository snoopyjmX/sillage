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
  const [count, setCount] = useState(0);
  const done = reduceMotion || count >= text.length;
  const typed = reduceMotion ? text : text.slice(0, count);

  useEffect(() => {
    if (reduceMotion) return;
    let interval: number | undefined;
    const timeout = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setCount((current) => {
          if (current + 1 >= text.length) window.clearInterval(interval);
          return current + 1;
        });
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
