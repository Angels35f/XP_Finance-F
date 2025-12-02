export const numberFormatter = new Intl.NumberFormat('pt-BR');
export const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function fmtNumber(value) {
  if (value == null || value === '') return '0';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return numberFormatter.format(Math.round(n));
}

export function fmtCurrency(value) {
  const n = Number(value || 0);
  return currencyFormatter.format(isNaN(n) ? 0 : n);
}