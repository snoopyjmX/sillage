// Desenho do card da retrospectiva (Fase 23): 1080 x 1920, no próprio aparelho, como o card SOTD.
// Layout puro (posições e quebra de texto, com a medida injetada) separado do desenho no canvas.
import { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH, SHARE_CARD_WORDMARK } from '@/constants/share';
import {
  canvasToBlob,
  createCardCanvas,
  drawStage,
  loadBottle,
  loadFonts,
  readToken,
  wrapText,
  type MeasureText,
  type Rect,
  type TextLine,
} from '@/lib/canvas';
import type { RecapCardContent } from '@/lib/recapCard';

export const RECAP_MARGIN = 96;
export const RECAP_CONTENT_WIDTH = SHARE_CARD_WIDTH - RECAP_MARGIN * 2;
export const RECAP_NAME_MAX_LINES = 2;

export const RECAP_FONTS = {
  eyebrow: '500 34px Inter, system-ui, sans-serif',
  year: '500 160px Fraunces, Georgia, serif',
  days: '500 72px Fraunces, Georgia, serif',
  consistency: '500 44px Inter, system-ui, sans-serif',
  brand: '500 34px Inter, system-ui, sans-serif',
  name: '500 84px Fraunces, Georgia, serif',
  caption: '400 38px Inter, system-ui, sans-serif',
  season: '500 40px Inter, system-ui, sans-serif',
  note: '500 44px Inter, system-ui, sans-serif',
  wordmark: '500 56px Fraunces, Georgia, serif',
} as const;

const EYEBROW_BASELINE = 176;
const YEAR_BASELINE = 340;
const DAYS_BASELINE = 450;
const CONSISTENCY_BASELINE = 524;
const STAGE_TOP = 604;
const STAGE_HEIGHT = 440;
const NAME_LINE_HEIGHT = 96;
const SEASON_STEP = 62;
// Distância da última estação até a nota do ano
const NOTE_GAP = 84;
const WORDMARK_BASELINE = 1848;

interface PlacedLine extends TextLine {
  x?: number;
}

export interface RecapLayout {
  eyebrow: TextLine;
  year: TextLine;
  days: TextLine;
  consistency: TextLine;
  // Sem assinatura (não deve ocorrer com dias suficientes), não há palco nem nome
  stage: Rect | null;
  brand: TextLine | null;
  name: TextLine[];
  signatureDays: TextLine | null;
  seasons: { label: PlacedLine; perfume: PlacedLine }[];
  note: TextLine | null;
  wordmark: TextLine;
}

export const computeRecapLayout = (
  content: RecapCardContent,
  measure: MeasureText
): RecapLayout => {
  const fit = (font: string) => (value: string) => measure(value, font);
  const [daysLine = ''] = wrapText(
    content.daysLabel,
    RECAP_CONTENT_WIDTH,
    1,
    fit(RECAP_FONTS.days)
  );

  let stage: Rect | null = null;
  let brand: TextLine | null = null;
  let name: TextLine[] = [];
  let signatureDays: TextLine | null = null;
  let cursor = STAGE_TOP + STAGE_HEIGHT;
  if (content.signature) {
    stage = { x: RECAP_MARGIN, y: STAGE_TOP, width: RECAP_CONTENT_WIDTH, height: STAGE_HEIGHT };
    brand = { text: content.signature.brand.toLocaleUpperCase('pt-BR'), y: cursor + 76 };
    const nameTop = brand.y + 24;
    name = wrapText(
      content.signature.name,
      RECAP_CONTENT_WIDTH,
      RECAP_NAME_MAX_LINES,
      fit(RECAP_FONTS.name)
    ).map((text, index) => ({ text, y: nameTop + 76 + index * NAME_LINE_HEIGHT }));
    cursor = name[name.length - 1]?.y ?? nameTop;
    signatureDays = { text: `Assinatura do ano · ${content.signature.daysLabel}`, y: cursor + 60 };
    cursor = signatureDays.y;
  }

  // Estações: o rótulo à esquerda e o perfume numa coluna alinhada logo depois
  const seasonsTop = cursor + 84;
  const labelWidth = Math.max(
    0,
    ...content.seasons.map((season) => measure(season.label, RECAP_FONTS.season))
  );
  const perfumeX = RECAP_MARGIN + labelWidth + 32;
  const seasons = content.seasons.map((season, index) => {
    const y = seasonsTop + index * SEASON_STEP;
    const [perfume = ''] = wrapText(
      season.perfume ?? 'Sem registros',
      SHARE_CARD_WIDTH - RECAP_MARGIN - perfumeX,
      1,
      fit(RECAP_FONTS.season)
    );
    return { label: { text: season.label, y }, perfume: { text: perfume, y, x: perfumeX } };
  });

  const [noteLine = ''] = wrapText(
    content.topNote ? `Nota do ano · ${content.topNote}` : '',
    RECAP_CONTENT_WIDTH,
    1,
    fit(RECAP_FONTS.note)
  );

  return {
    eyebrow: { text: 'SEU ANO EM PERFUMES', y: EYEBROW_BASELINE },
    year: { text: String(content.year), y: YEAR_BASELINE },
    days: { text: daysLine, y: DAYS_BASELINE },
    consistency: { text: content.consistencyLabel, y: CONSISTENCY_BASELINE },
    stage,
    brand,
    name,
    signatureDays,
    seasons,
    note: noteLine
      ? { text: noteLine, y: (seasons.at(-1)?.label.y ?? seasonsTop) + NOTE_GAP }
      : null,
    wordmark: { text: SHARE_CARD_WORDMARK, y: WORDMARK_BASELINE },
  };
};

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

const readPalette = (family: RecapCardContent['family']): Palette => ({
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

export const renderRecapCard = async (content: RecapCardContent): Promise<Blob> => {
  await loadFonts([
    [RECAP_FONTS.year, String(content.year)],
    [RECAP_FONTS.days, content.daysLabel],
    [RECAP_FONTS.name, content.signature?.name ?? ''],
    [RECAP_FONTS.wordmark, SHARE_CARD_WORDMARK],
    [RECAP_FONTS.season, content.seasons.map((s) => `${s.label} ${s.perfume ?? ''}`).join(' ')],
    [RECAP_FONTS.note, content.topNote ?? ''],
    [RECAP_FONTS.eyebrow, `SEU ANO EM PERFUMES ${content.consistencyLabel}`],
  ]);
  const { canvas, context, measure } = createCardCanvas();
  const layout = computeRecapLayout(content, measure);
  const palette = readPalette(content.family);
  const bottle = await loadBottle(content.signature?.imageUrl ?? null);

  try {
    context.fillStyle = palette.surface;
    context.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
    context.strokeStyle = palette.border;
    context.lineWidth = 4;
    context.strokeRect(2, 2, SHARE_CARD_WIDTH - 4, SHARE_CARD_HEIGHT - 4);

    if (layout.stage) {
      drawStage(
        context,
        layout.stage,
        { stage: palette.stage, stageHighlight: palette.stageHighlight, fallback: palette.family },
        bottle
      );
    }

    context.textBaseline = 'alphabetic';
    context.textAlign = 'left';
    const write = (line: PlacedLine, font: string, color: string) => {
      context.font = font;
      context.fillStyle = color;
      context.fillText(line.text, line.x ?? RECAP_MARGIN, line.y);
    };

    context.letterSpacing = '4px';
    write(layout.eyebrow, RECAP_FONTS.eyebrow, palette.muted);
    if (layout.brand) write(layout.brand, RECAP_FONTS.brand, palette.muted);
    context.letterSpacing = '0px';
    write(layout.year, RECAP_FONTS.year, palette.primary);
    write(layout.days, RECAP_FONTS.days, palette.foreground);
    write(layout.consistency, RECAP_FONTS.consistency, palette.secondary);
    for (const line of layout.name) write(line, RECAP_FONTS.name, palette.foreground);
    if (layout.signatureDays) write(layout.signatureDays, RECAP_FONTS.caption, palette.secondary);
    for (const season of layout.seasons) {
      write(season.label, RECAP_FONTS.season, palette.muted);
      write(season.perfume, RECAP_FONTS.season, palette.foreground);
    }
    if (layout.note) write(layout.note, RECAP_FONTS.note, palette.primary);
    write(layout.wordmark, RECAP_FONTS.wordmark, palette.primary);

    return await canvasToBlob(canvas);
  } finally {
    bottle?.close();
  }
};
