import { AmbientBackground } from "@/components/AmbientBackground";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";
import { OnboardingDialog } from "@/components/Onboarding";
import { SignupBanner } from "@/components/SignupBanner";
import { coupleInitials } from "@/components/CouplePhoto";
import { Petals, RingsMark, SprigMark } from "@/components/Decor";
import Aurora from "@/components/reactbits/Aurora";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PageSkeleton } from "@/components/Shared";
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
import { Bell, Cloud, CloudCheck, Sparkles } from "@/lib/icons";
import { motion, useReducedMotion } from "framer-motion";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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
  reminders,
}: {
  wedding: { weddingDate: number; venueName?: string } | null | undefined;
  openTasks: number;
  workspace: WorkspaceStatus | null | undefined;
  savingsNote: string | null;
  reminders: {
    id: string;
    label: string;
    dueDate: number;
    overdue: boolean;
    daysLeft: number;
  }[];
}) {
  const notes = useMemo(() => {
    const list: { id: string; label: string; tone?: "mint" | "amber" }[] = [];

    // Pengingat tenggat — yang terlambat didahulukan.
    for (const reminder of [...reminders]
      .sort((a, b) => Number(b.overdue) - Number(a.overdue) || a.dueDate - b.dueDate)
      .slice(0, 5)) {
      list.push({
        id: `due-${reminder.id}`,
        tone: reminder.overdue ? "amber" : "mint",
        label: reminder.overdue
          ? `Terlambat: ${reminder.label} (tenggat lewat ${Math.abs(reminder.daysLeft)} hari)`
          : reminder.daysLeft === 0
            ? `Hari ini: ${reminder.label}`
            : `${reminder.label} — ${reminder.daysLeft} hari lagi`,
      });
    }

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
  }, [workspace, wedding, openTasks, savingsNote, reminders]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative size-11 rounded-full"
          aria-label="Notifikasi"
        >
          <Bell className="size-5" />
          {reminders.some((reminder) => reminder.overdue) && (
            <span aria-label="Ada tenggat yang terlewat" className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background bg-destructive" />
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
  // Awal hari ini (stabil selama sesi) — basis hitung H-n pada pengingat.
  const [reminderNow] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

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
  // Tenggat tugas & vendor; `now` dikirim agar query deterministik.
  const reminders = useQuery(api.reminders.list, { now: reminderNow }) ?? [];
  const { pathname } = useLocation();
  const pageTitle = pageTitleFor(pathname);
  const reducedMotion = useReducedMotion();
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  // Satu listener untuk seluruh baris interaktif: spotlight kursor hanya
  // menulis dua CSS variable (tanpa state React, tanpa render ulang).
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let activeRow: HTMLElement | null = null;
    let nextX = 0;
    let nextY = 0;

    const paint = () => {
      frame = 0;
      if (!activeRow) return;
      activeRow.style.setProperty("--row-x", `${nextX}px`);
      activeRow.style.setProperty("--row-y", `${nextY}px`);
    };

    const handleMove = (event: PointerEvent) => {
      if (document.documentElement.dataset.effects === "off") return;
      const target = event.target as Element | null;
      const row = target?.closest?.(".interactive-row") as HTMLElement | null;
      if (!row) return;
      const rect = row.getBoundingClientRect();
      activeRow = row;
      nextX = event.clientX - rect.left;
      nextY = event.clientY - rect.top;
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    document.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", handleMove);
    };
  }, []);

  const savingsTotal =
    savings?.reduce((sum, deposit) => sum + deposit.amount, 0) ?? 0;
  const fundTarget = wedding?.fundTarget ?? 0;
  const savingsNote =
    fundTarget > 0
      ? `Tabungan ${formatRupiahShort(savingsTotal)} dari target ${formatRupiahShort(fundTarget)}.`
      : null;
  const openTasks = (checklist ?? []).filter((item) => !item.done).length;

  // Ajakan masuk email: hanya untuk workspace anonim yang sudah benar-benar
  // dipakai (onboarding selesai + ada data di luar seed default).
  const DEFAULT_CHECKLIST_ITEMS = 10;
  const hasOwnData =
    Boolean(wedding?.onboarded) &&
    ((checklist?.length ?? 0) > DEFAULT_CHECKLIST_ITEMS ||
      (savings?.length ?? 0) > 0);
  const showSignupBanner = workspace?.isAnonymous === true && hasOwnData;

  // Themed sync screen while the workspace is being prepared or re-synced
  // (first visit, and right after signing in with an email).
  if (setupState === "pending" && !wedding) {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center">
        <div aria-hidden="true" className="app-photo-backdrop" />
        <Aurora className="pointer-events-none absolute inset-0 -z-10" />
        <Petals />
        <div className="clay relative overflow-hidden px-8 py-7 text-center">
          <SprigMark className="float-slow pointer-events-none absolute -right-3 -top-3 size-16 text-primary/20" />
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
      <main className="relative isolate flex min-h-screen items-center justify-center p-6">
        <div aria-hidden="true" className="app-photo-backdrop" />
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
    <div className="app-workspace relative isolate mx-auto flex min-h-screen w-full max-w-[1680px]">
      <div aria-hidden="true" className="app-photo-backdrop" />
      <AmbientBackground />
      {/* Onboarding sekali jalan — tampil sekali sampai diselesaikan/dilewati. */}
      {wedding && !wedding.onboarded && (
        <OnboardingDialog
          defaultNames={{ one: wedding.partnerOneName, two: wedding.partnerTwoName }}
          defaultDate={wedding.weddingDate}
          defaultTarget={wedding.fundTarget}
        />
      )}
      <SideNav extra={{ openTasks, wedding, workspace, savingsNote, reminders, couplePhoto, partnerOneName: wedding?.partnerOneName, partnerTwoName: wedding?.partnerTwoName }} />
      <div className="sky-wash relative z-10 min-w-0 flex-1 pb-24 lg:pb-0">
      <a href="#planner-content" className="skip-link">Langsung ke isi perencanaan</a>
      <header className="mx-auto flex w-full max-w-md items-center gap-2 px-4 pt-4 sm:max-w-2xl sm:gap-3 sm:px-6 lg:hidden">
        <Link to="/app" aria-label="Beranda SatuJanji" className="flex min-h-11 items-center gap-2 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <RingsMark className="size-5" />
          <span className="font-serif text-xl">SatuJanji</span>
        </Link>
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{pageTitle}</span>
        {/* Status sinkron: live pill kecil — titik berdenyut + label singkat. */}
        <span
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)]/70 px-3 text-[0.8125rem] text-[var(--ink-soft)]"
          title={
            workspace?.connectedEmail
              ? `Tersinkron dengan ${workspace.connectedEmail}`
              : workspace?.isAnonymous
                ? "Ruang kerja lokal — masuk lewat Pengaturan agar tersinkron"
                : workspace?.inviteCode
                  ? "Menunggu pasangan bergabung"
                  : "Belum tersinkron"
          }
          aria-label={
            workspace?.connectedEmail
              ? `Tersinkron dengan ${workspace.connectedEmail}`
              : workspace?.isAnonymous
                ? "Ruang kerja lokal, belum tersinkron"
                : "Menunggu pasangan bergabung"
          }
          role="img"
        >
          <span className="live-dot text-[var(--positive)]" />
          <span className="hidden sm:inline">
            {workspace?.connectedEmail ? "Tersinkron" : "Lokal"}
          </span>
          {workspace?.connectedEmail ? (
            <CloudCheck className="hidden size-4 sm:block" weight="regular" />
          ) : (
            <Cloud className="size-4" weight="regular" />
          )}
        </span>
        <NotificationBell wedding={wedding} openTasks={openTasks} workspace={workspace} savingsNote={savingsNote} reminders={reminders} />
        <Link to="/app/pengaturan" aria-label="Buka pengaturan" className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-paper-sunk text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {couplePhoto ? <img src={couplePhoto} alt="" className="size-full object-cover" /> : coupleInitials(wedding?.partnerOneName, wedding?.partnerTwoName)}
        </Link>
      </header>

      <main id="planner-content" ref={mainRef} tabIndex={-1} aria-label={pageTitle || "Ringkasan perencanaan"} className="mx-auto w-full max-w-md px-4 pt-4 sm:max-w-2xl sm:px-6 lg:max-w-[1520px] lg:px-12 lg:pt-8 xl:px-16 2xl:px-20">
        <SignupBanner show={showSignupBanner} />
        {/* Entrance only: no delayed exit that can render the wrong Outlet. */}
        <motion.div
          key={pathname}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.18, ease: "easeOut" }}
        >
          <Suspense fallback={<PageSkeleton />}><Outlet /></Suspense>
        </motion.div>
      </main>

      <BottomNav />
      </div>
    </div>
  );
}
