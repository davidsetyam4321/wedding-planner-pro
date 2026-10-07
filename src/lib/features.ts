import {
  CalendarClock,
  FolderHeart,
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
  /** pastel surface + matching readable text */
  surface: string;
  /** gradient used by the hero card of that page */
  gradient: string;
  /** small emoji for playful headers */
  emoji: string;
  /** ambient glow wash (fixed background blob) for that feature's page */
  glow: string;
};

/**
 * The nine working features of Planner Wedding. Each one gets its own pastel
 * so the dashboard never looks monotonous (classes are written out literally
 * so Tailwind can see them).
 */
export const FEATURES: Feature[] = [
  {
    to: "/app",
    label: "Beranda",
    desc: "Ringkasan dana, tugas, dan hitung mundur hari-H.",
    icon: LayoutDashboard,
    surface: "bg-tint-mint text-tint-mint-foreground",
    gradient: "grad-warm",
    emoji: "🏠",
    glow: "bg-tint-mint/60",
  },
  {
    to: "/app/budget",
    label: "Budget",
    desc: "Alokasi anggaran & pengeluaran per kategori.",
    icon: Wallet,
    surface: "bg-tint-butter text-tint-butter-foreground",
    gradient: "grad-butter",
    emoji: "💰",
    glow: "bg-tint-butter/55",
  },
  {
    to: "/app/tabungan",
    label: "Tabungan",
    desc: "Catat setoran menuju target dana pernikahan.",
    icon: PiggyBank,
    surface: "bg-tint-maroon text-tint-maroon-foreground",
    gradient: "grad-maroon",
    emoji: "🐷",
    glow: "bg-tint-maroon/30",
  },
  {
    to: "/app/checklist",
    label: "Checklist",
    desc: "Tugas persiapan dengan progres yang jelas.",
    icon: ListChecks,
    surface: "bg-tint-sage text-tint-sage-foreground",
    gradient: "grad-sage",
    emoji: "📝",
    glow: "bg-tint-sage/70",
  },
  {
    to: "/app/moodboard",
    label: "Mood Board",
    desc: "Referensi dekorasi, baju & makeup per kotak.",
    icon: FolderHeart,
    surface: "bg-tint-blush text-tint-blush-foreground",
    gradient: "grad-blush",
    emoji: "🎨",
    glow: "bg-tint-blush/70",
  },
  {
    to: "/app/tamu",
    label: "Daftar Tamu",
    desc: "Undangan, jumlah orang, dan status RSVP.",
    icon: Users,
    surface: "bg-tint-peach text-tint-peach-foreground",
    gradient: "grad-peach",
    emoji: "💌",
    glow: "bg-tint-peach/60",
  },
  {
    to: "/app/vendor",
    label: "Vendor",
    desc: "Kontak, biaya, dan status pembayaran vendor.",
    icon: Receipt,
    surface: "bg-tint-forest text-tint-forest-foreground",
    gradient: "grad-forest",
    emoji: "📋",
    glow: "bg-tint-forest/35",
  },
  {
    to: "/app/rundown",
    label: "Rundown Acara",
    desc: "Susunan acara hari-H dari persiapan sampai selesai.",
    icon: CalendarClock,
    surface: "bg-tint-rose text-tint-rose-foreground",
    gradient: "grad-rose",
    emoji: "⏰",
    glow: "bg-tint-rose/55",
  },
];
