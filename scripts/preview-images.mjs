// Gera uma folha de contato com cada frasco processado sobre três fundos (palco claro, palco escuro
// e o --accent claro), para revisar o recorte a olho antes de subir (`npm run images:preview`).
// Lê scripts/processed-images/manifest.json e grava scripts/processed-images/_preview.png (gitignorado).
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import sharp from 'sharp';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'processed-images');
const CELL = { width: 160, height: 200 };
const COLUMNS = 5;
// Mesmos tons de src/styles/tokens.css: palco claro, palco escuro e --accent do tema claro
const STAGES = [
  { r: 239, g: 236, b: 227 },
  { r: 39, g: 46, b: 41 },
  { r: 228, g: 235, b: 224 },
];

const main = async () => {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(join(DIR, 'manifest.json'), 'utf8'));
  } catch {
    console.error('✖ manifest.json não existe. Rode `npm run images` antes.');
    process.exit(1);
  }

  const paths = Object.values(manifest);
  const rows = Math.ceil(paths.length / COLUMNS);
  const blockWidth = COLUMNS * CELL.width;
  const blockHeight = rows * CELL.height;
  const composites = [];

  for (const [stageIndex, background] of STAGES.entries()) {
    const stage = await sharp({
      create: { width: blockWidth, height: blockHeight, channels: 3, background },
    })
      .png()
      .toBuffer();
    composites.push({ input: stage, left: stageIndex * blockWidth, top: 0 });
    for (const [i, path] of paths.entries()) {
      const thumb = await sharp(join(DIR, path.replace(/\.webp$/, '-thumb.webp')))
        .resize(CELL.width, CELL.height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      composites.push({
        input: thumb,
        left: stageIndex * blockWidth + (i % COLUMNS) * CELL.width,
        top: Math.floor(i / COLUMNS) * CELL.height,
      });
    }
  }

  const target = join(DIR, '_preview.png');
  await sharp({
    create: {
      width: blockWidth * STAGES.length,
      height: blockHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composites)
    .png()
    .toFile(target);
  console.log(`✔ ${paths.length} frascos × ${STAGES.length} fundos em ${target}`);
};

await main();
