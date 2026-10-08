import {
  CalendarClock,
  FolderHeart,
  Gift,
  LayoutDashboard,
  ListChecks,
  PiggyBank,
  Receipt,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type Feature = {
  to: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  /** neutral Cora surface — tier ladder only, no per-feature chroma */
  surface: string;
  /** quiet sky-tinted wash (hero card of that page) */
  gradient: string;
  /** small emoji for playful headers */
  emoji: string;
  /** ambient glow wash (fixed background blob) for that feature's page */
  glow: string;
};

/**
 * The nine working features of SatuJanji. Cora discipline: the palette stays
 * white / cerulean / midnight navy / atmosphere blue / one berry accent, so
 * every feature keeps the same neutral tier and the sky carries the emotion.
 */
export const FEATURES: Feature[] = [
  {
    to: "/app",
    label: "Beranda",
    desc: "Ringkasan dana, tugas, dan hitung mundur hari-H.",
    icon: LayoutDashboard,
    surface: "bg-mist-gray text-ink",
    gradient: "grad-warm",
    emoji: "🏠",
    glow: "bg-atmosphere-blue/25",
  },
  {
    to: "/app/budget",
    label: "Budget",
    desc: "Alokasi anggaran & pengeluaran per kategori.",
    icon: Wallet,
    surface: "bg-mist-gray text-ink",
    gradient: "grad-butter",
    emoji: "💰",
    glow: "bg-atmosphere-blue/25",
  },
  {
    to: "/app/tabungan",
    label: "Tabungan",
    desc: "Catat setoran menuju target dana pernikahan.",
    icon: PiggyBank,
    surface: "bg-sky-tint text-midnight-navy",
    gradient: "grad-lavender",
    emoji: "🐷",
    glow: "bg-atmosphere-blue/30",
  },
  {
    to: "/app/checklist",
    label: "Checklist",
    desc: "Tugas persiapan dengan progres yang jelas.",
    icon: ListChecks,
    surface: "bg-mist-gray text-ink",
    gradient: "grad-sage",
    emoji: "📝",
    glow: "bg-atmosphere-blue/30",
  },
  {
    to: "/app/moodboard",
    label: "Mood Board",
    desc: "Referensi dekorasi, baju & makeup per kotak.",
    icon: FolderHeart,
    surface: "bg-berry-tint text-berry-red",
    gradient: "grad-rose",
    emoji: "🎨",
    glow: "bg-berry-red/10",
  },
  {
    to: "/app/tamu",
    label: "Daftar Tamu",
    desc: "Undangan, jumlah orang, dan status RSVP.",
    icon: Users,
    surface: "bg-sky-tint text-midnight-navy",
    gradient: "grad-sky",
    emoji: "💌",
    glow: "bg-atmosphere-blue/25",
  },
  {
    to: "/app/vendor",
    label: "Vendor",
    desc: "Kontak, biaya, dan status pembayaran vendor.",
    icon: Receipt,
    surface: "bg-mist-gray text-ink",
    gradient: "grad-peach",
    emoji: "📋",
    glow: "bg-atmosphere-blue/20",
  },
  {
    to: "/app/rundown",
    label: "Rundown Acara",
    desc: "Susunan acara hari-H dari persiapan sampai selesai.",
    icon: CalendarClock,
    surface: "bg-mist-gray text-ink",
    gradient: "grad-mint",
    emoji: "⏰",
    glow: "bg-atmosphere-blue/25",
  },
  {
    to: "/app/seserahan",
    label: "Seserahan",
    desc: "Daftar hantaran: link toko & status belanja.",
    icon: Gift,
    surface: "bg-berry-tint text-berry-red",
    gradient: "grad-rose",
    emoji: "🎁",
    glow: "bg-berry-red/10",
  },
];
