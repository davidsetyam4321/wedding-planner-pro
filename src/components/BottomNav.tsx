import { BadgeDollarSign, FolderTree, Home, ListChecks, PiggyBank } from "lucide-react";
import { NavLink } from "react-router";

const NAV_ITEMS = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/budget", label: "Budget", icon: BadgeDollarSign },
  { to: "/app/tabungan", label: "Tabungan", icon: PiggyBank },
  { to: "/app/checklist", label: "Checklist", icon: ListChecks },
  { to: "/app/lainnya", label: "Lainnya", icon: FolderTree },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-around">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-w-16 flex-col items-center justify-center gap-1 px-2 text-[10px] tracking-wide ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="size-5" strokeWidth={isActive ? 2.4 : 1.8} />
                <span className={isActive ? "font-semibold" : undefined}>{label}</span>
                <span
                  className={`h-0.5 w-6 ${isActive ? "bg-primary" : "bg-transparent"}`}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
