/** Shared formatting + countdown helpers (all UI text is Indonesian). */

export function formatRupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

/** Short form like "Rp 64 jt" / "Rp 1,2 M" for chips. */
export function formatRupiahShort(value: number): string {
  if (value >= 1_000_000_000) {
    const m = value / 1_000_000_000;
    return `Rp ${trimZeros(m.toFixed(m >= 10 ? 0 : 1))} M`;
  }
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `Rp ${trimZeros(m.toFixed(m >= 10 ? 0 : 1))} jt`;
  }
  if (value >= 1_000) {
    return `Rp ${Math.round(value / 1_000)}rb`;
  }
  return formatRupiah(value);
}

function trimZeros(s: string): string {
  return s.replace(/\.0$/, "").replace(".", ",");
}

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function formatDateID(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

const WEEKDAYS_ID = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
];

const MONTHS_SHORT_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** Long form with weekday, e.g. "Sabtu, 28 Oktober 2025" (dashboard hero). */
export function formatDateLongID(ms: number): string {
  const d = new Date(ms);
  return `${WEEKDAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

/** Compact form, e.g. "28 Okt" (wedding-stage timeline). */
export function formatDateShortID(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS_SHORT_ID[d.getMonth()]}`;
}

export function formatDateTimeID(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} · ${hh}:${mm}`;
}

/**
 * Whole days remaining until the wedding (floor, so the label always matches
 * the live hour/minute/second counter next to it); 0 once the date has passed.
 */
export function daysUntil(weddingDateMs: number, now = Date.now()): number {
  const diff = weddingDateMs - now;
  if (diff <= 0) return 0;
  return Math.floor(diff / 86_400_000);
}

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

/** Detailed countdown breakdown for the dashboard hero (all values padded in the UI). */
export function countdownParts(
  weddingDateMs: number,
  now = Date.now(),
): CountdownParts {
  const diff = Math.max(0, weddingDateMs - now);
  const days = Math.floor(diff / 86_400_000);
  const rest = diff - days * 86_400_000;
  return {
    days,
    hours: Math.floor(rest / 3_600_000),
    minutes: Math.floor((rest % 3_600_000) / 60_000),
    seconds: Math.floor((rest % 60_000) / 1000),
  };
}

/** H-xxx label (H-0 shown as "Hari ini"). */
export function countdownLabel(weddingDateMs: number, now = Date.now()): string {
  const days = daysUntil(weddingDateMs, now);
  return days === 0 ? "Hari ini" : `H-${days}`;
}

/** yyyy-mm-dd for <input type="date"> from an epoch-ms value, local time. */
export function toDateInputValue(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDateInputValue(value: string): number {
  const [y, m, d] = value.split("-").map((part) => parseInt(part, 10));
  return new Date(y, (m ?? 1) - 1, d ?? 1, 9, 0, 0).getTime();
}
