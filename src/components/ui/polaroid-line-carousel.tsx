// Origem: "polaroid-line-carousel" do 21st.dev (fotos instantâneas presas num fio que cede),
// adaptado ao Sillage (ver docs/DESIGN_SYSTEM.md): física em `lib/polaroidLine.ts`, só tokens
// (sem hex nem paisagens pintadas), sem autoplay, reduced motion sem balanço nem mola (o fio troca
// de foto na hora), alvos de 44 px, link real na foto ativa e carrossel acessível em pt-BR.
// A posição de cada foto é escrita direto no DOM a cada quadro (só `transform`), fora do React.
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { clamp, nearestAt, pad2, springStep, stringY, swingStep } from '@/lib/polaroidLine';
import { cn } from '@/lib/utils';

export interface PolaroidItem {
  id: string;
  title: string;
  caption: string;
  // Foto (ou o substituto dela); o componente só a enquadra
  media: ReactNode;
  // Com destino, a foto ativa vira link (as outras primeiro vêm para o centro)
  href?: string;
}

interface PolaroidLineCarouselProps {
  items: readonly PolaroidItem[];
  label: string;
  // Altura do palco (classe Tailwind, ex.: `h-112`)
  className?: string;
}

// Largura máxima de uma foto (px) e quanto o fio cede no meio (fração da altura do palco)
const MAX_CARD_WIDTH = 260;
const MIN_CARD_WIDTH = 140;
const SAG_RATIO = 0.1;
// Espaço entre fotos, em larguras de foto
const SPACING_RATIO = 1.08;
// Arrasto menor que isto ainda é um clique
const DRAG_THRESHOLD = 5;
const MAX_DT = 0.033;

interface Stage {
  width: number;
  height: number;
  card: number;
}

interface Drag {
  startX: number;
  startOffset: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  moved: boolean;
}

const INITIAL_STAGE: Stage = { width: 640, height: 448, card: MAX_CARD_WIDTH };

const stageOf = (element: HTMLElement): Stage => {
  const { width, height } = element.getBoundingClientRect();
  if (width === 0 || height === 0) return INITIAL_STAGE;
  const card = Math.round(
    clamp(Math.min(width * 0.42, height * 0.42), MIN_CARD_WIDTH, MAX_CARD_WIDTH)
  );
  return { width, height, card };
};

// Fotos presas num fio que cede. Arraste, setas do teclado e botões Anterior/Próximo trazem uma
// foto para o centro; ela balança no pregador conforme a velocidade. Só apresenta.
export function PolaroidLineCarousel({ items, label, className }: PolaroidLineCarouselProps) {
  const reduceMotion = useReducedMotion() === true;
  const count = items.length;
  const root = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const sim = useRef({
    offset: 0,
    velocity: 0,
    target: 0,
    angles: [] as number[],
    speeds: [] as number[],
  });
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<Stage>(INITIAL_STAGE);

  const spacing = stage.card * SPACING_RATIO;
  const sag = stage.height * SAG_RATIO;

  const goTo = useCallback(
    (index: number) => {
      const next = clamp(index, 0, Math.max(0, count - 1));
      activeRef.current = next;
      setActive(next);
      sim.current.target = next * spacing;
      // Reduced motion: sem mola, o fio vai direto para a foto
      if (reduceMotion) {
        sim.current.offset = sim.current.target;
        sim.current.velocity = 0;
      }
    },
    [count, spacing, reduceMotion]
  );

  // Mede o palco (e de novo quando ele muda de tamanho)
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => setStage(stageOf(element));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Se o espaçamento muda (girou a tela), o fio fica na foto ativa; a lista que encolhe também
  useEffect(() => {
    const limit = Math.max(0, count - 1);
    const index = Math.min(activeRef.current, limit);
    activeRef.current = index;
    sim.current.target = index * spacing;
    sim.current.offset = index * spacing;
  }, [spacing, count]);

  // A simulação: a cada quadro escreve o fio e a posição/ângulo de cada foto direto no DOM
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let visible = true;
    let frameId = 0;
    let previous = performance.now();
    const state = sim.current;
    const y0 = Math.max(40, stage.height * 0.2);

    const frame = (now: number) => {
      frameId = 0;
      if (!visible) return;
      const dt = Math.min(MAX_DT, (now - previous) / 1000);
      previous = now;
      const held = drag.current;
      let lineVelocity: number;
      if (held?.moved) {
        lineVelocity = held.velocity * 1000;
      } else if (reduceMotion) {
        lineVelocity = 0;
      } else {
        const before = state.offset;
        [state.offset, state.velocity] = springStep(state.offset, state.velocity, state.target, dt);
        lineVelocity = -(state.offset - before) / Math.max(dt, 1e-3);
      }
      const gain = reduceMotion ? 0 : 1;
      const nearest = nearestAt(state.offset, spacing, count);
      for (let i = 0; i < count; i++) {
        const card = cards.current[i];
        if (!card) continue;
        const x = stage.width / 2 + i * spacing - state.offset;
        if (x < -stage.card * 1.5 || x > stage.width + stage.card * 1.5) {
          card.style.visibility = 'hidden';
          continue;
        }
        card.style.visibility = 'visible';
        let angle = state.angles[i] ?? 0;
        let speed = state.speeds[i] ?? 0;
        [angle, speed] = swingStep(angle, speed, lineVelocity, dt, gain);
        // Brisa leve, mesmo parado (só com movimento permitido)
        if (gain > 0) angle += Math.sin(now / 1300 + i * 1.7) * 0.0009;
        state.angles[i] = angle;
        state.speeds[i] = speed;
        const y = stringY(x, stage.width, y0, sag) - 6;
        card.style.transform = `translate(${(x - stage.card / 2).toFixed(1)}px, ${y.toFixed(1)}px) rotate(${angle.toFixed(4)}rad)`;
        card.style.zIndex = String(i === nearest ? count + 1 : count - Math.abs(i - nearest));
      }
      path.current?.setAttribute(
        'd',
        `M0 ${y0} Q${stage.width / 2} ${y0 + 2 * sag} ${stage.width} ${y0}`
      );
      // Durante o arrasto a foto ativa acompanha a mais próxima do centro
      if (held?.moved && nearest !== activeRef.current) {
        activeRef.current = nearest;
        setActive(nearest);
      }
      frameId = requestAnimationFrame(frame);
    };

    // Fora da tela o laço para: não gasta bateria à toa
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible && frameId === 0) {
        previous = performance.now();
        frameId = requestAnimationFrame(frame);
      }
    });
    observer.observe(element);
    frameId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [stage, spacing, count, sag, reduceMotion]);

  const step = (direction: number) => goTo(activeRef.current + direction);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') step(1);
    else if (event.key === 'ArrowLeft') step(-1);
    else return;
    event.preventDefault();
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-no-drag]')) return;
    drag.current = {
      startX: event.clientX,
      startOffset: sim.current.offset,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
      moved: false,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const held = drag.current;
    if (!held) return;
    const delta = event.clientX - held.startX;
    if (!held.moved && Math.abs(delta) > DRAG_THRESHOLD) {
      held.moved = true;
      setDragging(true);
      root.current?.setPointerCapture(event.pointerId);
    }
    if (!held.moved) return;
    const dt = Math.max(1, event.timeStamp - held.lastTime);
    held.velocity = 0.7 * ((event.clientX - held.lastX) / dt) + 0.3 * held.velocity;
    held.lastX = event.clientX;
    held.lastTime = event.timeStamp;
    // Resistência nas pontas: o fio estica um pouco e volta
    const max = Math.max(0, count - 1) * spacing;
    let offset = held.startOffset - delta;
    if (offset < 0) offset *= 0.35;
    if (offset > max) offset = max + (offset - max) * 0.35;
    sim.current.offset = offset;
  };

  const handlePointerEnd = () => {
    const held = drag.current;
    drag.current = null;
    if (!held?.moved) return;
    setDragging(false);
    // O soltar do mouse/dedo não pode virar clique no link sob o cursor
    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);
    sim.current.velocity = -held.velocity * 1000;
    goTo(nearestAt(sim.current.offset - held.velocity * 180, spacing, count));
  };

  // Foto fora do centro: o clique a traz para o centro; só a ativa abre o link
  const handleCardClick = (event: MouseEvent, index: number) => {
    if (suppressClick.current) {
      event.preventDefault();
      return;
    }
    if (index !== activeRef.current) {
      event.preventDefault();
      goTo(index);
    }
  };

  const current = items[active];

  return (
    <section
      ref={root}
      aria-roledescription="carrossel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      className={cn(
        'relative h-112 w-full touch-pan-y overflow-hidden rounded-xl bg-background text-foreground outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        dragging ? 'cursor-grabbing' : 'cursor-grab',
        className
      )}
    >
      <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
        <path
          ref={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-muted-foreground"
        />
      </svg>

      {items.map((item, index) => {
        const isActive = index === active;
        const body = (
          <>
            <span
              aria-hidden
              className="absolute -top-3 left-1/2 z-10 h-5 w-2 -translate-x-1/2 rounded-sm bg-primary shadow-subtle"
            />
            <span className="block aspect-square overflow-hidden rounded-sm bg-stage">
              {item.media}
            </span>
            <span className="flex h-11 items-center justify-center px-1 font-heading text-base font-medium">
              <span className="truncate">{item.title}</span>
            </span>
          </>
        );
        const frame = cn(
          'relative mt-2.5 block rounded-sm border bg-card p-2.5 pb-0 text-card-foreground shadow-card transition-[transform,opacity] duration-300 motion-reduce:transition-none',
          !isActive && 'scale-90 opacity-70'
        );
        return (
          <div
            key={item.id}
            ref={(element) => {
              cards.current[index] = element;
            }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${count}: ${item.title}`}
            style={{ width: stage.card }}
            className="absolute top-0 left-0 origin-top will-change-transform"
          >
            {item.href ? (
              <Link
                to={item.href}
                draggable={false}
                tabIndex={isActive ? 0 : -1}
                onClick={(event) => handleCardClick(event, index)}
                className={cn(
                  frame,
                  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
                )}
              >
                {body}
              </Link>
            ) : (
              <div className={frame} onClick={(event) => handleCardClick(event, index)}>
                {body}
              </div>
            )}
          </div>
        );
      })}

      <div
        data-no-drag
        className="absolute inset-x-4 bottom-4 flex cursor-default items-center gap-3 sm:inset-x-6"
      >
        <p className="min-w-0 flex-1 truncate text-sm text-text-secondary">{current?.caption}</p>
        <span aria-hidden className="text-xs tracking-widest text-text-secondary tabular-nums">
          <b className="font-medium text-foreground">{pad2(active + 1)}</b> / {pad2(count)}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Anterior"
          disabled={active <= 0}
          onClick={() => step(-1)}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Próximo"
          disabled={active >= count - 1}
          onClick={() => step(1)}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>

      <p aria-live="polite" className="sr-only">
        {`Foto ${active + 1} de ${count}${current ? `: ${current.title}` : ''}`}
      </p>
    </section>
  );
}
