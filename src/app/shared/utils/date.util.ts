export function startOfMonth(year: number, month: number): Date {
  // month is 1-12
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

export function endOfMonth(year: number, month: number): Date {
  // end is exclusive end-of-month timestamp
  return new Date(year, month, 1, 0, 0, 0, 0);
}

export function formatMonthYear(
  year: number,
  month: number,
  locale = navigator?.language || 'en-US'
): string {
  const d = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(d);
}
