// @vitest-environment node
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { removeWhiteBackground } from './process-images.mjs';

const SIZE = 200;

// Foto 200x200 de fundo branco, com frasco escuro (x 60-140, y 40-180) e rótulo branco dentro dele
const makePhoto = async () => {
  const raw = Buffer.alloc(SIZE * SIZE * 3, 255);
  const paint = (x0, y0, x1, y1, [r, g, b]) => {
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const i = (y * SIZE + x) * 3;
        raw[i] = r;
        raw[i + 1] = g;
        raw[i + 2] = b;
      }
    }
  };
  paint(60, 40, 140, 180, [40, 40, 90]);
  paint(80, 90, 120, 130, [255, 255, 255]);
  return sharp(raw, { raw: { width: SIZE, height: SIZE, channels: 3 } })
    .png()
    .toBuffer();
};

const alphaAt = (data, x, y) => data[(y * SIZE + x) * 4 + 3];

describe('removeWhiteBackground', () => {
  it('apaga o fundo branco das bordas e preserva o frasco e o branco interno', async () => {
    const out = await removeWhiteBackground(await makePhoto());
    const { data } = await sharp(out).raw().toBuffer({ resolveWithObject: true });

    expect(alphaAt(data, 2, 2)).toBe(0);
    expect(alphaAt(data, SIZE - 3, SIZE - 3)).toBe(0);
    expect(alphaAt(data, 70, 60)).toBe(255);
    // rótulo branco cercado pelo frasco: não é conectado à borda, fica opaco
    expect(alphaAt(data, 100, 110)).toBe(255);
  });

  it('é determinístico', async () => {
    const photo = await makePhoto();
    const a = await removeWhiteBackground(photo);
    const b = await removeWhiteBackground(photo);
    expect(a.equals(b)).toBe(true);
  });

  it('mantém intacta uma foto que já tem transparência nas bordas', async () => {
    const raw = Buffer.alloc(SIZE * SIZE * 4, 0);
    const png = await sharp(raw, { raw: { width: SIZE, height: SIZE, channels: 4 } })
      .png()
      .toBuffer();
    const out = await removeWhiteBackground(png);
    const { data } = await sharp(out).raw().toBuffer({ resolveWithObject: true });
    expect(alphaAt(data, 0, 0)).toBe(0);
  });
});
