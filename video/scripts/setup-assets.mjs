// Prepara video/public/ para o Remotion (staticFile): a trilha e as imagens estáticas do app.
// Nada daqui vai para o git (.gitignore ignora video/public/ e os binários de áudio e vídeo).
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const VIDEO_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT_DIR = resolve(VIDEO_DIR, '..');
const PUBLIC_DIR = join(VIDEO_DIR, 'public');

const COPIES = [
  [join(VIDEO_DIR, 'backgorund-music-video.mp3'), join(PUBLIC_DIR, 'music.mp3')],
  [join(ROOT_DIR, 'public', 'favicon-32x32.png'), join(PUBLIC_DIR, 'favicon-32x32.png')],
  [join(ROOT_DIR, 'public', 'apple-touch-icon.png'), join(PUBLIC_DIR, 'apple-touch-icon.png')],
  [
    join(ROOT_DIR, 'public', 'auth-art', 'auth-art-1200.webp'),
    join(PUBLIC_DIR, 'auth-art-1200.webp'),
  ],
];

for (const [from, to] of COPIES) {
  if (!existsSync(from)) throw new Error(`Arquivo ausente: ${from}`);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  console.log(`✓ ${to.slice(VIDEO_DIR.length + 1)}`);
}

if (!existsSync(join(PUBLIC_DIR, 'captures', '16-profile-dna-passkeys.png'))) {
  console.warn('⚠ Capturas ausentes em public/captures: rode `npm run capture` antes do render.');
}
