// Desenho do card SOTD (Fase 16B): 1080 x 1920, no próprio aparelho. Duas partes:
// - layout puro (posições e quebra de texto, com a medida de texto injetada): testável sem DOM;
// - desenho no canvas: lê as cores dos tokens com getComputedStyle (nenhum hex aqui).
import { AppError } from '@/constants/errors';
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_MIME,
  SHARE_CARD_QUALITY,
  SHARE_CARD_WIDTH,
  SHARE_CARD_WORDMARK,
  WEATHER_ICON_PATHS,
} from '@/constants/share';
import { imageSources } from '@/lib/images';
import type { SotdCardContent } from '@/lib/sotdCard';

export type MeasureText = (text: string, font: string) => number;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextLine {
  text: string;
  // Linha de base
  y: number;
}

export interface CardLayout {
  stage: Rect;
  brand: TextLine;
  name: TextLine[];
  concentration: TextLine;
  notesLabel: TextLine | null;
  notes: TextLine | null;
  badge: { y: number; text: string; icon: boolean } | null;
  date: TextLine;
  wordmark: TextLine;
  // Onde termina o conteúdo de cima (antes do selo de clima e da data)
  contentBottom: number;
  badgeTop: number;
}

export const CARD_MARGIN = 96;
export const CARD_CONTENT_WIDTH = SHARE_CARD_WIDTH - CARD_MARGIN * 2;
export const CARD_ICON_SIZE = 56;
export const CARD_NAME_MAX_LINES = 3;

export const CARD_FONTS = {
  brand: '500 34px Inter, system-ui, sans-serif',
  name: '500 92px Fraunces, Georgia, serif',
  concentration: '500 36px Inter, system-ui, sans-serif',
  notesLabel: '500 26px Inter, system-ui, sans-serif',
  notes: '500 44px Inter, system-ui, sans-serif',
  badge: '500 44px Inter, system-ui, sans-serif',
  date: '400 34px Inter, system-ui, sans-serif',
  wordmark: '500 56px Fraunces, Georgia, serif',
} as const;

const STAGE_TOP = 144;
const STAGE_HEIGHT = 820;
const NAME_LINE_HEIGHT = 104;
const BADGE_BASELINE = 1688;
const DATE_BASELINE = 1752;
const WORDMARK_BASELINE = 1848;
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

export const badgeText = (content: SotdCardContent): string | null => {
  const { weather } = content;
  if (!weather) return null;
  return weather.city ? `${weather.city} · ${weather.temperature}` : weather.temperature;
};

// Posições de tudo no card. O fluxo de cima desce a partir do palco; selo, data e wordmark ficam
// em posições fixas embaixo.
export const computeLayout = (content: SotdCardContent, measure: MeasureText): CardLayout => {
  const fit = (font: string) => (value: string) => measure(value, font);
  const stage: Rect = {
    x: CARD_MARGIN,
    y: STAGE_TOP,
    width: CARD_CONTENT_WIDTH,
    height: STAGE_HEIGHT,
  };

  const brandY = stage.y + stage.height + 88;
  const nameLines = wrapText(
    content.name,
    CARD_CONTENT_WIDTH,
    CARD_NAME_MAX_LINES,
    fit(CARD_FONTS.name)
  );
  const nameTop = brandY + 32;
  const name = nameLines.map((text, index) => ({
    text,
    y: nameTop + 92 + index * NAME_LINE_HEIGHT,
  }));
  const lastNameY = name[name.length - 1]?.y ?? nameTop;
  const concentrationY = lastNameY + 76;

  let cursor = concentrationY;
  let notesLabel: TextLine | null = null;
  let notes: TextLine | null = null;
  if (content.notes.length > 0) {
    if (content.notesByLayer) {
      cursor += 84;
      notesLabel = { text: 'Topo · Coração · Fundo', y: cursor };
      cursor += 56;
    } else {
      cursor += 80;
    }
    const [line = ''] = wrapText(
      content.notes.join(' · '),
      CARD_CONTENT_WIDTH,
      1,
      fit(CARD_FONTS.notes)
    );
    notes = { text: line, y: cursor };
  }

  const text = badgeText(content);
  return {
    stage,
    brand: { text: content.brand.toLocaleUpperCase('pt-BR'), y: brandY },
    name,
    concentration: { text: content.concentration, y: concentrationY },
    notesLabel,
    notes,
    badge: text ? { y: BADGE_BASELINE, text, icon: true } : null,
    date: { text: content.dateLabel, y: DATE_BASELINE },
    wordmark: { text: SHARE_CARD_WORDMARK, y: WORDMARK_BASELINE },
    contentBottom: cursor,
    badgeTop: BADGE_BASELINE - CARD_ICON_SIZE,
  };
};

// ---------------------------------------------------------------------------
// Desenho
// ---------------------------------------------------------------------------

interface Palette {
  surface: string;
  border: string;
  stage: string;
  stageHighlight: string;
  foreground: string;
  secondary: string;
  muted: string;
  primary: string;
  family: string | null;
}

const readPalette = (family: SotdCardContent['family']): Palette => {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  return {
    surface: token('--surface'),
    border: token('--border'),
    stage: token('--stage'),
    stageHighlight: token('--stage-highlight'),
    foreground: token('--foreground'),
    secondary: token('--text-secondary'),
    muted: token('--text-muted'),
    primary: token('--primary'),
    family: family ? token(`--chip-${family}`) : null,
  };
};

// Fraunces e Inter precisam estar carregadas antes de medir e desenhar (senão cai na fonte reserva)
const loadFonts = async (content: SotdCardContent): Promise<void> => {
  if (!document.fonts) return;
  const samples: [string, string][] = [
    [CARD_FONTS.name, content.name],
    [CARD_FONTS.wordmark, SHARE_CARD_WORDMARK],
    [CARD_FONTS.brand, content.brand],
    [CARD_FONTS.notes, `${content.notes.join(' ')} Topo Coração Fundo`],
    [CARD_FONTS.date, `${content.dateLabel} ${badgeText(content) ?? ''}`],
  ];
  try {
    await Promise.all(samples.map(([font, sample]) => document.fonts.load(font, sample)));
  } catch {
    // fonte reserva do sistema: o card sai, só menos fiel
  }
};

// O Storage público envia CORS, então o canvas segue exportável. Qualquer falha cai no placeholder.
const loadBottle = async (url: string | null): Promise<ImageBitmap | null> => {
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

const roundedRect = (context: CanvasRenderingContext2D, rect: Rect, radius: number) => {
  context.beginPath();
  if (typeof context.roundRect === 'function') {
    context.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
  } else {
    context.rect(rect.x, rect.y, rect.width, rect.height);
  }
};

const drawStage = (
  context: CanvasRenderingContext2D,
  rect: Rect,
  palette: Palette,
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
    gradient.addColorStop(0, palette.stageHighlight);
    gradient.addColorStop(1, palette.stage);
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
    context.fillStyle = palette.family ?? palette.stage;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
  context.restore();
};

const drawWeatherIcon = (
  context: CanvasRenderingContext2D,
  icon: keyof typeof WEATHER_ICON_PATHS,
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
  for (const path of WEATHER_ICON_PATHS[icon]) context.stroke(new Path2D(path));
  context.restore();
};

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new AppError('share_card_failed'))),
      SHARE_CARD_MIME,
      SHARE_CARD_QUALITY
    )
  );

export const renderSotdCard = async (content: SotdCardContent): Promise<Blob> => {
  await loadFonts(content);
  const canvas = document.createElement('canvas');
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new AppError('share_card_failed');

  const measure: MeasureText = (value, font) => {
    context.font = font;
    return context.measureText(value).width;
  };
  const layout = computeLayout(content, measure);
  const palette = readPalette(content.family);
  const bottle = await loadBottle(content.imageUrl);

  try {
    context.fillStyle = palette.surface;
    context.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
    context.strokeStyle = palette.border;
    context.lineWidth = 4;
    context.strokeRect(2, 2, SHARE_CARD_WIDTH - 4, SHARE_CARD_HEIGHT - 4);

    drawStage(context, layout.stage, palette, bottle);

    context.textBaseline = 'alphabetic';
    context.textAlign = 'left';
    const write = (line: { text: string; y: number }, font: string, color: string) => {
      context.font = font;
      context.fillStyle = color;
      context.fillText(line.text, CARD_MARGIN, line.y);
    };

    context.letterSpacing = '4px';
    write(layout.brand, CARD_FONTS.brand, palette.muted);
    context.letterSpacing = '0px';
    for (const line of layout.name) write(line, CARD_FONTS.name, palette.foreground);
    write(layout.concentration, CARD_FONTS.concentration, palette.primary);
    if (layout.notesLabel) write(layout.notesLabel, CARD_FONTS.notesLabel, palette.muted);
    if (layout.notes) write(layout.notes, CARD_FONTS.notes, palette.foreground);

    if (layout.badge && content.weather) {
      drawWeatherIcon(
        context,
        content.weather.icon,
        CARD_MARGIN,
        layout.badge.y - CARD_ICON_SIZE + 6,
        CARD_ICON_SIZE,
        palette.primary
      );
      context.font = CARD_FONTS.badge;
      context.fillStyle = palette.foreground;
      context.fillText(layout.badge.text, CARD_MARGIN + CARD_ICON_SIZE + 24, layout.badge.y);
    }
    write(layout.date, CARD_FONTS.date, palette.secondary);
    write(layout.wordmark, CARD_FONTS.wordmark, palette.primary);

    return await canvasToBlob(canvas);
  } finally {
    bottle?.close();
  }
};
