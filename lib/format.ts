export const EXPIRING_SOON_DAYS = 30;

export function daysUntil(iso: string): number {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtValidatedAt(iso: string | null): string {
  if (!iso) return 'Never validated';
  const d = new Date(iso);
  return 'Validated ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function expirationStyle(iso: string | null): { color: string; fontWeight: number } {
  if (!iso) return { color: 'var(--color-text)', fontWeight: 400 };
  const soon = daysUntil(iso) <= EXPIRING_SOON_DAYS;
  return {
    color: soon ? 'var(--color-accent-700)' : 'var(--color-text)',
    fontWeight: soon ? 600 : 400,
  };
}
