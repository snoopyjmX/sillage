// Processa as fotos dos perfumes para o catálogo (docs/CATALOGO_REAL.md, Seção 2).
//
// Como usar:
//   1. Jogue as fotos originais (jpg, jpeg, png, webp, avif, tiff) em scripts/raw-images/.
//      Nomeie cada arquivo com o slug do perfume, ex.: malbec-signature.jpg
//      (ou em subpastas por marca: scripts/raw-images/o-boticario/malbec-signature.jpg).
//   2. Rode: npm run images
//   3. Pegue o resultado em scripts/processed-images/ (800x800 px, WebP, qualidade 80),
//      com a mesma estrutura de pastas, e suba para o bucket `perfume-images` do Supabase Storage.
//      Depois preencha perfumes.image_path com o caminho no bucket (ex.: o-boticario/malbec-signature.webp).
//
// O recorte é "cover" centralizado: a imagem preenche o quadrado e as sobras são cortadas.
import { mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, extname, join, parse, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)));
const INPUT_DIR = join(ROOT, 'raw-images');
const OUTPUT_DIR = join(ROOT, 'processed-images');
const SIZE = 800;
const QUALITY = 80;
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);

// Lista os arquivos de imagem, entrando nas subpastas
const listImages = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return listImages(path);
      return EXTENSIONS.has(extname(entry.name).toLowerCase()) ? [path] : [];
    })
  );
  return nested.flat();
};

const processImage = async (file) => {
  const { dir, name } = parse(relative(INPUT_DIR, file));
  const target = join(OUTPUT_DIR, dir, `${name}.webp`);
  await mkdir(dirname(target), { recursive: true });
  await sharp(file)
    .rotate() // respeita a orientação EXIF da câmera
    .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
    .webp({ quality: QUALITY })
    .toFile(target);
  const { size } = await stat(target);
  console.log(
    `✔ ${relative(ROOT, file)} → ${relative(ROOT, target)} (${Math.round(size / 1024)} KB)`
  );
};

const main = async () => {
  await mkdir(INPUT_DIR, { recursive: true });
  const files = await listImages(INPUT_DIR);
  if (files.length === 0) {
    console.log('Nenhuma imagem em scripts/raw-images/. Jogue as fotos lá e rode de novo.');
    return;
  }

  let failures = 0;
  for (const file of files) {
    try {
      await processImage(file);
    } catch (error) {
      failures += 1;
      console.error(`✖ ${relative(ROOT, file)}: ${error instanceof Error ? error.message : error}`);
    }
  }
  console.log(
    `\n${files.length - failures} de ${files.length} imagens em scripts/processed-images/.`
  );
  if (failures > 0) process.exitCode = 1;
};

await main();
