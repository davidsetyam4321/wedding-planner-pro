import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { countdownLabel, formatDateID, formatRupiahShort } from "@/lib/format";
import { Bell, Loader2, Settings } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet } from "react-router";
import { useMutation, useQuery } from "convex/react";

/** Runs ensureSetup once per mount; the mutation itself is idempotent. */
function useEnsureSetup() {
  const ensureSetup = useMutation(api.wedding.ensureSetup);
  const [state, setState] = useState<"pending" | "done" | "error">("pending");
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    ensureSetup({})
      .then(() => setState("done"))
      .catch(() => setState("error"));
  }, [ensureSetup]);

  return state;
}

function initials(one: string | undefined, two: string | undefined): string {
  const a = one?.trim().charAt(0) ?? "";
  const b = two?.trim().charAt(0) ?? "";
  return `${a}${b}`.toUpperCase() || "PW";
}

function NotificationBell({
  wedding,
  openTasks,
}: {
  wedding: { weddingDate: number; venueName?: string } | null | undefined;
  openTasks: number;
}) {
  const notes = useMemo(() => {
    const list: { id: string; label: string }[] = [];
    if (wedding) {
      list.push({
        id: "countdown",
        label: `${countdownLabel(wedding.weddingDate)} menuju hari-H · ${formatDateID(wedding.weddingDate)}`,
      });
      list.push({
        id: "checklist",
        label:
          openTasks === 0
            ? "Semua tugas checklist sudah selesai. Mantap!"
            : `${openTasks} tugas checklist masih menunggu.`,
      });
      if (wedding.venueName) {
        list.push({ id: "venue", label: `Venue: ${wedding.venueName}` });
      }
    }
    return list;
  }, [wedding, openTasks]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative size-10 rounded-full bg-card"
          aria-label="Notifikasi"
        >
          <Bell className="size-4" />
          {openTasks > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {openTasks > 9 ? "9+" : openTasks}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <p className="px-2 pb-1 pt-1 text-xs font-semibold text-muted-foreground">
          Notifikasi
        </p>
        <ul className="space-y-1">
          {notes.map((note) => (
            <li
              key={note.id}
              className="clay-inset px-3 py-2 text-xs leading-relaxed text-foreground"
            >
              {note.label}
            </li>
          ))}
          {notes.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted-foreground">Memuat…</li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell() {
  const setupState = useEnsureSetup();
  const wedding = useQuery(api.wedding.get);
  const savings = useQuery(api.savings.list);
  const checklist = useQuery(api.checklist.list);

  const setupReady =
    setupState !== "pending" || (wedding !== undefined && wedding !== null);

  const savingsTotal =
    savings?.reduce((sum, deposit) => sum + deposit.amount, 0) ?? 0;
  const fundTarget = wedding?.fundTarget ?? 0;
  const progressPct =
    fundTarget > 0 ? Math.min(100, (savingsTotal / fundTarget) * 100) : 0;
  const openTasks = (checklist ?? []).filter((item) => !item.done).length;

  if (!setupReady) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-7 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <header className="mx-auto max-w-md px-4 pt-5">
        <div className="clay p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="clay-sm flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground">
                {initials(wedding?.partnerOneName, wedding?.partnerTwoName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight">
                  {wedding
                    ? `${wedding.partnerOneName} & ${wedding.partnerTwoName}`
                    : "…"}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {wedding ? formatDateID(wedding.weddingDate) : ""}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <NotificationBell wedding={wedding} openTasks={openTasks} />
              <Button
                asChild
                variant="outline"
                size="icon"
                className="size-10 rounded-full bg-card"
              >
                <Link to="/app/pengaturan" aria-label="Pengaturan">
                  <Settings className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="clay-inset px-3 py-2">
              <p className="text-[10px] font-medium text-muted-foreground">
                Hitung mundur
              </p>
              <p className="text-sm font-bold">
                {wedding ? countdownLabel(wedding.weddingDate) : "—"}
              </p>
            </div>
            <div className="clay-inset px-3 py-2">
              <p className="text-[10px] font-medium text-muted-foreground">
                Terkumpul
              </p>
              <p className="text-sm font-bold text-primary">
                {formatRupiahShort(savingsTotal)}
              </p>
            </div>
            <div className="clay-inset px-3 py-2">
              <p className="text-[10px] font-medium text-muted-foreground">Tugas</p>
              <p className="text-sm font-bold">{openTasks} tersisa</p>
            </div>
          </div>

          <div className="clay-inset mt-3 h-2.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {formatRupiahShort(savingsTotal)} dari target{" "}
            {formatRupiahShort(fundTarget)}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
