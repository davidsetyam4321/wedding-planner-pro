import { Cloud, CloudCheck, Home, Settings } from "@/lib/icons";
import { NotificationBell } from "@/components/AppShellNav";
import { FEATURES } from "@/lib/features";
import { NavLink, Link } from "react-router";
import { motion, useReducedMotion } from "framer-motion";

type SideNavExtra = {
  openTasks: number;
  wedding: Parameters<typeof NotificationBell>[0]["wedding"];
  workspace: Parameters<typeof NotificationBell>[0]["workspace"];
  savingsNote: string | null;
  reminders: Parameters<typeof NotificationBell>[0]["reminders"];
  couplePhoto: string | null | undefined;
  partnerOneName?: string;
  partnerTwoName?: string;
};

const SPRING = { type: "spring" as const, stiffness: 420, damping: 32 };

const DESKTOP_GROUPS = [
  { title: "Uang", paths: ["/app/budget", "/app/tabungan", "/app/vendor"] },
  { title: "Acara", paths: ["/app/tamu", "/app/rundown", "/app/checklist"] },
  { title: "Koleksi", paths: ["/app/moodboard", "/app/seserahan"] },
] as const;

/**
 * Sidebar kaca mengambang. Indikator aktif digambar sebagai goresan emas yang
 * meluncur dengan spring di antara item (shared layout), label selalu terlihat,
 * dan status sinkron tampil sebagai pill hidup di kaki sidebar.
 */
export function SideNav({ extra }: { extra?: SideNavExtra }) {
  const reducedMotion = useReducedMotion();
  const allFeatures = FEATURES.filter((feature) => feature.to !== "/app");
  const SyncIcon = extra?.workspace?.connectedEmail ? CloudCheck : Cloud;
  const syncLabel = extra?.workspace?.connectedEmail
    ? "Tersinkron dengan pasangan"
    : extra?.workspace?.isAnonymous
      ? "Ruang kerja lokal"
      : "Menunggu pasangan";

  const itemClass =
    "group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium text-[var(--ink)] transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]";

  const indicator = (isActive: boolean) =>
    isActive ? (
      <motion.span
        aria-hidden="true"
        layoutId="satujanji-active-nav"
        className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[var(--accent)]"
        transition={reducedMotion ? { duration: 0 } : SPRING}
      />
    ) : null;

  return (
    <aside
      aria-label="Navigasi desktop"
      className="app-sidebar sticky top-0 z-30 hidden h-screen w-[18rem] shrink-0 flex-col px-4 py-5 lg:flex"
    >
      <div className="surface-card flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-5">
        <Link
          to="/app"
          className="flex items-baseline gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
        >
          <span className="display-serif text-3xl leading-none text-[var(--brand)]">SatuJanji</span>
          <span className="text-[0.8125rem] text-[var(--ink-soft)]">berdua</span>
        </Link>

        <p
          className="mt-3 flex items-center gap-2 truncate rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--paper)_62%,transparent)] px-3 py-2 text-sm text-[var(--ink)]"
          title={`${extra?.partnerOneName ?? ""} & ${extra?.partnerTwoName ?? ""}`}
        >
          <span className="live-dot text-[var(--positive)]" />
          <span className="min-w-0 truncate">
            {extra?.partnerOneName} &amp; {extra?.partnerTwoName}
          </span>
        </p>

        <nav className="mt-6 min-h-0 flex-1 space-y-6 overflow-y-auto pr-1" aria-label="Menu perencanaan">
          <div>
            <p className="mb-1 px-3 text-[0.8125rem] text-[var(--ink-soft)]">Utama</p>
            <NavLink to="/app" end className={itemClass}>
              {({ isActive }) => (
                <>
                  {indicator(isActive)}
                  <Home className="size-[18px]" weight={isActive ? "duotone" : "regular"} />
                  <span>Beranda</span>
                </>
              )}
            </NavLink>
          </div>

          {DESKTOP_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-1 px-3 text-[0.8125rem] text-[var(--ink-soft)]">{group.title}</p>
              <ul className="space-y-0.5">
                {group.paths.map((path) => {
                  const feature = allFeatures.find((item) => item.to === path);
                  if (!feature) return null;
                  const Icon = feature.icon;
                  return (
                    <li key={path}>
                      <NavLink to={feature.to} className={itemClass}>
                        {({ isActive }) => (
                          <>
                            {indicator(isActive)}
                            <Icon className="size-[18px]" weight={isActive ? "duotone" : "regular"} />
                            <span>{feature.label}</span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-4 border-t border-[var(--line)] pt-3">
          {extra && (
            <div className="mb-2 flex items-center gap-2">
              <span
                className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-1 text-[0.8125rem] text-[var(--ink-soft)]"
                title={
                  extra.workspace?.connectedEmail
                    ? `Tersinkron dengan ${extra.workspace.connectedEmail}`
                    : syncLabel
                }
              >
                <span className="live-dot text-[var(--positive)]" />
                <SyncIcon className="size-4 shrink-0" weight="regular" />
                <span className="min-w-0 truncate">{syncLabel}</span>
              </span>
              <NotificationBell
                wedding={extra.wedding}
                openTasks={extra.openTasks}
                workspace={extra.workspace}
                savingsNote={extra.savingsNote}
                reminders={extra.reminders}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Link
              to="/app/pengaturan"
              aria-label="Buka pengaturan akun"
              className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--line)] bg-[var(--paper-sunk)] font-serif text-base text-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            >
              {extra?.couplePhoto ? (
                <img src={extra.couplePhoto} alt="" className="size-full object-cover" />
              ) : (
                `${extra?.partnerOneName?.charAt(0) ?? ""}${extra?.partnerTwoName?.charAt(0) ?? ""}`
              )}
            </Link>
            <NavLink to="/app/pengaturan" className="group relative flex min-h-11 flex-1 items-center gap-2 text-[15px] font-medium text-[var(--ink)] hover:text-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]">
              {({ isActive }) => (
                <>
                  {indicator(isActive)}
                  <Settings className="size-[18px]" />
                  <span className="px-1">Pengaturan</span>
                </>
              )}
            </NavLink>
          </div>
        </div>
      </div>
    </aside>
  );
}
