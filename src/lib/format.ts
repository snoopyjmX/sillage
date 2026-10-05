const decimal = (fractionDigits: number) =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

// Números com vírgula decimal (pt-BR): 4.2 -> "4,2"
export const formatDecimal = (value: number, fractionDigits = 1): string =>
  decimal(fractionDigits).format(value);

const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

// Inteiros com separador de milhar pt-BR: 1234 -> "1.234"
export const formatInteger = (value: number): string => integer.format(value);

// "1 perfume" / "0 perfumes" / "24 perfumes" (o CLDR trata 0 como singular em pt; aqui só 1 é singular)
export const formatCount = (value: number, singular: string, plural: string): string =>
  `${formatInteger(value)} ${value === 1 ? singular : plural}`;
