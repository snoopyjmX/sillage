// Gera as variantes WebP da arte decorativa das telas de autenticação (docs/DESIGN_SYSTEM.md).
//
// Uso: node scripts/process-auth-art.mjs
// Entrada: docs/design/arte login-cadastro.jpg (original, não é servido nem alterado).
// Saída:   public/auth-art/auth-art-{640,960,1200}.webp, servidos pelo próprio site (sem CDN).
import { mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = join(ROOT, 'docs', 'design', 'arte login-cadastro.jpg');
const OUTPUT_DIR = join(ROOT, 'public', 'auth-art');
// O painel ocupa metade da largura: 384 px a 768 px e 640 px a 1280 px (1x); 960 e 1200 cobrem telas 1,5x e 2x
const WIDTHS = [640, 960, 1200];
const QUALITY = 72;

await mkdir(OUTPUT_DIR, { recursive: true });

for (const width of WIDTHS) {
  const file = join(OUTPUT_DIR, `auth-art-${width}.webp`);
  const info = await sharp(INPUT)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(file);
  const { size } = await stat(file);
  process.stdout.write(`${file}  ${info.width}x${info.height}  ${(size / 1024).toFixed(1)} KB\n`);
}
