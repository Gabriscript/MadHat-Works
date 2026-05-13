import type { Duration } from './types';

const nfEUR = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatEUR(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return nfEUR.format(value);
}

export function formatDuration(duration: Duration, lang: 'en' | 'it' = 'en'): string {
  const map: Record<Duration, { en: string; it: string }> = {
    ONE_TIME:  { en: 'One-time', it: 'Una tantum' },
    MONTHS_3:  { en: '3 months', it: '3 mesi' },
    MONTHS_6:  { en: '6 months', it: '6 mesi' },
    MONTHS_12: { en: '12 months',it: '12 mesi' },
  };
  return map[duration][lang];
}

export function formatDate(date: Date | string | null | undefined, lang: 'en' | 'it' = 'en'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function relativeFromNow(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = (d.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
  if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), 'month');
  return rtf.format(Math.round(diff / (86400 * 365)), 'year');
}
