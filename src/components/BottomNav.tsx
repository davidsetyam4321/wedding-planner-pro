import { api } from "@/convex/_generated/api";
import { PRIMARY_NAV } from "@/lib/nav";
import { NavLink } from "react-router";
import { useQuery } from "convex/react";

/**
 * Bottom navigation mengambang ala SatuJanji: pill kaca rounded-full
 * dengan item aktif berlatar sage container.
 */
export function BottomNav() {
  const checklist = useQuery(api.checklist.list);
  const openTasks = (checklist ?? []).filter((item) => !item.done).length;

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="pointer-events-auto mx-auto flex max-w-md items-stretch justify-between rounded-full border border-white/60 bg-card/85 p-1.5 shadow-[0_16px_40px_rgba(36,46,40,0.14)] backdrop-blur-2xl">
        {PRIMARY_NAV.map(({ to, label, icon: Icon, active, badge }) => (
          <NavLink
            key={to}
            to={to}
            // `end` keeps Home from staying active on every nested /app/* route.
            end={to === "/app"}
            className={({ isActive }) =>
              `relative my-0.5 flex min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-2 text-[10px] font-semibold transition-all duration-200 ${
                isActive
                  ? `${active} font-bold`
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="size-5" strokeWidth={isActive ? 2.4 : 2} />
                <span>{label}</span>
                {badge && openTasks > 0 && (
                  <span className="absolute right-1.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-extrabold text-white">
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
