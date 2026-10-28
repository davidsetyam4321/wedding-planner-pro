import { FEATURES } from "@/lib/features";
import { Home, ListChecks, Users, Wallet, Receipt, type Icon } from "@/lib/icons";

export type NavItem = {
  to: string;
  label: string;
  icon: Icon;
  /** pastel surface applied while the item is active */
  active: string;
};

/**
 * Lima tujuan utama di navigasi bawah seluler.
 */
export const PRIMARY_NAV: NavItem[] = [
  {
    to: "/app",
    label: "Beranda",
    icon: Home,
    active: "text-primary",
  },
  {
    to: "/app/checklist",
    label: "Checklist",
    icon: ListChecks,
    active: "text-primary",
  },
  {
    to: "/app/tamu",
    label: "Tamu",
    icon: Users,
    active: "text-primary",
  },
  {
    to: "/app/vendor",
    label: "Vendor",
    icon: Receipt,
    active: "text-primary",
  },
  {
    to: "/app/budget",
    label: "Budget",
    icon: Wallet,
    active: "text-primary",
  },
];

const PRIMARY_PATHS = new Set(PRIMARY_NAV.map((item) => item.to));

/**
 * Tujuan lain yang tersedia melalui tombol “Lainnya” di navigasi seluler.
 */
export const TOOL_NAV = FEATURES.filter(
  (feature) => !PRIMARY_PATHS.has(feature.to),
);
