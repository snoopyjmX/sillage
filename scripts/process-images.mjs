// Processa as fotos dos perfumes para o catálogo (docs/CATALOGO_REAL.md, Seção 2).
//
// Como usar:
//   1. Jogue as fotos originais (jpg, jpeg, png, webp, avif, tiff) em scripts/raw-images/.
//      Nomeie cada arquivo com o slug do perfume, ex.: malbec-signature.jpg
//      (ou em subpastas por marca: scripts/raw-images/o-boticario/malbec-signature.jpg).
//   2. Rode: npm run images
//   3. Para cada foto saem, em scripts/processed-images/ (mesma estrutura de pastas), WebP com canal alfa:
//        slug-thumb.webp   320 px   (cards e listas)
//        slug-medium.webp  640 px   (detalhe)
//        slug-large.webp   1280 px  (telas grandes / zoom)
//        slug.webp         cópia da medium: é o arquivo-base que perfumes.image_path continua apontando
//      O front monta as variantes trocando ".webp" por "-thumb.webp" / "-large.webp" no image_path.
//   4. Suba com `npm run images:upload` e preencha perfumes.image_path com o caminho do arquivo-base
//      (ex.: o-boticario/malbec-signature.webp).
//
// Fundo branco: o recorte é 100% local e determinístico (só sharp, sem serviço externo).
// Um flood fill parte das bordas da foto e apaga apenas o branco (ou quase branco) conectado a elas;
// o branco interno do frasco e do rótulo não é tocado. A borda do recorte é suavizada no canal alfa.
// Fotos que já têm transparência nas bordas são mantidas como estão.
//
// O ajuste é "contain" sobre fundo transparente: o frasco inteiro cabe no quadrado, sem cortar tampa nem base.
import { copyFile, mkdir, readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, parse, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)));
const INPUT_DIR = join(ROOT, 'raw-images');
const OUTPUT_DIR = join(ROOT, 'processed-images');
const VARIANTS = [
  { suffix: '-thumb', size: 320 },
  { suffix: '-medium', size: 640 },
  { suffix: '-large', size: 1280 },
];
const BASE_VARIANT = '-medium';
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const QUALITY = 80;
// Quanto cada canal pode estar abaixo de 255 para ainda contar como "branco de fundo"
const WHITE_TOLERANCE = 24;
// Raio do blur (px) que suaviza a borda do recorte no canal alfa
const EDGE_SMOOTHING = 0.8;

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

// Pixel de fundo = opaco e quase branco
const isBackground = (data, i) =>
  data[i + 3] > 0 && Math.min(data[i], data[i + 1], data[i + 2]) >= 255 - WHITE_TOLERANCE;

// Remove o fundo branco ligado às bordas e devolve um PNG com alfa. Não toca em fotos que já
// têm transparência nas bordas. Determinístico: mesma foto, mesmo resultado.
export const removeWhiteBackground = async (inputBuffer) => {
  const { data, info } = await sharp(inputBuffer)
    .rotate() // respeita a orientação EXIF antes de olhar as bordas
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const total = width * height;

  // Já recortada: algum pixel de canto/borda transparente
  const corners = [0, width - 1, total - width, total - 1];
  if (corners.some((px) => data[px * 4 + 3] < 255)) {
    return sharp(data, { raw: info }).png().toBuffer();
  }

  // Flood fill (4 vizinhos) a partir de todos os pixels de borda que são fundo
  const isBg = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  const seed = (px) => {
    if (!isBg[px] && isBackground(data, px * 4)) {
      isBg[px] = 1;
      queue[tail++] = px;
    }
  };
  for (let x = 0; x < width; x += 1) {
    seed(x);
    seed((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    seed(y * width);
    seed(y * width + width - 1);
  }
  while (head < tail) {
    const px = queue[head++];
    const x = px % width;
    if (x > 0) seed(px - 1);
    if (x < width - 1) seed(px + 1);
    if (px >= width) seed(px - width);
    if (px < total - width) seed(px + width);
  }

  // Máscara: 255 no objeto, 0 no fundo; o blur suaviza a transição (alfa = menor valor entre os dois)
  const mask = Buffer.alloc(total);
  for (let px = 0; px < total; px += 1) mask[px] = isBg[px] ? 0 : 255;
  const soft = await sharp(mask, { raw: { width, height, channels: 1 } })
    .blur(EDGE_SMOOTHING)
    .toColourspace('b-w') // o blur devolve 3 canais; a máscara tem 1
    .raw()
    .toBuffer();

  const out = Buffer.from(data);
  for (let px = 0; px < total; px += 1) {
    out[px * 4 + 3] = Math.min(data[px * 4 + 3], soft[px]);
  }
  return sharp(out, { raw: info }).png().toBuffer();
};

const processImage = async (file) => {
  const { dir, name } = parse(relative(INPUT_DIR, file));
  await mkdir(join(OUTPUT_DIR, dir), { recursive: true });
  const input = await removeWhiteBackground(await readFile(file));

  const outputs = [];
  for (const { suffix, size } of VARIANTS) {
    const target = join(OUTPUT_DIR, dir, `${name}${suffix}.webp`);
    await sharp(input)
      .resize(size, size, { fit: 'contain', background: TRANSPARENT })
      .webp({ quality: QUALITY, alphaQuality: QUALITY })
      .toFile(target);
    outputs.push(target);
  }
  // Arquivo-base (o que image_path referencia) = cópia da variante média
  const base = join(OUTPUT_DIR, dir, `${name}.webp`);
  await copyFile(join(OUTPUT_DIR, dir, `${name}${BASE_VARIANT}.webp`), base);

  const sizes = await Promise.all(outputs.map(async (path) => (await stat(path)).size));
  const report = VARIANTS.map(
    ({ suffix }, i) => `${suffix.slice(1)} ${Math.round(sizes[i] / 1024)} KB`
  );
  console.log(`✔ ${relative(ROOT, file)} → ${relative(ROOT, base)} (+ ${report.join(', ')})`);
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
    `\n${files.length - failures} de ${files.length} imagens em scripts/processed-images/ (4 arquivos cada).`
  );
  if (failures > 0) process.exitCode = 1;
};

// Só roda quando chamado direto (`npm run images`); importar o módulo em teste não processa nada
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
