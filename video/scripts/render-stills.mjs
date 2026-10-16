// Quadros estáticos das cenas principais para conferência visual rápida (remotion still).
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const VIDEO_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Frames do roteiro (60 fps): Abertura, Home, Detalhes, Engenharia
const STILLS = [
  { frame: 330, name: '01-abertura' },
  { frame: 560, name: '02-home-clima' },
  { frame: 1400, name: '03-piramide-afinidade' },
  { frame: 2800, name: '06-engenharia' },
];

for (const { frame, name } of STILLS) {
  execFileSync(
    'npx',
    [
      'remotion',
      'still',
      'src/index.ts',
      'SillageShowcase',
      `out/stills/${name}.png`,
      `--frame=${frame}`,
    ],
    { cwd: VIDEO_DIR, stdio: 'inherit', shell: true }
  );
}
