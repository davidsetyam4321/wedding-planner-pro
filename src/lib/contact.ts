/** Normalize an Indonesian phone number into a wa.me deep link, if it looks valid. */
export function waLink(contact: string, message?: string): string | null {
  const digits = contact.replace(/[^0-9]/g, "");
  if (digits.length < 7) return null;
  const normalized = digits.replace(/^0/, "62");
  const base = `https://wa.me/${normalized}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** Konteks personalisasi pesan undangan (data pasangan & acara). */
export type WaContext = {
  namaTamu: string;
  pasangan: string;
  tanggal: string;
  venue?: string;
};

type WaTemplate = {
  key: string;
  label: string;
  build: (ctx: WaContext) => string;
};

/** Template pesan WhatsApp siap pakai — {placeholder} diisi otomatis. */
export const WA_TEMPLATES: WaTemplate[] = [
  {
    key: "undangan",
    label: "Undangan acara",
    build: (ctx) =>
      `Halo ${ctx.namaTamu}! 👋\n\n` +
      `Dengan bahagia kami, ${ctx.pasangan}, mengundang Anda ke acara pernikahan kami.\n\n` +
      `📅 ${ctx.tanggal}` +
      (ctx.venue ? `\n📍 ${ctx.venue}` : "") +
      `\n\nMohon konfirmasi kehadiran Anda ya. Sampai bertemu! 🤍`,
  },
  {
    key: "rsvp",
    label: "Konfirmasi kehadiran (RSVP)",
    build: (ctx) =>
      `Halo ${ctx.namaTamu}! Mohon konfirmasi kehadiran Anda untuk pernikahan ${ctx.pasangan} pada ${ctx.tanggal}.\n\n` +
      `Balas: “Hadir” / “Tidak hadir” / jumlah orang yang ikut. Terima kasih! 🤍`,
  },
  {
    key: "pengingat",
    label: "Pengingat H-7",
    build: (ctx) =>
      `Halo ${ctx.namaTamu}! Pengingat bahwa pernikahan ${ctx.pasangan} tinggal 7 hari lagi, pada ${ctx.tanggal}` +
      (ctx.venue ? ` di ${ctx.venue}` : "") +
      `.\n\nKami menantikan kehadiran Anda. Sampai jumpa! 🤍`,
  },
  {
    key: "terimakasih",
    label: "Terima kasih pasca acara",
    build: (ctx) =>
      `Halo ${ctx.namaTamu}! Terima kasih banyak sudah hadir dan memberi doa restu untuk ${ctx.pasangan}. Kehadiran Anda berarti sangat banyak bagi kami. 🤍`,
  },
];
