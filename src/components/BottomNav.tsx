import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { PRIMARY_NAV, TOOL_NAV } from "@/lib/nav";
import { LayoutGrid } from "@/lib/icons";
import { NavLink, useLocation } from "react-router";
import { useQuery } from "convex/react";

/** Fitur yang disembunyikan di dalam tombol "Lainnya". */
const GROUPED_PATHS = new Set(TOOL_NAV.map((feature) => feature.to));

/**
 * Bottom navigation mengambang: lima target sentuh dengan label selalu terlihat.
 * Empat tombol utama (Beranda, Budget, Checklist, Tamu) tampil langsung;
 * sisa fitur terkumpul di tombol "Lainnya" yang membuka daftar ke atas
 * tanpa berpindah halaman — baru memilih item yang menavigasi.
 * `key={pathname}` me-remount Popover setiap rute berubah sehingga daftar
 * tertutup otomatis (tanpa state/effect tambahan), sementara Radix menutup
 * saat klik di luar atau menekan Escape.
 */
export function BottomNav() {
  const checklist = useQuery(api.checklist.list);
  const openTasks = (checklist ?? []).filter((item) => !item.done).length;
  const { pathname } = useLocation();
  const inGroup = GROUPED_PATHS.has(pathname);

  return (
    <nav aria-label="Navigasi utama" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="pointer-events-auto mx-auto flex max-w-md items-stretch justify-between gap-0.5 rounded-3xl border border-white/90 bg-[color-mix(in_srgb,var(--background)_88%,white_12%)] p-1.5 shadow-[0_10px_30px_rgba(56,37,31,0.14)] backdrop-blur-2xl dark:border-white/15 dark:bg-slate-950/85 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PRIMARY_NAV.map(({ to, label, icon: Icon, active, badge }) => (
          <NavLink
            key={to}
            to={to}
            // `end` keeps Home from staying active on every nested /app/* route.
            end={to === "/app"}
            className={({ isActive }) =>
              `relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold transition-colors duration-200 ${
                isActive
                  ? `${active} font-bold`
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className="size-5 shrink-0"
                  weight={isActive ? "fill" : "regular"}
                />
                <span className="leading-tight">{label}</span>
                {badge && openTasks > 0 && (
                  <span className="absolute right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-berry-red px-1 text-[9px] font-semibold text-white">
                    {openTasks > 9 ? "9+" : openTasks}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        <Popover key={pathname}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Fitur lainnya"
              className={`relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition-colors duration-200 ${
                inGroup
                  ? "bg-tint-sage font-semibold text-tint-sage-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              } data-[state=open]:bg-tint-sage data-[state=open]:font-semibold data-[state=open]:text-tint-sage-foreground data-[state=open]:shadow-sm`}
            >
              <LayoutGrid
                className="size-5 shrink-0"
                weight={inGroup ? "fill" : "regular"}
              />
              <span className="leading-tight">Lainnya</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="w-60 rounded-2xl p-2"
          >
            <p className="label px-2 pb-1.5 text-muted-foreground">
              Fitur lainnya
            </p>
            <ul className="space-y-0.5">
              {TOOL_NAV.map((feature) => (
                <li key={feature.to}>
                  <NavLink
                    to={feature.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-bold transition-colors ${
                        isActive
                          ? `${feature.surface} shadow-sm`
                          : "text-foreground hover:bg-tint-sage"
                      }`
                    }
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${feature.surface}`}
                    >
                      <feature.icon className="size-4" weight="regular" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {feature.label}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}
