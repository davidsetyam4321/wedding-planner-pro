import { FEATURES } from "@/lib/features";
import { Home, ListChecks, Users, Wallet, type Icon } from "@/lib/icons";

export type NavItem = {
  to: string;
  label: string;
  icon: Icon;
  /** pastel surface applied while the item is active */
  active: string;
  /** show the open-task count badge (BottomNav) */
  badge?: boolean;
};

/**
 * The four main destinations — rendered as the first four buttons of the
 * floating mobile BottomNav and at the top of the desktop SideNav, so
 * labels, icons and active colors can never drift apart.
 */
export const PRIMARY_NAV: NavItem[] = [
  {
    to: "/app",
    label: "Beranda",
    icon: Home,
    active: "bg-tint-sage text-tint-sage-foreground shadow-sm",
  },
  {
    to: "/app/budget",
    label: "Budget",
    icon: Wallet,
    active: "bg-tint-butter text-tint-butter-foreground shadow-sm",
  },
  {
    to: "/app/checklist",
    label: "Checklist",
    icon: ListChecks,
    active: "bg-tint-sage text-tint-sage-foreground shadow-sm",
    badge: true,
  },
  {
    to: "/app/tamu",
    label: "Tamu",
    icon: Users,
    active: "bg-tint-rose text-tint-rose-foreground shadow-sm",
  },
];

const PRIMARY_PATHS = new Set(PRIMARY_NAV.map((item) => item.to));

/**
 * The remaining features (Tabungan, Mood Board, Vendor, Rundown).
 * Derived from FEATURES so icon, label and emoji stay identical everywhere:
 * the SideNav "Alat" group and the BottomNav "Lainnya" popup both read it.
 */
export const TOOL_NAV = FEATURES.filter(
  (feature) => !PRIMARY_PATHS.has(feature.to),
);
