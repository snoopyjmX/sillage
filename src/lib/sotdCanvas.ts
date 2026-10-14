// Desenho do card SOTD (Fase 16B): 1080 x 1920, no próprio aparelho. Duas partes:
// - layout puro (posições e quebra de texto, com a medida de texto injetada): testável sem DOM;
// - desenho no canvas: lê as cores dos tokens com getComputedStyle (nenhum hex aqui).
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
  SHARE_CARD_WORDMARK,
  WEATHER_ICON_PATHS,
} from '@/constants/share';
import {
  canvasToBlob,
  createCardCanvas,
  drawStage,
  drawStrokeIcon,
  loadBottle,
  loadFonts,
  readToken,
  wrapText,
  type MeasureText,
  type Rect,
  type TextLine,
} from '@/lib/canvas';
import type { SotdCardContent } from '@/lib/sotdCard';

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

const readPalette = (family: SotdCardContent['family']): Palette => ({
  surface: readToken('--surface'),
  border: readToken('--border'),
  stage: readToken('--stage'),
  stageHighlight: readToken('--stage-highlight'),
  foreground: readToken('--foreground'),
  secondary: readToken('--text-secondary'),
  muted: readToken('--text-muted'),
  primary: readToken('--primary'),
  family: family ? readToken(`--chip-${family}`) : null,
});

const loadSotdFonts = (content: SotdCardContent) =>
  loadFonts([
    [CARD_FONTS.name, content.name],
    [CARD_FONTS.wordmark, SHARE_CARD_WORDMARK],
    [CARD_FONTS.brand, content.brand],
    [CARD_FONTS.notes, `${content.notes.join(' ')} Topo Coração Fundo`],
    [CARD_FONTS.date, `${content.dateLabel} ${badgeText(content) ?? ''}`],
  ]);

export const renderSotdCard = async (content: SotdCardContent): Promise<Blob> => {
  await loadSotdFonts(content);
  const { canvas, context, measure } = createCardCanvas();
  const layout = computeLayout(content, measure);
  const palette = readPalette(content.family);
  const bottle = await loadBottle(content.imageUrl);

  try {
    context.fillStyle = palette.surface;
    context.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
    context.strokeStyle = palette.border;
    context.lineWidth = 4;
    context.strokeRect(2, 2, SHARE_CARD_WIDTH - 4, SHARE_CARD_HEIGHT - 4);

    drawStage(
      context,
      layout.stage,
      { stage: palette.stage, stageHighlight: palette.stageHighlight, fallback: palette.family },
      bottle
    );

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
      drawStrokeIcon(
        context,
        WEATHER_ICON_PATHS[content.weather.icon],
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
