/**
 * Time SQL / .NET senza data nella stringa → HH:mm così com’è.
 * Altrimenti (ISO con data/ora) → ora in Europe/Rome sull’istante.
 */
export function formatBookingTime(v: string | undefined | null): string {
  if (v == null || String(v).trim() === '') {
    return '–';
  }
  const t = String(v).trim();
  if (!t.includes('T') && /^\d{1,2}:\d{2}/.test(t)) {
    const [h, m] = t.split(':');
    return `${String(+h).padStart(2, '0')}:${String(+m).padStart(2, '0')}`;
  }
  const d = new Date(t);
  if (isNaN(d.getTime())) {
    return t;
  }
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Rome'
  })
    .format(d)
    .replace(/\s/g, '');
}

/** Stessa regola, in HH:mm:ss per il calendario Prenota. */
export function parseBackendTimeToHms(v: string | undefined | null): string | null {
  if (v == null || v === '') {
    return null;
  }
  const s = String(v).trim();
  if (!s.includes('T') && /^\d{1,2}:\d{2}/.test(s)) {
    const p = s.split(':');
    const h = String(parseInt(p[0], 10)).padStart(2, '0');
    const m = String(parseInt(p[1], 10)).padStart(2, '0');
    const sec = String(parseInt((p[2] || '0').split('.')[0], 10)).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) {
    return null;
  }
  const parts = new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Europe/Rome'
  }).formatToParts(d);
  const h = (parts.find(x => x.type === 'hour')?.value ?? '0').padStart(2, '0');
  const m = (parts.find(x => x.type === 'minute')?.value ?? '0').padStart(2, '0');
  const sec = (parts.find(x => x.type === 'second')?.value ?? '0').padStart(2, '0');
  return `${h}:${m}:${sec}`;
}
