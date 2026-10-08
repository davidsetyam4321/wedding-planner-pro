import { FlowerMark } from "@/components/Decor";
import { Separator } from "@/components/ui/separator";
import { PRIMARY_NAV, TOOL_NAV } from "@/lib/nav";
import { Settings } from "lucide-react";
import { NavLink, Link } from "react-router";

type SyncInfo = {
  isAnonymous: boolean;
  email: string | null;
  connectedEmail: string | null;
} | null | undefined;

/** Desktop-only navigation sidebar (BottomNav takes over below `lg`). */
export function SideNav({ status }: { status: SyncInfo }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-4 px-5 py-6 lg:flex">
      <Link to="/app" className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-teak-ink">
          <FlowerMark className="size-6 text-white" />
        </span>
        <span>
          <span className="block font-serif text-lg font-semibold leading-tight text-primary">
            SatuJanji
          </span>
          <span className="meta block">Rencana pernikahan untuk berdua</span>
          <span className="aksara block text-[11px] leading-tight text-brass-gold">
            ꦱꦠꦸꦗꦚ꧀ꦗꦶ
          </span>
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {PRIMARY_NAV.map(({ to, label, icon: Icon, active }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/app"}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-full px-3 py-2.5 text-sm font-bold transition-colors ${
                isActive
                  ? `${active}`
                  : "text-muted-foreground hover:bg-tint-sage hover:text-foreground"
              }`
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      <div className="flex flex-col gap-0.5">
        <p className="label px-3 pb-1.5 text-muted-foreground">Alat</p>
        {TOOL_NAV.map(({ to, label, icon: Icon, surface }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-semibold transition-colors ${
                isActive
                  ? `${surface} shadow-sm`
                  : "text-muted-foreground hover:bg-tint-sage hover:text-foreground"
              }`
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="mt-auto space-y-2">
        <div className="clay-inset flex items-center gap-2.5 rounded-2xl px-3 py-2.5">
          <span
            className={`size-2 shrink-0 rounded-full ${
              status?.connectedEmail
                ? "bg-tint-mint-foreground"
                : "bg-amber-500"
            }`}
          />
          <div className="min-w-0 flex-1">
            <p className="label text-muted-foreground">
              {status?.connectedEmail ? "Tersinkron dengan" : "Status akun"}
            </p>
            <p className="truncate text-xs font-bold">
              {status?.connectedEmail ??
                status?.email ??
                "Masuk dengan email"}
            </p>
          </div>
        </div>
        <Link
          to="/app/pengaturan"
          className="flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-tint-sage hover:text-foreground"
        >
          <Settings className="size-4" /> Pengaturan
        </Link>
      </div>
    </aside>
  );
}
