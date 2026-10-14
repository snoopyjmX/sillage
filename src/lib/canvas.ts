// Primitivas de canvas compartilhadas pelos cards de compartilhamento (SOTD, Fase 16B, e a
// retrospectiva, Fase 23): quebra de texto, fontes, imagens, formas e exportação do JPEG.
// Nada daqui conhece o conteúdo de um card específico; as cores vêm dos tokens (nenhum hex).
import { AppError } from '@/constants/errors';
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_MIME,
  SHARE_CARD_QUALITY,
  SHARE_CARD_WIDTH,
} from '@/constants/share';
import { imageSources } from '@/lib/images';

export type MeasureText = (text: string, font: string) => number;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextLine {
  text: string;
  // Linha de base
  y: number;
}

const ELLIPSIS = '…';

// Quebra gulosa por palavras. Palavra maior que a linha é cortada por caracteres. Passou de
// `maxLines`, a última linha termina em reticências.
export const wrapText = (
  text: string,
  maxWidth: number,
  maxLines: number,
  measure: (value: string) => number
): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  const push = (value: string) => {
    lines.push(value);
    current = '';
  };

  for (const word of words) {
    let rest = word;
    // Palavra sozinha maior que a linha: corta por caracteres
    while (measure(rest) > maxWidth && rest.length > 1) {
      let cut = rest.length - 1;
      while (cut > 1 && measure(rest.slice(0, cut)) > maxWidth) cut -= 1;
      if (current !== '') push(current);
      push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    const candidate = current === '' ? rest : `${current} ${rest}`;
    if (measure(candidate) <= maxWidth) {
      current = candidate;
    } else {
      push(current);
      current = rest;
    }
  }
  if (current !== '') push(current);

  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1] ?? '';
  while (last.length > 0 && measure(`${last}${ELLIPSIS}`) > maxWidth) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last.trimEnd()}${ELLIPSIS}`;
  return kept;
};

// Canvas 1080 x 1920 e o contexto 2D (sem contexto, o card não sai)
export const createCardCanvas = (): {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  measure: MeasureText;
} => {
  const canvas = document.createElement('canvas');
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new AppError('share_card_failed');
  const measure: MeasureText = (value, font) => {
    context.font = font;
    return context.measureText(value).width;
  };
  return { canvas, context, measure };
};

// Valor de um token de cor (ex.: '--surface') no tema ativo
export const readToken = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Fraunces e Inter precisam estar carregadas antes de medir e desenhar (senão cai na fonte reserva)
export const loadFonts = async (samples: readonly (readonly [font: string, text: string])[]) => {
  if (!document.fonts) return;
  try {
    await Promise.all(samples.map(([font, sample]) => document.fonts.load(font, sample)));
  } catch {
    // fonte reserva do sistema: o card sai, só menos fiel
  }
};

// O Storage público envia CORS, então o canvas segue exportável. Qualquer falha devolve null
// (quem chama desenha o placeholder).
export const loadBottle = async (url: string | null): Promise<ImageBitmap | null> => {
  for (const source of imageSources(url, 'large')) {
    try {
      const response = await fetch(source, { mode: 'cors' });
      if (response.ok) return await createImageBitmap(await response.blob());
    } catch {
      // tenta a próxima fonte
    }
  }
  return null;
};

export const roundedRect = (context: CanvasRenderingContext2D, rect: Rect, radius: number) => {
  context.beginPath();
  if (typeof context.roundRect === 'function') {
    context.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
  } else {
    context.rect(rect.x, rect.y, rect.width, rect.height);
  }
};

export interface StageColors {
  stage: string;
  stageHighlight: string;
  // Sem foto, o palco vira esta cor (a da família) ou, se não houver, a do próprio palco
  fallback: string | null;
}

// Palco do frasco: gradiente radial com o frasco centralizado, ou a cor da família sem foto
export const drawStage = (
  context: CanvasRenderingContext2D,
  rect: Rect,
  colors: StageColors,
  bottle: ImageBitmap | null
) => {
  const radius = 40;
  context.save();
  roundedRect(context, rect, radius);
  context.clip();
  if (bottle) {
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, rect.width * 0.75);
    gradient.addColorStop(0, colors.stageHighlight);
    gradient.addColorStop(1, colors.stage);
    context.fillStyle = gradient;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    const pad = 48;
    const scale = Math.min(
      (rect.width - pad * 2) / bottle.width,
      (rect.height - pad * 2) / bottle.height
    );
    const width = bottle.width * scale;
    const height = bottle.height * scale;
    context.drawImage(bottle, cx - width / 2, cy - height / 2, width, height);
  } else {
    context.fillStyle = colors.fallback ?? colors.stage;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
  context.restore();
};

// Ícone do Lucide (grade 24, traço 2) desenhado a partir dos caminhos SVG
export const drawStrokeIcon = (
  context: CanvasRenderingContext2D,
  paths: readonly string[],
  x: number,
  y: number,
  size: number,
  color: string
) => {
  context.save();
  context.translate(x, y);
  context.scale(size / 24, size / 24);
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  for (const path of paths) context.stroke(new Path2D(path));
  context.restore();
};

export const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new AppError('share_card_failed'))),
      SHARE_CARD_MIME,
      SHARE_CARD_QUALITY
    )
  );
