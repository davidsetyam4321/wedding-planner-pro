import { BottomNav } from "@/components/BottomNav";
import { coupleInitials } from "@/components/CouplePhoto";
import { BloomOverlay, FlowerMark, Petals } from "@/components/Decor";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { countdownLabel, formatDateID, formatRupiahShort } from "@/lib/format";
import {
  readStoredAnonymousUser,
  trackAnonymousUser,
} from "@/lib/session";
import { useAuth } from "@/hooks/use-auth";
import { SETUP_REFRESH_EVENT } from "@/lib/session";
import { Bell, Settings, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet } from "react-router";
import { useMutation, useQuery } from "convex/react";

/**
 * Runs ensureSetup once per signed-in user; the mutation itself is idempotent.
 * Re-runs when the user id changes (anonymous → email sign-in without a
 * reload, so the fresh account adopts this device's anonymous workspace) or
 * when SETUP_REFRESH_EVENT fires right after an email sign-in.
 */
function useEnsureSetup(
  userId: string | undefined,
  anonymousUserId?: Id<"users">,
) {
  const ensureSetup = useMutation(api.wedding.ensureSetup);
  const [tick, setTick] = useState(0);
  const [results, setResults] = useState<Record<string, "done" | "error">>({});

  const runKey = `${userId ?? ""}|${anonymousUserId ?? ""}|${tick}`;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    ensureSetup({ anonymousUserId })
      .then(() => {
        if (!cancelled)
          setResults((previous) => ({ ...previous, [runKey]: "done" }));
      })
      .catch(() => {
        if (!cancelled)
          setResults((previous) => ({ ...previous, [runKey]: "error" }));
      });
    return () => {
      cancelled = true;
    };
  }, [userId, anonymousUserId, runKey, ensureSetup]);

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1);
    window.addEventListener(SETUP_REFRESH_EVENT, refresh);
    return () => window.removeEventListener(SETUP_REFRESH_EVENT, refresh);
  }, []);

  const state = userId ? (results[runKey] ?? "pending") : "pending";
  return { state, retry: () => setTick((value) => value + 1) };
}

type WorkspaceStatus = {
  isOwner: boolean;
  isAnonymous: boolean;
  email: string | null;
  connectedEmail: string | null;
  inviteCode: string | null;
};

function NotificationBell({
  wedding,
  openTasks,
  workspace,
}: {
  wedding: { weddingDate: number; venueName?: string } | null | undefined;
  openTasks: number;
  workspace: WorkspaceStatus | null | undefined;
}) {
  const notes = useMemo(() => {
    const list: { id: string; label: string; tone?: "mint" | "amber" }[] = [];

    // Sync status first — this is what makes the bell reflect the shared
    // workspace in real time on both devices.
    if (workspace) {
      if (workspace.connectedEmail) {
        list.push({
          id: "sync",
          tone: "mint",
          label: `Tersinkron dengan ${workspace.connectedEmail} — perubahan kalian berdua langsung tampil di sini.`,
        });
      } else if (workspace.isAnonymous) {
        list.push({
          id: "sync",
          tone: "amber",
          label:
            "Ruang kerja masih anonim — masuk dengan email di Pengaturan agar data tersimpan & bisa dibagikan.",
        });
      } else if (workspace.inviteCode) {
        list.push({
          id: "sync",
          tone: "amber",
          label: `Menunggu pasangan bergabung · kode ${workspace.inviteCode}.`,
        });
      } else {
        list.push({
          id: "sync",
          tone: "amber",
          label:
            "Belum ada kode pasangan — buat di Pengaturan untuk mengajak pasanganmu.",
        });
      }
    }

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
        <p className="label px-2 pb-1 pt-1 text-muted-foreground">Notifikasi</p>
        <ul className="space-y-1">
          {notes.map((note) => (
            <li
              key={note.id}
              className="clay-inset flex items-start gap-2 px-3 py-2 text-xs leading-relaxed text-foreground"
            >
              {note.tone && (
                <span
                  className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                    note.tone === "mint"
                      ? "bg-tint-mint-foreground"
                      : "bg-amber-500"
                  }`}
                />
              )}
              <span>{note.label}</span>
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
  const { user } = useAuth();

  // Remember this device's anonymous user id so a later email sign-in can
  // adopt (migrate) the anonymous workspace atomically inside ensureSetup.
  useEffect(() => {
    if (user?._id && (user.isAnonymous ?? false)) {
      trackAnonymousUser(user._id);
    }
  }, [user?._id, user?.isAnonymous]);

  const { state: setupState, retry: retrySetup } = useEnsureSetup(
    user?._id,
    user && !(user.isAnonymous ?? false) ? readStoredAnonymousUser() : undefined,
  );
  const wedding = useQuery(api.wedding.get);
  const savings = useQuery(api.savings.list);
  const checklist = useQuery(api.checklist.list);
  const couplePhoto = useQuery(api.wedding.getCouplePhoto);
  const workspace = useQuery(api.workspace.status);

  const savingsTotal =
    savings?.reduce((sum, deposit) => sum + deposit.amount, 0) ?? 0;
  const fundTarget = wedding?.fundTarget ?? 0;
  const progressPct =
    fundTarget > 0 ? Math.min(100, (savingsTotal / fundTarget) * 100) : 0;
  const openTasks = (checklist ?? []).filter((item) => !item.done).length;

  // Themed sync screen while the workspace is being prepared or re-synced
  // (first visit, and right after signing in with an email).
  if (setupState === "pending" && !wedding) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Petals />
        <div className="clay grad-warm relative overflow-hidden px-8 py-7 text-center">
          <FlowerMark className="float-slow pointer-events-none absolute -right-3 -top-3 size-16 text-primary/20" />
          <div className="clay-sm relative mx-auto flex size-12 items-center justify-center rounded-full bg-white/70">
            <Sparkles className="size-5 animate-pulse text-primary" />
          </div>
          <p className="h-card relative mt-3">Menyiapkan ruang kerja…</p>
          <p className="meta relative mt-1">
            Menyinkronkan data pernikahan kalian
          </p>
        </div>
      </main>
    );
  }

  if (setupState === "error" && !wedding) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Petals />
        <div className="clay max-w-sm p-6 text-center">
          <p className="text-sm font-semibold">Gagal menyiapkan ruang kerja</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Periksa koneksi internetmu, lalu coba lagi.
          </p>
          <Button className="mt-4" onClick={retrySetup}>
            Coba lagi
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <Petals />
      <BloomOverlay />
      <header className="mx-auto max-w-md px-4 pt-5">
        <div className="clay grad-warm relative overflow-hidden p-5">
          <FlowerMark className="float-slow pointer-events-none absolute -right-3 -top-3 size-20 text-tint-peach-foreground/25" />
          <FlowerMark className="sway pointer-events-none absolute -left-4 bottom-2 size-14 text-primary/15" />
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-primary text-sm font-extrabold text-primary-foreground">
                {couplePhoto ? (
                  <img
                    src={couplePhoto}
                    alt="Foto pasangan"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    {coupleInitials(
                      wedding?.partnerOneName,
                      wedding?.partnerTwoName,
                    )}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="h-card truncate">
                  {wedding
                    ? `${wedding.partnerOneName} & ${wedding.partnerTwoName}`
                    : "…"}
                </p>
                <p className="meta truncate">
                  {wedding ? formatDateID(wedding.weddingDate) : ""}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <NotificationBell
                wedding={wedding}
                openTasks={openTasks}
                workspace={workspace}
              />
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

          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="meta mt-1.5">
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
