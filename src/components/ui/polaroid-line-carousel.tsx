// Origem: inspirado no "polaroid-line-carousel" do 21st.dev e reescrito para o Sillage (ver
// docs/DESIGN_SYSTEM.md): só tokens, `motion/react` com `transform`, reduced motion sem inclinação
// nem movimento, alvos de 44 px e carrossel acessível. A rolagem é a nativa do navegador (toque,
// roda e teclado), com `scroll-snap`; o mouse também arrasta.
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { transitions } from '@/lib/motion';
import { cn } from '@/lib/utils';

export interface PolaroidItem {
  id: string;
  title: string;
  caption: string;
  // Foto (ou o substituto dela); o componente só a enquadra
  media: ReactNode;
  // Com destino, a foto inteira vira link
  href?: string;
}

interface PolaroidLineCarouselProps {
  items: readonly PolaroidItem[];
  label: string;
  className?: string;
}

// Inclinação (graus) de cada foto no varal; repete em ciclo. Parada em reduced motion.
const TILTS = [-2, 1.5, -1, 2] as const;
// Fração da largura visível que um clique em Anterior/Próximo percorre
const PAGE_FRACTION = 0.8;
// Arrasto menor que isto ainda é um clique
const DRAG_THRESHOLD = 5;

function Polaroid({
  item,
  index,
  total,
  reduceMotion,
}: {
  item: PolaroidItem;
  index: number;
  total: number;
  reduceMotion: boolean;
}) {
  const tilt = reduceMotion ? 0 : (TILTS[index % TILTS.length] ?? 0);
  const body = (
    <>
      <span
        aria-hidden
        className="absolute -top-3 left-1/2 z-10 h-5 w-2 -translate-x-1/2 rounded-sm bg-primary shadow-subtle"
      />
      <span className="block aspect-square overflow-hidden rounded-sm bg-stage">{item.media}</span>
      <span className="mt-2 block truncate font-heading text-sm font-medium text-foreground">
        {item.title}
      </span>
      <span className="block truncate text-xs text-text-secondary">{item.caption}</span>
    </>
  );
  const frame =
    'relative block w-44 rounded-md border bg-card p-2 pb-3 shadow-card sm:w-52 origin-top';
  return (
    <li
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} de ${total}: ${item.title}`}
      className="shrink-0 snap-center pt-3"
    >
      <motion.div
        initial={false}
        animate={{ rotate: tilt }}
        whileHover={reduceMotion ? undefined : { rotate: 0, y: 4 }}
        transition={transitions.short}
      >
        {item.href ? (
          <Link
            to={item.href}
            draggable={false}
            className={cn(
              frame,
              'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
            )}
          >
            {body}
          </Link>
        ) : (
          <div className={frame}>{body}</div>
        )}
      </motion.div>
    </li>
  );
}

// Fotos presas num varal, em linha rolável. Só apresenta: tudo chega pronto por props.
export function PolaroidLineCarousel({ items, label, className }: PolaroidLineCarouselProps) {
  const reduceMotion = useReducedMotion() === true;
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const [dragging, setDragging] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: items.length <= 1 });

  const measure = useCallback(() => {
    const element = track.current;
    if (!element) return;
    const start = element.scrollLeft <= 1;
    const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 1;
    setEdges((current) =>
      current.start === start && current.end === end ? current : { start, end }
    );
  }, []);

  // Mede também quando o tamanho muda (fotos que carregam, giro da tela). O observer chama
  // `measure` no callback, não no corpo do efeito.
  useEffect(() => {
    const element = track.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure]);

  const scrollByPage = (direction: -1 | 1) => {
    const element = track.current;
    if (!element || typeof element.scrollBy !== 'function') return;
    element.scrollBy({
      left: direction * element.clientWidth * PAGE_FRACTION,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollByPage(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollByPage(-1);
    }
  };

  // Só o mouse arrasta; toque e caneta usam a rolagem nativa
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const element = track.current;
    if (event.pointerType !== 'mouse' || event.button !== 0 || !element) return;
    drag.current = {
      active: true,
      startX: event.clientX,
      startScroll: element.scrollLeft,
      moved: false,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const element = track.current;
    if (!drag.current.active || !element) return;
    const delta = event.clientX - drag.current.startX;
    if (!drag.current.moved && Math.abs(delta) > DRAG_THRESHOLD) {
      drag.current.moved = true;
      setDragging(true);
    }
    if (drag.current.moved) element.scrollLeft = drag.current.startScroll - delta;
  };

  const endDrag = () => {
    drag.current.active = false;
    setDragging(false);
  };

  return (
    <section
      aria-roledescription="carrossel"
      aria-label={label}
      className={cn('flex flex-col gap-3', className)}
    >
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Anterior"
          disabled={edges.start}
          onClick={() => scrollByPage(-1)}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Próximo"
          disabled={edges.end}
          onClick={() => scrollByPage(1)}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>

      <div
        ref={track}
        tabIndex={0}
        aria-label={`${label}: use as setas para percorrer`}
        onKeyDown={handleKeyDown}
        onScroll={measure}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(event) => {
          // Depois de arrastar, o soltar do mouse não pode abrir o link sob o cursor
          if (drag.current.moved) {
            event.preventDefault();
            event.stopPropagation();
            drag.current.moved = false;
          }
        }}
        className={cn(
          'overflow-x-auto rounded-xl pb-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          dragging ? 'cursor-grabbing snap-none' : 'cursor-grab snap-x snap-mandatory'
        )}
      >
        <ul
          className={cn(
            'relative flex w-max min-w-full gap-4 px-4 pt-2',
            // O varal: uma linha atrás das fotos, por toda a largura
            'before:absolute before:inset-x-0 before:top-3 before:h-0.5 before:bg-border'
          )}
        >
          {items.map((item, index) => (
            <Polaroid
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              reduceMotion={reduceMotion}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
