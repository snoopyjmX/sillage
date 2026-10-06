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

// Data civil AAAA-MM-DD -> "4 de outubro" (sem fuso: a data já é a do usuário, não um instante)
export const formatCivilDate = (date: string): string =>
  new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`)
  );

// Instante ISO -> "6 de outubro de 2026" (no fuso do navegador)
export const formatLongDate = (iso: string): string =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(iso));

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// Centavos inteiros -> "R$ 249,00" (o espaço é o não separável do Intl: 24900 -> "R$ 249,00")
export const formatPriceCents = (cents: number): string => brl.format(cents / 100);

// Data civil AAAA-MM-DD -> "outubro de 2026" (selo da edição diária)
export const formatMonthYear = (date: string): string =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`)
  );
