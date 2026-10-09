import { RingsMark } from "@/components/Decor";
import { coupleInitials } from "@/components/CouplePhoto";
import { NotificationBell } from "@/components/AppShellNav";
import { FEATURES } from "@/lib/features";
import { countdownLabel } from "@/lib/format";
import { Settings } from "lucide-react";
import { NavLink, Link } from "react-router";

type SyncInfo = {
  isAnonymous: boolean;
  email: string | null;
  connectedEmail: string | null;
} | null | undefined;

type SideNavExtra = {
  /** Jumlah tugas terbuka — badge di item Checklist. */
  openTasks: number;
  wedding:
    | (Partial<{
        venueName: string;
        onboarded: boolean;
      }> & {
        weddingDate: number;
        partnerOneName: string;
        partnerTwoName: string;
      })
    | null
    | undefined;
  couplePhoto: string | null | undefined;
  /** Status sinkron lengkap untuk bell (dengan inviteCode). */
  status:
    | {
        isAnonymous: boolean;
        email: string | null;
        connectedEmail: string | null;
        inviteCode: string | null;
      }
    | null
    | undefined;
  /** Catatan tabungan untuk bell. */
  savingsNote: string | null;
  /** Pengingat tugas/vendor untuk bell. */
  reminders: {
    id: string;
    label: string;
    dueDate: number;
    overdue: boolean;
    daysLeft: number;
  }[];
};

/**
 * Satu-satunya tempat navigasi (desktop): brand, SELURUH fitur, dan aksi
 * akun — sebelumnya terbagi dengan header atas yang kini dihapus.
 */
export function SideNav({
  status,
  extra,
}: {
  status: SyncInfo;
  extra?: SideNavExtra;
}) {
  const wedding = extra?.wedding;
  const daysLabel =
    wedding && wedding.onboarded ? countdownLabel(wedding.weddingDate) : undefined;

  return (
    <aside
      aria-label="Navigasi utama"
      className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-4 border-r border-white/50 bg-white/55 px-5 py-6 shadow-[8px_0_36px_rgba(60,40,35,0.04)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/55 lg:flex"
    >
      {/* Brand + nama pasangan + hitung mundur — menggantikan blok kiri header */}
      <Link to="/app" className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-full border border-foreground/10 bg-midnight-navy">
          <RingsMark className="size-6 text-white" />
        </span>
        <span className="min-w-0">
          <span className="block font-serif text-xl font-light leading-tight text-primary">
            SatuJanji
          </span>
          {wedding ? (
            <span className="meta block truncate">
              {wedding.partnerOneName} & {wedding.partnerTwoName}
              {daysLabel && (
                <span className="text-atmosphere-blue"> · {daysLabel}</span>
              )}
            </span>
          ) : (
            <span className="meta block">Rencana pernikahan untuk berdua</span>
          )}
        </span>
      </Link>

      {/* SEMUA fitur, satu daftar — bukan lagi dipisah "utama/Alat" */}
      <nav className="flex flex-col gap-1">
        {FEATURES.map(({ to, label, icon: Icon, surface }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/app"}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-full px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? `${surface} shadow-sm`
                  : "text-muted-foreground hover:bg-mist-gray hover:text-foreground"
              }`
            }
            title={label}
          >
            <Icon className="size-4" />
            <span className="truncate">{label}</span>
            {to === "/app/checklist" && extra && extra.openTasks > 0 && (
              <span className="ml-auto shrink-0 rounded-full bg-berry-red px-1.5 py-0.5 text-[10px] font-bold text-white">
                {extra.openTasks > 9 ? "9+" : extra.openTasks}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-2">
        {/* Bell + avatar — aksi header dipindah ke sini, ikut ke bawah panel */}
        {extra && (
          <div className="flex items-center justify-between gap-2 px-1">
            <NotificationBell
              wedding={extra.wedding}
              openTasks={extra.openTasks}
              workspace={extra.status}
              savingsNote={extra.savingsNote}
              reminders={extra.reminders}
            />
            <Link
              to="/app/pengaturan"
              aria-label="Pengaturan / foto pasangan"
              className="block size-9 shrink-0 overflow-hidden rounded-full p-0.5 ring-2 ring-atmosphere-blue/40"
            >
              {extra.couplePhoto ? (
                <img
                  src={extra.couplePhoto}
                  alt="Foto pasangan"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center rounded-full bg-primary text-[11px] font-extrabold text-primary-foreground">
                  {coupleInitials(
                    wedding?.partnerOneName,
                    wedding?.partnerTwoName,
                  )}
                </span>
              )}
            </Link>
          </div>
        )}

        <div className="clay-inset flex items-center gap-2.5 rounded-2xl px-3 py-2.5">
          <span
            className={`size-2 shrink-0 rounded-full ${
              status?.connectedEmail ? "bg-atmosphere-blue" : "bg-berry-red"
            }`}
          />
          <div className="min-w-0 flex-1">
            <p className="label text-muted-foreground">
              {status?.connectedEmail ? "Tersinkron dengan" : "Status akun"}
            </p>
            <p className="truncate text-xs font-medium">
              {status?.connectedEmail ?? status?.email ?? "Masuk dengan email"}
            </p>
          </div>
        </div>
        <Link
          to="/app/pengaturan"
          className="flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-mist-gray hover:text-foreground"
        >
          <Settings className="size-4" /> Pengaturan
        </Link>
      </div>
    </aside>
  );
}
