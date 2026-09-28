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

export function formatDateTimeID(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} · ${hh}:${mm}`;
}

/** Whole days remaining until the wedding; 0 once the date has passed. */
export function daysUntil(weddingDateMs: number, now = Date.now()): number {
  const diff = weddingDateMs - now;
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86_400_000);
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
