// Processa as fotos dos perfumes para o catálogo (docs/CATALOGO_REAL.md, Seção 2).
//
// Como usar:
//   1. Jogue as fotos originais (jpg, jpeg, png, webp, avif, tiff) em scripts/raw-images/.
//      Nomeie cada arquivo com o slug do perfume, ex.: malbec-signature.jpg
//      (ou em subpastas por marca: scripts/raw-images/o-boticario/malbec-signature.jpg).
//   2. Rode: npm run images
//   3. Confira o resultado com `npm run images:preview` (folha de contato em processed-images/_preview.png).
//   4. Suba com `npm run images:upload`. O `npm run images` imprime o SQL que atualiza perfumes.image_path.
//
// Para cada foto saem, em scripts/processed-images/ (mesma estrutura de pastas), WebP com canal alfa
// num canvas 4:5 (a proporção do hero), com o hash do conteúdo no nome:
//   slug.<hash>-thumb.webp   320x400
//   slug.<hash>-medium.webp  640x800
//   slug.<hash>-large.webp   1280x1600
//   slug.<hash>.webp         cópia da medium: é o arquivo-base que perfumes.image_path aponta
// O hash muda quando a imagem muda, então o cache de 1 ano do Storage e o CacheFirst do service worker
// nunca servem uma versão velha. O front monta as variantes trocando ".webp" por "-thumb.webp" etc.
// scripts/processed-images/manifest.json lista slug -> image_path.
//
// Fundo: o recorte é 100% local e determinístico (só sharp, sem serviço externo).
//   - A cor do fundo é a mediana dos pixels das bordas (não precisa ser branco).
//   - Um flood fill parte das bordas e apaga o que está perto dessa cor e conectado a elas;
//     o branco interno do frasco e do rótulo não é tocado.
//   - A borda do recorte é suavizada e "descontaminada": a mistura com a cor do fundo é removida,
//     para não sobrar halo claro no tema escuro.
//   - Fotos que já têm transparência só passam pela limpeza de poeira (alfa quase nulo).
// Casos difíceis: scripts/image-overrides.json, por slug, com { "tolerance": 24, "background": [r, g, b], "cropBottom": 0.05 }.
//
// O ajuste é "contain": o frasco é recortado pelo alfa, ganha margem fixa e cabe inteiro no canvas.
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, parse, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)));
const INPUT_DIR = join(ROOT, 'raw-images');
const OUTPUT_DIR = join(ROOT, 'processed-images');
const OVERRIDES_FILE = join(ROOT, 'image-overrides.json');
const MANIFEST_FILE = join(OUTPUT_DIR, 'manifest.json');
const ASPECT = { width: 4, height: 5 };
const VARIANTS = [
  { suffix: '-thumb', width: 320 },
  { suffix: '-medium', width: 640 },
  { suffix: '-large', width: 1280 },
];
const BASE_VARIANT = '-medium';
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const QUALITY = 80;
// Quanto cada canal pode se afastar da cor do fundo para ainda contar como fundo
const DEFAULT_TOLERANCE = 24;
// Raio do blur (px) que suaviza a borda do recorte no canal alfa
const EDGE_SMOOTHING = 0.8;
// Alfa abaixo disso é poeira de compressão e vira 0; a partir disso o pixel conta como frasco no recorte
const DUST_ALPHA = 8;
// Margem ao redor do frasco, em fração do canvas
const MARGIN = 0.06;

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

const median = (values) => {
  const sorted = Uint8Array.from(values).sort();
  return sorted[Math.floor(sorted.length / 2)];
};

// Cor do fundo = mediana, por canal, dos pixels opacos das quatro bordas
export const detectBackground = (data, width, height) => {
  const channels = [[], [], []];
  const sample = (px) => {
    if (data[px * 4 + 3] === 0) return;
    for (let c = 0; c < 3; c += 1) channels[c].push(data[px * 4 + c]);
  };
  for (let x = 0; x < width; x += 1) {
    sample(x);
    sample((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    sample(y * width);
    sample(y * width + width - 1);
  }
  return channels.map((values) => (values.length > 0 ? median(values) : 255));
};

// Remove o fundo ligado às bordas e devolve { data, info } RGBA bruto. Fotos que já têm transparência
// nas bordas só perdem a poeira. Determinístico: mesma foto, mesmo resultado.
export const removeBackground = async (
  inputBuffer,
  { tolerance = DEFAULT_TOLERANCE, background } = {}
) => {
  const { data, info } = await sharp(inputBuffer)
    .rotate() // respeita a orientação EXIF antes de olhar as bordas
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const total = width * height;
  const out = Buffer.from(data);

  // Já recortada: algum pixel de canto transparente
  const corners = [0, width - 1, total - width, total - 1];
  if (corners.some((px) => data[px * 4 + 3] < 255)) {
    for (let px = 0; px < total; px += 1) {
      if (out[px * 4 + 3] < DUST_ALPHA) out[px * 4 + 3] = 0;
    }
    return { data: out, info };
  }

  const bg = background ?? detectBackground(data, width, height);
  const isBackground = (px) => {
    const i = px * 4;
    return (
      data[i + 3] > 0 &&
      Math.abs(data[i] - bg[0]) <= tolerance &&
      Math.abs(data[i + 1] - bg[1]) <= tolerance &&
      Math.abs(data[i + 2] - bg[2]) <= tolerance
    );
  };

  // Flood fill (4 vizinhos) a partir de todos os pixels de borda que são fundo
  const isBg = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  const seed = (px) => {
    if (!isBg[px] && isBackground(px)) {
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

  // Máscara: 255 no objeto, 0 no fundo; o blur suaviza a transição
  const mask = Buffer.alloc(total);
  for (let px = 0; px < total; px += 1) mask[px] = isBg[px] ? 0 : 255;
  const soft = await sharp(mask, { raw: { width, height, channels: 1 } })
    .blur(EDGE_SMOOTHING)
    .toColourspace('b-w') // o blur devolve 3 canais; a máscara tem 1
    .raw()
    .toBuffer();

  for (let px = 0; px < total; px += 1) {
    const i = px * 4;
    // O fundo é zerado de vez (o blur só suaviza o lado do frasco), senão sobra um halo da cor do fundo
    const alpha = isBg[px] ? 0 : Math.min(data[i + 3], soft[px]);
    out[i + 3] = alpha < DUST_ALPHA ? 0 : alpha;
    if (alpha > 0 && alpha < 255) {
      // Descontaminação: tira da borda a parte da cor que veio do fundo (c = (c - bg(1-a)) / a)
      const a = alpha / 255;
      for (let c = 0; c < 3; c += 1) {
        out[i + c] = Math.max(0, Math.min(255, Math.round((data[i + c] - bg[c] * (1 - a)) / a)));
      }
    }
  }
  return { data: out, info };
};

// Zera a faixa inferior da foto (fração da altura): reflexo/sombra que o recorte por cor não pega
export const clipBottom = ({ data, info }, fraction) => {
  if (!fraction) return { data, info };
  const out = Buffer.from(data);
  const firstRow = Math.round(info.height * (1 - fraction));
  for (let px = firstRow * info.width; px < info.width * info.height; px += 1) out[px * 4 + 3] = 0;
  return { data: out, info };
};

// Recorta pelo alfa e devolve um PNG justo ao redor do frasco
export const cropToSubject = async ({ data, info }) => {
  const { width, height } = info;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] >= DUST_ALPHA) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    throw new Error('a foto ficou totalmente transparente (ajuste tolerance/background)');
  }
  return sharp(data, { raw: info })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .png()
    .toBuffer();
};

// Encaixa o frasco recortado num canvas 4:5 transparente, com margem fixa
export const frameVariant = async (cropped, canvasWidth) => {
  const canvasHeight = Math.round((canvasWidth * ASPECT.height) / ASPECT.width);
  const innerWidth = Math.round(canvasWidth * (1 - 2 * MARGIN));
  const innerHeight = Math.round(canvasHeight * (1 - 2 * MARGIN));
  const { data, info } = await sharp(cropped)
    .resize(innerWidth, innerHeight, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true });
  const left = Math.floor((canvasWidth - info.width) / 2);
  const top = Math.floor((canvasHeight - info.height) / 2);
  return sharp(data)
    .extend({
      top,
      bottom: canvasHeight - info.height - top,
      left,
      right: canvasWidth - info.width - left,
      background: TRANSPARENT,
    })
    .webp({ quality: QUALITY, alphaQuality: QUALITY })
    .toBuffer();
};

const loadOverrides = async () => {
  try {
    return JSON.parse(await readFile(OVERRIDES_FILE, 'utf8'));
  } catch {
    return {};
  }
};

// Apaga as saídas antigas do mesmo slug (derivadas e regeneráveis a partir de raw-images)
const clearStaleOutputs = async (dir, name) => {
  const stale = new RegExp(`^${name}(\\.[0-9a-f]{8})?(-thumb|-medium|-large)?\\.webp$`);
  const entries = await readdir(dir);
  await Promise.all(entries.filter((e) => stale.test(e)).map((e) => rm(join(dir, e))));
};

const processImage = async (file, overrides) => {
  const { dir, name } = parse(relative(INPUT_DIR, file));
  const { cropBottom, ...options } = overrides[name] ?? {};
  const cleaned = clipBottom(await removeBackground(await readFile(file), options), cropBottom);
  const cropped = await cropToSubject(cleaned);

  const buffers = [];
  for (const { suffix, width } of VARIANTS) {
    buffers.push({ suffix, buffer: await frameVariant(cropped, width) });
  }
  const hash = createHash('sha256')
    .update(Buffer.concat(buffers.map((b) => b.buffer)))
    .digest('hex')
    .slice(0, 8);

  await mkdir(join(OUTPUT_DIR, dir), { recursive: true });
  await clearStaleOutputs(join(OUTPUT_DIR, dir), name);
  const outputs = [];
  for (const { suffix, buffer } of buffers) {
    const target = join(OUTPUT_DIR, dir, `${name}.${hash}${suffix}.webp`);
    await writeFile(target, buffer);
    outputs.push(target);
  }
  // Arquivo-base (o que image_path referencia) = cópia da variante média
  const base = join(OUTPUT_DIR, dir, `${name}.${hash}.webp`);
  await copyFile(join(OUTPUT_DIR, dir, `${name}.${hash}${BASE_VARIANT}.webp`), base);

  const sizes = await Promise.all(outputs.map(async (path) => (await stat(path)).size));
  const report = VARIANTS.map(
    ({ suffix }, i) => `${suffix.slice(1)} ${Math.round(sizes[i] / 1024)} KB`
  );
  console.log(`✔ ${relative(ROOT, file)} → ${relative(ROOT, base)} (+ ${report.join(', ')})`);
  return { slug: name, imagePath: relative(OUTPUT_DIR, base).split('\\').join('/') };
};

const main = async () => {
  await mkdir(INPUT_DIR, { recursive: true });
  const files = await listImages(INPUT_DIR);
  if (files.length === 0) {
    console.log('Nenhuma imagem em scripts/raw-images/. Jogue as fotos lá e rode de novo.');
    return;
  }

  const overrides = await loadOverrides();
  const manifest = {};
  let failures = 0;
  for (const file of files) {
    try {
      const { slug, imagePath } = await processImage(file, overrides);
      manifest[slug] = imagePath;
    } catch (error) {
      failures += 1;
      console.error(`✖ ${relative(ROOT, file)}: ${error instanceof Error ? error.message : error}`);
    }
  }
  await writeFile(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(
    `\n${files.length - failures} de ${files.length} imagens em scripts/processed-images/ (4 arquivos cada).`
  );
  console.log('\nSQL para atualizar perfumes.image_path:');
  for (const [slug, imagePath] of Object.entries(manifest)) {
    console.log(`update public.perfumes set image_path = '${imagePath}' where slug = '${slug}';`);
  }
  if (failures > 0) process.exitCode = 1;
};

// Só roda quando chamado direto (`npm run images`); importar o módulo em teste não processa nada
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
