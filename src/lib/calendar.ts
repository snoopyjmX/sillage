// Regras puras do calendário do memorial (Fase 19). Tudo em data civil (AAAA-MM-DD) e mês civil
// (AAAA-MM), no fuso do perfil: sem `Date` local, sem conversão de fuso.

export const MIN_MONTH = '2000-01';

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const isMonth = (value: string): boolean => MONTH.test(value) && value >= MIN_MONTH;

export const monthOf = (date: string): string => date.slice(0, 7);

const parts = (month: string): { year: number; monthIndex: number } => {
  const match = MONTH.exec(month);
  return { year: Number(match?.[1]), monthIndex: Number(match?.[2]) - 1 };
};

const pad = (value: number): string => String(value).padStart(2, '0');

const toMonth = (year: number, monthIndex: number): string => `${year}-${pad(monthIndex + 1)}`;

// Mês anterior (-1) ou seguinte (+1); atravessa o ano
export const shiftMonth = (month: string, delta: number): string => {
  const { year, monthIndex } = parts(month);
  const shifted = new Date(Date.UTC(year, monthIndex + delta, 1));
  return toMonth(shifted.getUTCFullYear(), shifted.getUTCMonth());
};

export const daysInMonth = (month: string): number => {
  const { year, monthIndex } = parts(month);
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
};

// Primeiro e último dia do mês, para a consulta do intervalo
export const monthBounds = (month: string): { from: string; to: string } => ({
  from: `${month}-01`,
  to: `${month}-${pad(daysInMonth(month))}`,
});

// Semanas do mês começando no domingo; fora do mês, nulo. Sempre 7 células por semana.
export const monthGrid = (month: string): (string | null)[][] => {
  const { year, monthIndex } = parts(month);
  const leading = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const cells: (string | null)[] = [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: daysInMonth(month) }, (_, index) => `${month}-${pad(index + 1)}`),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
  return weeks;
};

// Mês pedido na URL: inválido ou no futuro volta para o mês de hoje (não há o que ver adiante)
export const resolveMonth = (requested: string | null, today: string): string => {
  const current = monthOf(today);
  return requested !== null && isMonth(requested) && requested <= current ? requested : current;
};

// "13" (sem zero à esquerda) para o número do dia na célula
export const dayNumber = (date: string): number => Number(date.slice(8, 10));
