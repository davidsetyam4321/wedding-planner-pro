import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";
import { coupleInitials } from "@/components/CouplePhoto";
import { BloomOverlay, FlowerMark, Petals } from "@/components/Decor";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Stagger, StaggerItem } from "@/components/Shared";
import { api } from "@/convex/_generated/api";
import { FEATURES } from "@/lib/features";
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
import { Link, Outlet, useLocation } from "react-router";
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

/** Judul halaman untuk header tipis — diambil dari rute aktif. */
function pageTitleFor(pathname: string): string {
  if (pathname === "/app") return "Beranda";
  const feature = FEATURES.find((item) => item.to === pathname);
  if (feature) return feature.label;
  if (pathname.startsWith("/app/pengaturan")) return "Pengaturan";
  return "Beranda";
}

function NotificationBell({
  wedding,
  openTasks,
  workspace,
  savingsNote,
}: {
  wedding: { weddingDate: number; venueName?: string } | null | undefined;
  openTasks: number;
  workspace: WorkspaceStatus | null | undefined;
  savingsNote: string | null;
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
          label: `Tersinkron dengan ${workspace.connectedEmail} — setiap perubahan langsung tersaji di kedua perangkat.`,
        });
      } else if (workspace.isAnonymous) {
        list.push({
          id: "sync",
          tone: "amber",
          label:
            "Ruang kerja masih lokal — masuk dengan email melalui Pengaturan agar data tersimpan dan dapat dibagikan.",
        });
      } else if (workspace.inviteCode) {
        list.push({
          id: "sync",
          tone: "amber",
          label: `Menunggu pasangan bergabung · kode undangan ${workspace.inviteCode}.`,
        });
      } else {
        list.push({
          id: "sync",
          tone: "amber",
          label:
            "Kode undangan belum dibuat — buat di Pengaturan untuk mengundang pasangan.",
        });
      }
    }

    if (savingsNote) {
      list.push({ id: "savings", tone: "mint", label: savingsNote });
    }

    if (wedding) {
      list.push({
        id: "countdown",
        label: `${countdownLabel(wedding.weddingDate)} menuju hari pernikahan · ${formatDateID(wedding.weddingDate)}`,
      });
      list.push({
        id: "checklist",
        label:
          openTasks === 0
            ? "Seluruh tugas telah diselesaikan."
            : `Terdapat ${openTasks} tugas yang belum diselesaikan.`,
      });
      if (wedding.venueName) {
        list.push({ id: "venue", label: `Lokasi acara: ${wedding.venueName}` });
      }
    }
    return list;
  }, [workspace, wedding, openTasks, savingsNote]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative size-9 rounded-full bg-card"
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
            <li className="px-3 py-2 text-xs text-muted-foreground">Memuat notifikasi…</li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell() {
  const { user } = useAuth();
  const [featuresOpen, setFeaturesOpen] = useState(false);

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
  const { pathname } = useLocation();
  const pageTitle = pageTitleFor(pathname);

  const savingsTotal =
    savings?.reduce((sum, deposit) => sum + deposit.amount, 0) ?? 0;
  const fundTarget = wedding?.fundTarget ?? 0;
  const savingsNote =
    fundTarget > 0
      ? `Tabungan ${formatRupiahShort(savingsTotal)} dari target ${formatRupiahShort(fundTarget)}.`
      : null;
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
            Menyinkronkan data pernikahan Anda dan pasangan
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
            Periksa koneksi internet Anda, lalu coba lagi.
          </p>
          <Button className="mt-4" onClick={retrySetup}>
            Coba lagi
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl">
      <SideNav status={workspace} />
      <div className="relative min-w-0 flex-1 pb-28 lg:pb-10">
      {/* Ambient botanical blur blobs — SatuJanji backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
      >
        <div className="absolute -left-20 -top-24 size-80 rounded-full bg-tint-mint/40 blur-3xl" />
        <div className="absolute -right-24 top-1/3 size-72 rounded-full bg-tint-butter/30 blur-3xl" />
      </div>
      <Petals />
      <BloomOverlay />
      <header className="sticky top-0 z-30 w-full bg-background/80 pb-2.5 pt-4 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 lg:max-w-3xl lg:px-10">
          <Link to="/app" className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-tint-mint shadow-sm lg:hidden">
              <FlowerMark className="size-5 text-primary" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <h1 className="truncate font-serif text-[17px] font-semibold text-primary">
                SatuJanji
              </h1>
              <span className="truncate text-[11px] font-semibold text-muted-foreground">
                {pageTitle}
              </span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            {wedding && (
              <span className="hidden items-center gap-1.5 rounded-full bg-tint-mint/70 px-3 py-1 text-[11px] font-semibold text-tint-mint-foreground shadow-sm backdrop-blur-md sm:flex">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                {wedding.partnerOneName} & {wedding.partnerTwoName} ❤️
              </span>
            )}
              <NotificationBell
                wedding={wedding}
                openTasks={openTasks}
                workspace={workspace}
                savingsNote={savingsNote}
              />
            <Link
              to="/app/pengaturan"
              aria-label="Pengaturan"
              className="block size-9 shrink-0 overflow-hidden rounded-full p-0.5 ring-2 ring-primary/25"
            >
              {couplePhoto ? (
                <img
                  src={couplePhoto}
                  alt="Foto pasangan"
                  className="h-full w-full object-cover"
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
          </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pt-4 lg:max-w-3xl lg:px-10">
        <Outlet />
      </main>

      <Drawer open={featuresOpen} onOpenChange={setFeaturesOpen}>
        <DrawerContent className="max-h-[85dvh] overflow-y-auto sm:mx-auto sm:max-w-md data-[vaul-drawer-direction=bottom]:rounded-t-3xl">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-serif text-xl">Semua Fitur</DrawerTitle>
            <DrawerDescription>
              Akses seluruh modul perencanaan pernikahan Anda dalam satu tempat.
            </DrawerDescription>
          </DrawerHeader>

          <Stagger className="grid grid-cols-2 gap-3 px-4">
            {FEATURES.map((feature) => (
              <StaggerItem key={feature.to}>
                <DrawerClose asChild>
                  <Link
                    to={feature.to}
                    className={`clay clay-press block p-4 ${feature.surface}`}
                  >
                    <span className="flex items-center justify-between">
                      <feature.icon className="size-5" />
                      <span className="text-lg">{feature.emoji}</span>
                    </span>
                    <span className="mt-2.5 block text-sm font-extrabold leading-tight">
                      {feature.label}
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug opacity-80">
                      {feature.desc}
                    </span>
                  </Link>
                </DrawerClose>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="px-4 pb-8">
            <DrawerClose asChild>
              <Link
                to="/app/pengaturan"
                className="clay clay-press flex items-center justify-between px-4 py-3.5 text-sm font-extrabold"
              >
                Pengaturan
                <Settings className="size-4 text-muted-foreground" />
              </Link>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>

      <BottomNav />
      </div>
    </div>
  );
}
