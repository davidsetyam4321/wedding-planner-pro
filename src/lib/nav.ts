import { FEATURES } from "@/lib/features";
import {
  CalendarClock,
  FolderHeart,
  Grid,
  Home,
  ListChecks,
  Mail,
  PiggyBank,
  Receipt,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** pastel surface applied while the item is active */
  active: string;
  /** show the open-task count badge (BottomNav) */
  badge?: boolean;
};

/**
 * The grouped main destinations used by the desktop SideNav so labels,
 * icons and active colors can never drift apart from BottomNav.
 */
export const PRIMARY_NAV: NavItem[] = [
  {
    to: "/app",
    label: "Beranda",
    icon: Home,
    active: "bg-tint-mint/80 text-primary shadow-sm",
  },
  {
    to: "/app/budget",
    label: "Budget",
    icon: Wallet,
    active: "bg-tint-butter/80 text-tint-butter-foreground shadow-sm",
  },
  {
    to: "/app/checklist",
    label: "Checklist",
    icon: ListChecks,
    active: "bg-tint-sage/80 text-tint-sage-foreground shadow-sm",
    badge: true,
  },
  {
    to: "/app/tamu",
    label: "Tamu",
    icon: Users,
    active: "bg-tint-sky/80 text-tint-sky-foreground shadow-sm",
  },
  {
    to: "/app/lainnya",
    label: "Grid",
    icon: Grid,
    active: "bg-tint-rose/80 text-tint-rose-foreground shadow-sm",
  },
];

const PRIMARY_PATHS = new Set(PRIMARY_NAV.map((item) => item.to));

/**
 * The planning tools beyond the main navigation (Tabungan, Mood Board,
 * Vendor, Rundown, Undangan). Derived from FEATURES so icon, label and
 * emoji stay identical everywhere they are rendered.
 */
export const TOOL_NAV = FEATURES.filter(
  (feature) => !PRIMARY_PATHS.has(feature.to),
);

/**
 * Every destination laid out flat for the floating mobile BottomNav —
 * all features are one tap away. Active item expands into a pastel pill
 * with its label; inactive items are icon-only (SatuJanji mockup style).
 * Short labels are used so the pill stays compact on narrow screens.
 */
export const BOTTOM_NAV: NavItem[] = [
  {
    to: "/app",
    label: "Beranda",
    icon: Home,
    active: "bg-tint-mint/80 text-primary shadow-sm",
  },
  {
    to: "/app/budget",
    label: "Budget",
    icon: Wallet,
    active: "bg-tint-butter/80 text-tint-butter-foreground shadow-sm",
  },
  {
    to: "/app/tabungan",
    label: "Tabungan",
    icon: PiggyBank,
    active: "bg-tint-lavender/80 text-tint-lavender-foreground shadow-sm",
  },
  {
    to: "/app/checklist",
    label: "Checklist",
    icon: ListChecks,
    active: "bg-tint-sage/80 text-tint-sage-foreground shadow-sm",
    badge: true,
  },
  {
    to: "/app/moodboard",
    label: "Moodboard",
    icon: FolderHeart,
    active: "bg-tint-rose/80 text-tint-rose-foreground shadow-sm",
  },
  {
    to: "/app/tamu",
    label: "Tamu",
    icon: Users,
    active: "bg-tint-sky/80 text-tint-sky-foreground shadow-sm",
  },
  {
    to: "/app/vendor",
    label: "Vendor",
    icon: Receipt,
    active: "bg-tint-peach/80 text-tint-peach-foreground shadow-sm",
  },
  {
    to: "/app/rundown",
    label: "Rundown",
    icon: CalendarClock,
    active: "bg-tint-mint/80 text-tint-mint-foreground shadow-sm",
  },
  {
    to: "/app/undangan",
    label: "Undangan",
    icon: Mail,
    active: "bg-tint-butter/80 text-tint-butter-foreground shadow-sm",
  },
  {
    to: "/app/lainnya",
    label: "Grid",
    icon: Grid,
    active: "bg-tint-rose/80 text-tint-rose-foreground shadow-sm",
  },
];
