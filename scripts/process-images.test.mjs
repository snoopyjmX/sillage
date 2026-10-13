// @vitest-environment node
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { cropToSubject, frameVariant, removeBackground } from './process-images.mjs';

const SIZE = 200;
const WHITE = [255, 255, 255];

// Foto 200x200 com frasco escuro (x 60-140, y 40-180) e rótulo branco dentro dele.
// `fill(x, y)` devolve a cor do fundo naquele ponto (padrão: branco).
const makePhoto = async (fill = () => WHITE) => {
  const raw = Buffer.alloc(SIZE * SIZE * 3);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const [r, g, b] = fill(x, y);
      const i = (y * SIZE + x) * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
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
  paint(80, 90, 120, 130, WHITE);
  return sharp(raw, { raw: { width: SIZE, height: SIZE, channels: 3 } })
    .png()
    .toBuffer();
};

const alphaAt = ({ data }, x, y) => data[(y * SIZE + x) * 4 + 3];

describe('removeBackground', () => {
  it('apaga o fundo branco das bordas e preserva o frasco e o branco interno', async () => {
    const out = await removeBackground(await makePhoto());

    expect(alphaAt(out, 2, 2)).toBe(0);
    expect(alphaAt(out, SIZE - 3, SIZE - 3)).toBe(0);
    expect(alphaAt(out, 70, 60)).toBe(255);
    // rótulo branco cercado pelo frasco: não é conectado à borda, fica opaco
    expect(alphaAt(out, 100, 110)).toBe(255);
  });

  it('remove um fundo colorido (não só branco)', async () => {
    const out = await removeBackground(await makePhoto(() => [71, 112, 76]));
    expect(alphaAt(out, 2, 2)).toBe(0);
    expect(alphaAt(out, SIZE - 3, 100)).toBe(0);
    expect(alphaAt(out, 70, 60)).toBe(255);
  });

  it('remove um fundo off-white em gradiente', async () => {
    // 244 no topo esquerdo até 222 na base direita
    const out = await removeBackground(
      await makePhoto((x, y) => {
        const v = 244 - Math.round(((x + y) / (2 * SIZE)) * 22);
        return [v, v, v];
      })
    );
    expect(alphaAt(out, 2, 2)).toBe(0);
    expect(alphaAt(out, SIZE - 3, SIZE - 3)).toBe(0);
    expect(alphaAt(out, 70, 60)).toBe(255);
  });

  it('não deixa tom do fundo nos pixels semitransparentes da borda', async () => {
    const out = await removeBackground(await makePhoto());
    let edge = 0;
    for (let i = 0; i < SIZE * SIZE; i += 1) {
      const alpha = out.data[i * 4 + 3];
      if (alpha > 0 && alpha < 255) {
        edge += 1;
        // o frasco é azul-escuro; sem o véu branco, nenhum canal chega perto de 255
        expect(Math.max(out.data[i * 4], out.data[i * 4 + 1], out.data[i * 4 + 2])).toBeLessThan(
          140
        );
      }
    }
    expect(edge).toBeGreaterThan(0);
  });

  it('é determinístico', async () => {
    const photo = await makePhoto();
    const a = await removeBackground(photo);
    const b = await removeBackground(photo);
    expect(a.data.equals(b.data)).toBe(true);
  });

  it('limpa a poeira de uma foto que já tem transparência nas bordas', async () => {
    const raw = Buffer.alloc(SIZE * SIZE * 4, 0);
    const paint = (x, y, alpha) => {
      const i = (y * SIZE + x) * 4;
      raw.set([40, 40, 90, alpha], i);
    };
    paint(100, 100, 255); // frasco
    paint(10, 10, 3); // poeira
    const png = await sharp(raw, { raw: { width: SIZE, height: SIZE, channels: 4 } })
      .png()
      .toBuffer();
    const out = await removeBackground(png);
    expect(alphaAt(out, 0, 0)).toBe(0);
    expect(alphaAt(out, 10, 10)).toBe(0);
    expect(alphaAt(out, 100, 100)).toBe(255);
  });
});

describe('cropToSubject + frameVariant', () => {
  it('recorta pelo alfa e encaixa o frasco inteiro num canvas 4:5 transparente', async () => {
    const cropped = await cropToSubject(await removeBackground(await makePhoto()));
    const meta = await sharp(cropped).metadata();
    // o frasco tem 80x140 px (com 1 px de borda suavizada)
    expect(meta.width).toBeLessThan(90);
    expect(meta.height).toBeLessThan(150);

    const framed = await frameVariant(cropped, 320);
    const { data, info } = await sharp(framed).raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([320, 400]);
    // cantos transparentes, centro opaco
    expect(data[3]).toBe(0);
    expect(data[(200 * 320 + 160) * 4 + 3]).toBeGreaterThan(200);
  });
});
