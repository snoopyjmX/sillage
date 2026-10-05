const decimal = (fractionDigits: number) =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

// Números com vírgula decimal (pt-BR): 4.2 -> "4,2"
export const formatDecimal = (value: number, fractionDigits = 1): string =>
  decimal(fractionDigits).format(value);
