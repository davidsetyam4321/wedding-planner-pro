import { FEATURES } from "@/lib/features";
import { Grid, Home, ListChecks, Users, Wallet, type LucideIcon } from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** pastel surface applied while the item is active */
  active: string;
  /** show the open-task count badge (BottomNav) */
  badge?: boolean;
};

/*
 * Single source of truth for the five main destinations — shared by the
 * desktop SideNav and the mobile BottomNav so labels, icons and active
 * colors can never drift apart.
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
 * The four planning tools beyond the main navigation (Mood Board, Daftar
 * Tamu, Vendor, Rundown). Derived from FEATURES so icon, label and emoji
 * stay identical everywhere they are rendered.
 */
export const TOOL_NAV = FEATURES.filter(
  (feature) => !PRIMARY_PATHS.has(feature.to),
);
