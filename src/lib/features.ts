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
};

/** The eight working features of Planner Wedding. */
export const FEATURES: Feature[] = [
  {
    to: "/app",
    label: "Dashboard",
    desc: "Ringkasan dana, tugas, dan hitung mundur hari-H.",
    icon: LayoutDashboard,
  },
  {
    to: "/app/budget",
    label: "Budget",
    desc: "Alokasi anggaran & pengeluaran per kategori.",
    icon: Wallet,
  },
  {
    to: "/app/tabungan",
    label: "Tabungan",
    desc: "Catat setoran menuju target dana pernikahan.",
    icon: PiggyBank,
  },
  {
    to: "/app/checklist",
    label: "Checklist",
    desc: "Tugas persiapan dengan progres yang jelas.",
    icon: ListChecks,
  },
  {
    to: "/app/moodboard",
    label: "Mood Board",
    desc: "Referensi dekorasi, baju & makeup per kotak.",
    icon: FolderHeart,
  },
  {
    to: "/app/tamu",
    label: "Daftar Tamu",
    desc: "Undangan, jumlah orang, dan status RSVP.",
    icon: Users,
  },
  {
    to: "/app/vendor",
    label: "Vendor",
    desc: "Kontak, biaya, dan status pembayaran vendor.",
    icon: Receipt,
  },
  {
    to: "/app/rundown",
    label: "Rundown Acara",
    desc: "Susunan acara hari-H dari persiapan sampai selesai.",
    icon: CalendarClock,
  },
];
