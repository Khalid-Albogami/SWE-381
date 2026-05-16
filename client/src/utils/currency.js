const FORMATTER = new Intl.NumberFormat('en-SA', {
  style: 'currency',
  currency: 'SAR',
  maximumFractionDigits: 0,
});

export function formatSAR(amount) {
  if (amount == null || Number.isNaN(amount)) return '—';
  return FORMATTER.format(amount);
}
