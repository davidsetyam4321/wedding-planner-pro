import { FlowerMark } from "@/components/Decor";
import { api } from "@/convex/_generated/api";
import {
  FolderHeart,
  Home,
  ListChecks,
  PiggyBank,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router";
import { useQuery } from "convex/react";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  active: string;
  /** Tampilkan lencana jumlah tugas yang belum diselesaikan. */
  badge?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    to: "/app",
    label: "Home",
    icon: Home,
    active: "bg-tint-butter text-tint-butter-foreground",
  },
  {
    to: "/app/budget",
    label: "Budget",
    icon: Wallet,
    active: "bg-tint-mint text-tint-mint-foreground",
  },
  {
    to: "/app/tabungan",
    label: "Tabungan",
    icon: PiggyBank,
    active: "bg-tint-lavender text-tint-lavender-foreground",
  },
  {
    to: "/app/checklist",
    label: "Checklist",
    icon: ListChecks,
    active: "bg-tint-peach text-tint-peach-foreground",
    badge: true,
  },
  {
    to: "/app/lainnya",
    label: "Lainnya",
    icon: FolderHeart,
    active: "bg-tint-rose text-tint-rose-foreground",
  },
];

export function BottomNav() {
  const checklist = useQuery(api.checklist.list);
  const openTasks = (checklist ?? []).filter((item) => !item.done).length;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 lg:hidden">
      <div className="clay grad-warm relative mx-auto flex h-16 max-w-md items-stretch justify-around overflow-hidden px-2">
        <FlowerMark className="pointer-events-none absolute -left-3 -top-3 size-12 text-primary/10" />
        <FlowerMark className="pointer-events-none absolute -bottom-4 right-2 size-14 text-tint-rose-foreground/15" />
        {NAV_ITEMS.map(({ to, label, icon: Icon, active, badge }) => (
          <NavLink
            key={to}
            to={to}
            // `end` keeps Home from staying active on every nested /app/* route.
            end={to === "/app"}
            className={({ isActive }) =>
              `relative my-2 flex min-w-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-bold transition-all duration-200 ${
                isActive
                  ? `${active} clay-sm scale-[1.03]`
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="size-5" strokeWidth={isActive ? 2.4 : 2} />
                <span>{label}</span>
                {badge && openTasks > 0 && (
                  <span className="absolute right-1.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-extrabold text-primary-foreground">
                    {openTasks > 9 ? "9+" : openTasks}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
