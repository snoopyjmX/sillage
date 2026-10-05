// Valida contraste WCAG dos tokens de src/styles/tokens.css (sem dependências).
// Uso: npm run check:contrast
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CSS_PATH = fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url));
const css = readFileSync(CSS_PATH, 'utf8');

const FAMILIES = [
  'citrus',
  'floral',
  'woody',
  'green',
  'aquatic',
  'oriental',
  'spicy',
  'fruity',
  'aromatic',
  'musky',
];

// --- leitura dos blocos :root (claro) e .dark ---------------------------------
const block = (selector) => {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Bloco ${selector} não encontrado em tokens.css`);
  const end = css.indexOf('\n}', start);
  return css.slice(start, end);
};

const parseVars = (text) => {
  const vars = {};
  for (const m of text.matchAll(/^\s*(--[\w-]+)\s*:\s*([^;]+);/gm)) vars[m[1]] = m[2].trim();
  return vars;
};

const light = parseVars(block(':root'));
const dark = { ...light, ...parseVars(block('.dark')) };
const MODES = { claro: light, escuro: dark };

// --- cores --------------------------------------------------------------------
const parseColor = (value, vars, depth = 0) => {
  if (depth > 10) throw new Error(`Referência circular em ${value}`);
  const v = value.trim();
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  if (ref) {
    if (!(ref[1] in vars)) throw new Error(`Token ${ref[1]} não definido`);
    return parseColor(vars[ref[1]], vars, depth + 1);
  }
  const hex = v.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const rgba = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (rgba)
    return { r: +rgba[1], g: +rgba[2], b: +rgba[3], a: rgba[4] === undefined ? 1 : +rgba[4] };
  throw new Error(`Formato de cor não suportado: ${v}`);
};

// mistura de alfa sobre um fundo opaco
const over = (fg, bg) => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a),
  g: fg.g * fg.a + bg.g * (1 - fg.a),
  b: fg.b * fg.a + bg.b * (1 - fg.a),
  a: 1,
});

const channel = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ({ r, g, b }) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// --- checagens ----------------------------------------------------------------
const results = [];
const check = (mode, label, fgName, bgName, min, vars, backdropName = 'card') => {
  const backdrop = parseColor(`var(--${backdropName})`, vars);
  const bg = over(parseColor(`var(--${bgName})`, vars), backdrop);
  const fg = over(parseColor(`var(--${fgName})`, vars), bg);
  const value = ratio(fg, bg);
  results.push({ mode, label, fgName, bgName, min, value, pass: value >= min });
};

for (const [mode, vars] of Object.entries(MODES)) {
  // Texto (4,5:1) sobre fundo e superfície
  for (const text of ['foreground', 'text-secondary', 'text-muted']) {
    for (const bg of ['background', 'surface']) check(mode, 'texto', text, bg, 4.5, vars);
  }
  // Pares de componentes
  check(mode, 'botão primário', 'primary-foreground', 'primary', 4.5, vars);
  check(mode, 'botão destrutivo', 'destructive-foreground', 'destructive', 4.5, vars);
  check(mode, 'secundário', 'secondary-foreground', 'secondary', 4.5, vars, 'background');
  check(mode, 'acento', 'accent-foreground', 'accent', 4.5, vars, 'background');
  check(mode, 'texto suave no muted', 'muted-foreground', 'muted', 4.5, vars, 'background');
  check(mode, 'popover', 'popover-foreground', 'popover', 4.5, vars);
  // Primary como texto/link (4,5:1) e como elemento gráfico/foco (3:1)
  for (const bg of ['background', 'surface']) {
    check(mode, 'primary como texto', 'primary', bg, 4.5, vars);
    check(mode, 'primary gráfico/foco', 'primary', bg, 3, vars);
    check(mode, 'borda de campo', 'input', bg, 3, vars, bg);
  }
  // Feedback como texto sobre a superfície e o fundo
  for (const fb of ['success', 'warning', 'error']) {
    for (const bg of ['surface', 'background']) check(mode, 'feedback', fb, bg, 4.5, vars);
  }
  // Chips de família (alfa dos escuros mistura sobre o card)
  for (const f of FAMILIES)
    check(mode, `chip ${f}`, `chip-${f}-foreground`, `chip-${f}`, 4.5, vars);
  // Selo de concentração
  check(
    mode,
    'selo de concentração',
    'badge-concentration-foreground',
    'badge-concentration',
    4.5,
    vars
  );
}

// --- relatório ----------------------------------------------------------------
const pad = (s, n) => String(s).padEnd(n);
console.log(`Contraste WCAG (${CSS_PATH.replace(process.cwd() + '/', '')})\n`);
console.log(
  `${pad('modo', 7)}${pad('verificação', 26)}${pad('texto/elemento', 34)}${pad('sobre', 24)}${pad('mín', 6)}razão`
);
for (const r of results) {
  const mark = r.pass ? 'ok  ' : 'FALHA';
  console.log(
    `${pad(r.mode, 7)}${pad(r.label, 26)}${pad(r.fgName, 34)}${pad(r.bgName, 24)}${pad(r.min + ':1', 6)}${r.value.toFixed(2)}:1 ${mark}`
  );
}
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} verificações passaram.`);
if (failed.length > 0) {
  console.error(`${failed.length} falha(s).`);
  process.exit(1);
}
