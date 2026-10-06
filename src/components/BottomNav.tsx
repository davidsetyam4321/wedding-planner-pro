import { api } from "@/convex/_generated/api";
import { BOTTOM_NAV } from "@/lib/nav";
import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router";
import { useQuery } from "convex/react";

/**
 * Bottom navigation mengambang ala SatuJanji: pill kaca rounded-full yang
 * memuat SEMUA fitur dalam satu baris. Item aktif melebar jadi pill berlabel
 * berlatar pastel; item non-aktif hanya ikon (gaya mockup). Track bisa
 * digeser horizontal saat layar sempit, dan item aktif selalu digeser
 * ke tengah agar tidak pernah tersembunyi.
 */
export function BottomNav() {
  const checklist = useQuery(api.checklist.list);
  const openTasks = (checklist ?? []).filter((item) => !item.done).length;
  const { pathname } = useLocation();
  const trackRef = useRef<HTMLDivElement>(null);

  // Pusatkan item aktif di dalam track (block "nearest" mencegah scroll vertikal).
  useEffect(() => {
    // NavLink otomatis menandai item aktif dengan aria-current="page".
    const active = trackRef.current?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    active?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [pathname]);

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div
        ref={trackRef}
        className="pointer-events-auto mx-auto flex max-w-md items-stretch justify-between gap-0.5 overflow-x-auto rounded-full border border-white/60 bg-card/85 p-1.5 shadow-[0_16px_40px_rgba(36,46,40,0.14)] backdrop-blur-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {BOTTOM_NAV.map(({ to, label, icon: Icon, active, badge }) => (
          <NavLink
            key={to}
            to={to}
            // `end` keeps Home from staying active on every nested /app/* route.
            end={to === "/app"}
            className={({ isActive }) =>
              `relative flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full py-2 text-[10px] font-semibold transition-all duration-200 ${
                isActive
                  ? `${active} px-3.5 font-bold`
                  : "px-2.5 text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className="size-5 shrink-0"
                  strokeWidth={isActive ? 2.4 : 2}
                />
                {isActive ? (
                  <span>{label}</span>
                ) : (
                  <span className="sr-only">{label}</span>
                )}
                {badge && openTasks > 0 && (
                  <span className="absolute right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-extrabold text-white">
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
