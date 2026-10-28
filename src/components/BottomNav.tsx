import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PRIMARY_NAV, TOOL_NAV } from "@/lib/nav";
import { LayoutGrid } from "@/lib/icons";
import { NavLink, useLocation } from "react-router";

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
  const { pathname } = useLocation();
  const inGroup = GROUPED_PATHS.has(pathname);

  return (
    <nav aria-label="Navigasi utama" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="pointer-events-auto mx-auto flex max-w-sm items-stretch justify-between gap-0.5 rounded-2xl border border-border bg-background p-1 shadow-float [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PRIMARY_NAV.map(({ to, label, icon: Icon, active }) => (
          <NavLink
            key={to}
            to={to}
            // `end` keeps Home from staying active on every nested /app/* route.
            end={to === "/app"}
            className={({ isActive }) =>
              `relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[11px] sm:min-h-12 sm:gap-1 sm:rounded-2xl sm:px-1 sm:py-2 sm:text-xs font-semibold transition-colors duration-200 ${
                isActive
                  ? `${active} font-bold`
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className="size-[18px] shrink-0 sm:size-5"
                  weight={isActive ? "fill" : "regular"}
                />
                <span className="leading-tight">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        <Popover key={pathname}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Fitur lainnya"
              className={`relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1.5 text-[11px] sm:min-h-12 sm:gap-1 sm:px-1 sm:py-2 sm:text-xs font-medium transition-colors duration-200 ${
                inGroup
                  ? "font-semibold text-[var(--brand)]"
                  : "text-muted-foreground hover:text-foreground"
              } data-[state=open]:font-semibold data-[state=open]:text-[var(--brand)]`}
            >
              <LayoutGrid
                className="size-[18px] shrink-0 sm:size-5"
                weight={inGroup ? "fill" : "regular"}
              />
              <span className="leading-tight">Lainnya</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="w-60 rounded-lg border-[var(--line)] bg-[var(--paper)] p-2"
          >
            <p className="px-2 pb-1.5 text-sm text-[var(--ink-soft)]">
              Halaman lain
            </p>
            <ul className="divide-y divide-[var(--line)]">
              {TOOL_NAV.map((feature) => (
                <li key={feature.to}>
                  <NavLink
                    to={feature.to}
                    className={({ isActive }) =>
                      `flex min-h-11 items-center gap-2.5 px-2 text-sm transition-colors ${
                        isActive
                          ? "font-semibold text-[var(--brand)]"
                          : "text-[var(--ink)] hover:text-[var(--brand)]"
                      }`
                    }
                  >
                    <feature.icon className="size-4 shrink-0" weight="regular" />
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
