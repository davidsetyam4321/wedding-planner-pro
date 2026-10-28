import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PRIMARY_NAV, TOOL_NAV } from "@/lib/nav";
import { LayoutGrid, Settings } from "@/lib/icons";
import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router";

/** Fitur yang disembunyikan di dalam tombol "Lainnya". */
const GROUPED_PATHS = new Set(TOOL_NAV.map((feature) => feature.to));

/**
 * Dock bawah mengambang dengan lima tujuan berlabel + "Lainnya".
 * "Lainnya" membuka bottom sheet (vaul) yang muncul dengan fisika spring dari
 * tepi bawah, berisi halaman lain dan tautan Pengaturan.
 */
export function BottomNav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const inGroup = GROUPED_PATHS.has(pathname) || pathname === "/app/pengaturan";

  return (
    <>
      <nav
        aria-label="Navigasi utama"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className="surface-card pointer-events-auto mx-auto flex max-w-md items-stretch justify-between gap-0.5 rounded-[22px] p-1">
          {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/app"}
              className={({ isActive }) =>
                `relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1.5 text-[11px] font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-[var(--brand)]"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-2 top-0 h-[2px] rounded-full bg-[var(--accent)]"
                    />
                  )}
                  <Icon className="size-[18px] shrink-0" weight={isActive ? "duotone" : "regular"} />
                  <span className="leading-tight">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={`relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1.5 text-[11px] font-medium transition-colors duration-200 ${
              inGroup ? "text-[var(--brand)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
          >
            {inGroup && (
              <span
                aria-hidden="true"
                className="absolute inset-x-2 top-0 h-[2px] rounded-full bg-[var(--accent)]"
              />
            )}
            <LayoutGrid className="size-[18px] shrink-0" weight={inGroup ? "duotone" : "regular"} />
            <span className="leading-tight">Lainnya</span>
          </button>
        </div>
      </nav>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent
          style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          className="max-h-[85dvh] overflow-y-auto border-[var(--line)] bg-[var(--paper)] pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <DrawerHeader className="text-left">
            <DrawerTitle className="display-serif text-2xl text-[var(--ink)]">
              Halaman lain
            </DrawerTitle>
            <DrawerDescription className="text-sm text-[var(--ink-soft)]">
              Sembilan modul perencanaan tetap dalam dua ketukan dari mana pun.
            </DrawerDescription>
          </DrawerHeader>

          <ul className="border-t border-[var(--line)] px-4">
            {TOOL_NAV.map((feature) => (
              <li key={feature.to} className="border-b border-[var(--line)]">
                <DrawerClose asChild>
                  <Link
                    to={feature.to}
                    className="interactive-row flex min-h-14 items-center gap-3 rounded-lg px-2 py-2.5 text-[var(--ink)]"
                  >
                    <feature.icon className="size-5 shrink-0 text-[var(--brand)]" weight="duotone" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-tight">{feature.label}</span>
                      <span className="mt-0.5 block text-[0.8125rem] leading-snug text-[var(--ink-soft)]">
                        {feature.desc}
                      </span>
                    </span>
                  </Link>
                </DrawerClose>
              </li>
            ))}
            <li>
              <DrawerClose asChild>
                <Link
                  to="/app/pengaturan"
                  className="interactive-row flex min-h-14 items-center gap-3 rounded-lg px-2 py-2.5 text-[var(--ink)]"
                >
                  <Settings className="size-5 shrink-0 text-[var(--brand)]" weight="duotone" />
                  <span className="min-w-0 flex-1 text-sm font-semibold">Pengaturan</span>
                </Link>
              </DrawerClose>
            </li>
          </ul>
        </DrawerContent>
      </Drawer>
    </>
  );
}
