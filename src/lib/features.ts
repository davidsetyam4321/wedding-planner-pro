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
};

/**
 * The eight working features of Planner Wedding. Each one gets its own pastel
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
  },
  {
    to: "/app/budget",
    label: "Budget",
    desc: "Alokasi anggaran & pengeluaran per kategori.",
    icon: Wallet,
    surface: "bg-tint-butter text-tint-butter-foreground",
    gradient: "grad-butter",
    emoji: "💰",
  },
  {
    to: "/app/tabungan",
    label: "Tabungan",
    desc: "Catat setoran menuju target dana pernikahan.",
    icon: PiggyBank,
    surface: "bg-tint-lavender text-tint-lavender-foreground",
    gradient: "grad-lavender",
    emoji: "🐷",
  },
  {
    to: "/app/checklist",
    label: "Checklist",
    desc: "Tugas persiapan dengan progres yang jelas.",
    icon: ListChecks,
    surface: "bg-tint-sage text-tint-sage-foreground",
    gradient: "grad-sage",
    emoji: "📝",
  },
  {
    to: "/app/moodboard",
    label: "Mood Board",
    desc: "Referensi dekorasi, baju & makeup per kotak.",
    icon: FolderHeart,
    surface: "bg-tint-rose text-tint-rose-foreground",
    gradient: "grad-rose",
    emoji: "🎨",
  },
  {
    to: "/app/tamu",
    label: "Daftar Tamu",
    desc: "Undangan, jumlah orang, dan status RSVP.",
    icon: Users,
    surface: "bg-tint-sky text-tint-sky-foreground",
    gradient: "grad-sky",
    emoji: "💌",
  },
  {
    to: "/app/vendor",
    label: "Vendor",
    desc: "Kontak, biaya, dan status pembayaran vendor.",
    icon: Receipt,
    surface: "bg-tint-peach text-tint-peach-foreground",
    gradient: "grad-peach",
    emoji: "📋",
  },
  {
    to: "/app/rundown",
    label: "Rundown Acara",
    desc: "Susunan acara hari-H dari persiapan sampai selesai.",
    icon: CalendarClock,
    surface: "bg-tint-mint text-tint-mint-foreground",
    gradient: "grad-mint",
    emoji: "⏰",
  },
];
