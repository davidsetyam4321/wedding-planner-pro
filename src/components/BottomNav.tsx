import { FlowerMark } from "@/components/Decor";
import { FolderHeart, Home, ListChecks, PiggyBank, Wallet } from "lucide-react";
import { NavLink } from "react-router";

const NAV_ITEMS = [
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
  },
  {
    to: "/app/lainnya",
    label: "Lainnya",
    icon: FolderHeart,
    active: "bg-tint-rose text-tint-rose-foreground",
  },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
      <div className="clay grad-warm relative mx-auto flex h-16 max-w-md items-stretch justify-around overflow-hidden px-2">
        <FlowerMark className="pointer-events-none absolute -left-3 -top-3 size-12 text-primary/10" />
        <FlowerMark className="pointer-events-none absolute -bottom-4 right-2 size-14 text-tint-rose-foreground/15" />
        {NAV_ITEMS.map(({ to, label, icon: Icon, active }) => (
          <NavLink
            key={to}
            to={to}
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
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
