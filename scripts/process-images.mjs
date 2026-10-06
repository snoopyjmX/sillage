// Processa as fotos dos perfumes para o catálogo (docs/CATALOGO_REAL.md, Seção 2).
//
// Como usar:
//   1. Jogue as fotos originais (jpg, jpeg, png, webp, avif, tiff) em scripts/raw-images/.
//      Nomeie cada arquivo com o slug do perfume, ex.: malbec-signature.jpg
//      (ou em subpastas por marca: scripts/raw-images/o-boticario/malbec-signature.jpg).
//   2. (Opcional) Defina REMOVE_BG_API_KEY no .env.local para remover o fundo via Remove.bg.
//      Sem a chave, o script segue com o arquivo original (a transparência só existe se a foto já a tiver).
//   3. Rode: npm run images
//   4. Para cada foto saem, em scripts/processed-images/ (mesma estrutura de pastas), WebP com canal alfa:
//        slug-thumb.webp   320 px   (cards e listas)
//        slug-medium.webp  640 px   (detalhe)
//        slug-large.webp   1280 px  (telas grandes / zoom)
//        slug.webp         cópia da medium: é o arquivo-base que perfumes.image_path continua apontando
//      O front monta as variantes trocando ".webp" por "-thumb.webp" / "-large.webp" no image_path.
//   5. Suba com `npm run images:upload` e preencha perfumes.image_path com o caminho do arquivo-base
//      (ex.: o-boticario/malbec-signature.webp).
//
// O ajuste é "contain" sobre fundo transparente: o frasco inteiro cabe no quadrado, sem cortar tampa nem base.
import { copyFile, mkdir, readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, parse, relative } from 'node:path';
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
const REMOVE_BG_URL = 'https://api.remove.bg/v1.0/removebg';
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const QUALITY = 80;

try {
  process.loadEnvFile(join(ROOT, '..', '.env.local'));
} catch {
  // arquivo ausente: segue com o ambiente
}
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

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

// Envia a foto ao Remove.bg e devolve o PNG recortado. Se não houver chave ou a API falhar,
// devolve a foto original: o processamento continua, só sem o recorte.
const removeBackground = async (inputBuffer, label) => {
  if (!REMOVE_BG_API_KEY) return inputBuffer;
  try {
    const response = await fetch(REMOVE_BG_URL, {
      method: 'POST',
      headers: { 'X-Api-Key': REMOVE_BG_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_file_b64: inputBuffer.toString('base64'),
        size: 'auto',
        format: 'png',
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${(await response.text()).slice(0, 200)}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.warn(
      `⚠ ${label}: remoção de fundo falhou, usando a foto original (${error instanceof Error ? error.message : error})`
    );
    return inputBuffer;
  }
};

const processImage = async (file) => {
  const { dir, name } = parse(relative(INPUT_DIR, file));
  await mkdir(join(OUTPUT_DIR, dir), { recursive: true });
  const input = await removeBackground(await readFile(file), relative(ROOT, file));

  const outputs = [];
  for (const { suffix, size } of VARIANTS) {
    const target = join(OUTPUT_DIR, dir, `${name}${suffix}.webp`);
    await sharp(input)
      .rotate() // respeita a orientação EXIF da câmera
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

  if (!REMOVE_BG_API_KEY) {
    console.warn(
      '⚠ REMOVE_BG_API_KEY ausente no .env.local: o fundo não será removido.\n' +
        '  Para um recorte perfeito, crie uma chave grátis em https://www.remove.bg/api e adicione-a ao .env.local.\n' +
        '  Seguindo só com conversão e redimensionamento (transparência apenas onde a foto já tiver).\n'
    );
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

await main();
