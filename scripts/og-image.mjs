// Gera public/og-image.jpg (1200x630), a imagem de pré-visualização dos links (Open Graph).
//
// Uso: node scripts/og-image.mjs
// Cores: lidas de src/styles/tokens.css (claro em :root, escuro em .dark). Fonte: Fraunces, do
// pacote @fontsource. O screenshot sai do Chromium do Playwright (já é devDependency).
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';
import { chromium } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'public', 'og-image.jpg');
const FONT = join(
  ROOT,
  'node_modules',
  '@fontsource',
  'fraunces',
  'files',
  'fraunces-latin-600-normal.woff2'
);
const INTER = join(
  ROOT,
  'node_modules',
  '@fontsource',
  'inter',
  'files',
  'inter-latin-500-normal.woff2'
);
const SLOGAN = 'Enciclopédia olfativa e diário pessoal';

// Valor de um token dentro do bloco de um seletor (:root ou .dark)
export const readToken = (css, selector, name) => {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Seletor ${selector} não encontrado em tokens.css`);
  const block = css.slice(start, css.indexOf('\n}', start));
  const match = new RegExp(String.raw`${name}:\s*(#[0-9a-fA-F]{3,8})`).exec(block);
  if (!match) throw new Error(`Token ${name} ausente em ${selector}`);
  return match[1];
};

const buildHtml = (tokens) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><style>
@font-face { font-family: 'Fraunces'; font-weight: 600; src: url('${pathToFileURL(FONT).href}') format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 500; src: url('${pathToFileURL(INTER).href}') format('woff2'); }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; display: grid; grid-template-columns: 1fr 360px; font-family: 'Inter', sans-serif; }
.light { background: ${tokens.light.background}; color: ${tokens.light.foreground}; padding: 80px; display: flex; flex-direction: column; justify-content: center; gap: 28px; }
.bar { width: 96px; height: 8px; border-radius: 4px; background: ${tokens.light.primary}; }
h1 { font-family: 'Fraunces', serif; font-weight: 600; font-size: 152px; line-height: 1; letter-spacing: -0.02em; }
p { font-size: 38px; line-height: 1.3; color: ${tokens.light.foreground}; opacity: 0.8; max-width: 640px; }
.dark { background: ${tokens.dark.background}; display: grid; place-items: center; }
.dot { width: 168px; height: 168px; border-radius: 50%; background: ${tokens.dark.primary}; }
</style></head><body>
<main class="light"><div class="bar"></div><h1>Sillage</h1><p>${SLOGAN}</p></main>
<aside class="dark"><div class="dot"></div></aside>
</body></html>`;

const main = async () => {
  const css = await readFile(join(ROOT, 'src', 'styles', 'tokens.css'), 'utf8');
  const tokens = {
    light: Object.fromEntries(
      ['background', 'foreground', 'primary'].map((name) => [
        name,
        readToken(css, ':root', `--${name}`),
      ])
    ),
    dark: Object.fromEntries(
      ['background', 'primary'].map((name) => [name, readToken(css, '.dark', `--${name}`)])
    ),
  };
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.setContent(buildHtml(tokens), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: OUTPUT, type: 'jpeg', quality: 88 });
  } finally {
    await browser.close();
  }
  process.stdout.write(`✔ ${OUTPUT}\n`);
};

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await main();
}
