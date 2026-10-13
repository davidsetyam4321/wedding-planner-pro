import { FloatingTooltip } from "@/components/unlumen-ui/floating-tooltip";
import { FEATURES } from "@/lib/features";
import { Settings } from "@/lib/icons";
import { NavLink, Link } from "react-router";

type SideNavExtra = { openTasks: number };

/** Navigasi desktop sebagai dock mengambang dengan label Unlumen saat hover. */
export function SideNav({ extra }: { extra?: SideNavExtra }) {
  return (
    <aside
      aria-label="Navigasi desktop"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-40 hidden justify-center px-4 lg:flex"
    >
      <nav className="pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-1 rounded-2xl border border-white/80 bg-[color-mix(in_srgb,var(--background)_88%,white_12%)] p-2 shadow-[0_12px_36px_rgba(40,31,24,0.16)] backdrop-blur-2xl dark:border-white/15 dark:bg-slate-950/85">
        <FloatingTooltip.Trigger content="SatuJanji" description="Beranda perencanaan pernikahan">
          <Link
            to="/app"
            aria-label="SatuJanji — Beranda"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="font-serif text-xl leading-none">SJ</span>
          </Link>
        </FloatingTooltip.Trigger>
        <span aria-hidden="true" className="mx-1 h-7 w-px bg-border/80" />
        {FEATURES.filter((feature) => feature.to !== "/app").map(
          ({ to, label, desc, icon: Icon, surface }) => (
            <FloatingTooltip.Trigger key={to} content={label} description={desc}>
              <NavLink
                to={to}
                aria-label={label}
                className={({ isActive }) =>
                  `relative flex size-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? `${surface} shadow-sm`
                      : "text-muted-foreground hover:-translate-y-0.5 hover:bg-secondary hover:text-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="size-[18px]" weight={isActive ? "fill" : "regular"} />
                    {to === "/app/checklist" && (extra?.openTasks ?? 0) > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-berry-red text-[9px] font-bold text-white">
                        {(extra?.openTasks ?? 0) > 9 ? "9+" : extra?.openTasks}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </FloatingTooltip.Trigger>
          ),
        )}
        <span aria-hidden="true" className="mx-1 h-7 w-px bg-border/80" />
        <FloatingTooltip.Trigger content="Pengaturan" description="Akun, sinkronisasi, dan preferensi">
          <NavLink
            to="/app/pengaturan"
            aria-label="Pengaturan"
            className={({ isActive }) =>
              `flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? "bg-tint-sage text-tint-sage-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`
            }
          >
            <Settings className="size-[18px]" />
          </NavLink>
        </FloatingTooltip.Trigger>
      </nav>
    </aside>
  );
}
