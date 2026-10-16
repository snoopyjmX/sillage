// Física do varal de fotos (PolaroidLineCarousel). Funções puras, sem DOM.
// Origem: lógica do "polaroid-line-carousel" do 21st.dev, sem a parte de pintura de paisagens.

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

// Altura do fio, que cede por `sag` no meio, entre (0, y0) e (largura, y0), na posição x
export const stringY = (x: number, width: number, y0: number, sag: number): number => {
  const t = clamp(x / width, 0, 1);
  return y0 + 4 * sag * t * (1 - t);
};

// Um passo de uma mola criticamente amortecida em direção ao alvo
export const springStep = (
  x: number,
  v: number,
  target: number,
  dt: number,
  k = 70
): [number, number] => {
  const c = 2 * Math.sqrt(k);
  const nv = v + (k * (target - x) - c * v) * dt;
  return [x + nv * dt, nv];
};

// Um passo do balanço de uma foto presa no fio. `lineVel` é a velocidade das fotos na tela
// (px/s, positivo = para a direita): a foto fica para trás, a gravidade a puxa de volta e o
// atrito a amortece. `gain` 0 mantém as fotos paradas.
export const swingStep = (
  angle: number,
  angularVel: number,
  lineVel: number,
  dt: number,
  gain: number
): [number, number] => {
  const next = angularVel + (-38 * angle - 4.2 * angularVel + lineVel * 0.0034 * gain) * dt;
  return [clamp(angle + next * dt, -0.6, 0.6), next];
};

// Índice da foto mais próxima do centro para um deslocamento do fio
export const nearestAt = (offset: number, spacing: number, count: number): number =>
  clamp(Math.round(offset / spacing), 0, Math.max(0, count - 1));

export const pad2 = (value: number): string => (value < 10 ? `0${value}` : String(value));
