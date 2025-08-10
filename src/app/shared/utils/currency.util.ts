export function formatCurrency(
  value: number | null | undefined,
  currencyCode: string = 'USD',
  locale: string = typeof navigator !== 'undefined'
    ? navigator.language
    : 'en-US'
): string {
  if (value == null || !isFinite(Number(value))) return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return String(value);
  }
}
