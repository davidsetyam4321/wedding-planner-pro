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

const DESKTOP_GROUPS = [
  { title: "Uang", paths: ["/app/budget", "/app/tabungan", "/app/vendor"] },
  { title: "Acara", paths: ["/app/tamu", "/app/rundown", "/app/checklist"] },
  { title: "Koleksi", paths: ["/app/moodboard", "/app/seserahan"] },
] as const;

/** Sidebar berlabel; seluruh fitur tetap dapat dijangkau lewat satu klik. */
export function SideNav({ extra }: { extra?: SideNavExtra }) {
  const reducedMotion = useReducedMotion();
  const allFeatures = FEATURES.filter((feature) => feature.to !== "/app");
  const SyncIcon = extra?.workspace?.connectedEmail ? CloudCheck : Cloud;

  return (
    <aside
      aria-label="Navigasi desktop"
      className="app-sidebar sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col border-r border-border/80 bg-background px-5 py-6 xl:w-72 lg:flex"
    >
      <Link to="/app" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="font-serif text-3xl text-primary">SatuJanji</span>
        <span aria-hidden="true" className="mt-2 block h-px flex-1 bg-border" />
      </Link>
      <p className="mt-2 truncate rounded-md border border-border px-3 py-2 text-sm text-muted-foreground" title={`${extra?.partnerOneName ?? ""} & ${extra?.partnerTwoName ?? ""}`}>
        {extra?.partnerOneName} &amp; {extra?.partnerTwoName}
      </p>

      <nav className="mt-9 min-h-0 flex-1 space-y-7 overflow-y-auto" aria-label="Menu perencanaan">
        <div>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">Ruang kerja</p>
          <NavLink to="/app" end className="group relative flex min-h-11 items-center gap-3 rounded-md px-3 text-[15px] font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {({ isActive }) => <>
              {isActive && <motion.span aria-hidden="true" layoutId="satujanji-active-nav" className="absolute inset-y-1 left-0 w-0.5 bg-primary" transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative flex min-h-11 flex-1 items-center gap-3 px-1"><Home className="size-[18px]" weight={isActive ? "bold" : "regular"} />Beranda</span>
            </>}
          </NavLink>
        </div>
        {DESKTOP_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 text-sm font-semibold text-muted-foreground">{group.title}</p>
            <ul className="space-y-1">
              {group.paths.map((path) => {
                const feature = allFeatures.find((item) => item.to === path);
                if (!feature) return null;
                const Icon = feature.icon;
                return <li key={path}><NavLink to={feature.to} className="group relative flex min-h-11 items-center gap-3 rounded-md px-3 text-[15px] font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {({ isActive }) => <>
                    {isActive && <motion.span aria-hidden="true" layoutId="satujanji-active-nav" className="absolute inset-y-1 left-0 w-0.5 bg-primary" transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }} />}
                    <span className="relative flex min-h-11 flex-1 items-center gap-3 px-1"><Icon className="size-[18px]" weight={isActive ? "bold" : "regular"} />{feature.label}</span>
                  </>}
                </NavLink></li>;
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-5 border-t border-border pt-4">
        {extra && (
          <div className="mb-3 flex items-center justify-end gap-3">
            <span
              className="flex size-11 items-center justify-center text-muted-foreground"
              title={extra.workspace?.connectedEmail ? `Tersinkron dengan ${extra.workspace.connectedEmail}` : extra.workspace?.isAnonymous ? "Ruang kerja lokal — belum dibagikan" : extra.workspace?.inviteCode ? "Menunggu pasangan bergabung" : "Belum tersinkron"}
              aria-label={extra.workspace?.connectedEmail ? `Tersinkron dengan ${extra.workspace.connectedEmail}` : extra.workspace?.isAnonymous ? "Ruang kerja lokal — belum dibagikan" : extra.workspace?.inviteCode ? "Menunggu pasangan bergabung" : "Belum tersinkron"}
            >
              <SyncIcon className="size-[18px]" weight="regular" />
            </span>
            <NotificationBell wedding={extra.wedding} openTasks={extra.openTasks} workspace={extra.workspace} savingsNote={extra.savingsNote} reminders={extra.reminders} />
          </div>
        )}
        <div className="flex items-center gap-3">
          <Link to="/app/pengaturan" aria-label="Buka pengaturan akun" className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-paper-sunk font-serif text-base text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {extra?.couplePhoto ? <img src={extra.couplePhoto} alt="" className="size-full object-cover" /> : `${extra?.partnerOneName?.charAt(0) ?? ""}${extra?.partnerTwoName?.charAt(0) ?? ""}`}
          </Link>
          <NavLink to="/app/pengaturan" className="group relative flex min-h-11 flex-1 items-center gap-2 text-[15px] font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {({ isActive }) => <>
              {isActive && <motion.span aria-hidden="true" layoutId="satujanji-active-nav" className="absolute inset-y-1 left-0 w-0.5 bg-primary" transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative flex min-h-11 items-center gap-2 px-1"><Settings className="size-[18px]" />Pengaturan</span>
            </>}
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
