import { coupleInitials, useCouplePhotoUpload } from "@/components/CouplePhoto";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { bloom } from "@/lib/bloom";
import { vendorPaidAmount } from "@/lib/budget";
import { countdownParts, formatDateLongID, formatDateID, formatRupiah } from "@/lib/format";
import { normalizePriority, PRIORITY_LABEL, PRIORITY_RANK } from "@/lib/priority";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Heart,
  Loader2,
  MapPin,
  Palette,
  UserPlus,
  Wallet,
} from "@/lib/icons";
import type { Icon } from "@/lib/icons";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";

const HERO_FALLBACK = "/assets/pengantin-panggih.jpg";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Satu digit odometer: hanya digit yang berubah yang menggulung. */
function OdometerDigit({ value, animate }: { value: string; animate: boolean }) {
  return (
    <span className="odo-digit">
      <span key={value} style={animate ? undefined : { animation: "none" }}>
        {value}
      </span>
    </span>
  );
}

/**
 * Hitung mundur hidup. Angka dihentikan saat tab tersembunyi, dan hanya digit
 * yang berubah yang dianimasikan supaya tidak ada gerak terus-menerus.
 */
function CountdownTimer({ weddingDate }: { weddingDate: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let timer = 0;
    const update = () => {
      window.clearInterval(timer);
      if (document.visibilityState === "visible") {
        setNow(Date.now());
        timer = window.setInterval(() => setNow(Date.now()), 1000);
      }
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const parts = countdownParts(weddingDate, now);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const effectsOff = document.documentElement.dataset.effects === "off";
  const animate = !reducedMotion && !effectsOff;
  const cells = [
    { value: parts.days, label: "hari" },
    { value: parts.hours, label: "jam" },
    { value: parts.minutes, label: "menit" },
    { value: parts.seconds, label: "detik" },
  ];

  return (
    <div
      role="timer"
      aria-label={`Hitung mundur menuju hari pernikahan: ${parts.days} hari, ${parts.hours} jam, ${parts.minutes} menit, ${parts.seconds} detik`}
    >
      <span className="sr-only" aria-live="polite">
        {parts.days} hari menuju hari pernikahan
      </span>
      <div aria-hidden="true" className="grid grid-cols-4 gap-2 sm:gap-4">
        {cells.map(({ value, label }, index) => {
          const digits = String(value).padStart(2, "0");
          return (
            <div
              key={label}
              className={`min-w-0 ${index > 0 ? "border-l border-white/25 pl-2 sm:pl-4" : ""}`}
            >
              <span className="display-serif num flex text-[clamp(1.75rem,5vw,2.75rem)] leading-none text-white">
                {digits.split("").map((digit, digitIndex) => (
                  <OdometerDigit
                    key={`${label}-${digitIndex}`}
                    value={digit}
                    animate={animate}
                  />
                ))}
              </span>
              <span className="mt-2 block text-[0.8125rem] text-white/85">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Bar tipis dengan isian yang tumbuh lewat transform (bukan width). */
function MiniBar({ ratio, tone = "brand" }: { ratio: number; tone?: "brand" | "accent" }) {
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <span className="surface-sunk shimmer-track block h-1.5 w-full overflow-hidden rounded-full">
      <span
        className={`block h-full origin-left rounded-full transition-transform duration-500 ${
          tone === "accent" ? "bg-[var(--accent)]" : "bg-[var(--brand)]"
        }`}
        style={{ transform: `scaleX(${clamped})` }}
      />
    </span>
  );
}

function deadlineLabel(dueDate: number | undefined, today: number) {
  if (!dueDate) return { text: "Tanpa tenggat", tone: "text-[var(--ink-soft)]" };
  const days = Math.ceil((dueDate - today) / DAY_MS);
  const text =
    days < 0
      ? `Terlambat ${Math.abs(days)} hari`
      : days === 0
        ? "Tenggat hari ini"
        : days === 1
          ? "Besok"
          : `H-${days}`;
  const tone =
    days < 0
      ? "text-[var(--danger)]"
      : days <= 3
        ? "text-[var(--gold)]"
        : "text-[var(--ink-soft)]";
  return { text: `${formatDateID(dueDate)} · ${text}`, tone };
}

export function HomePage() {
  const navigate = useNavigate();
  const wedding = useQuery(api.wedding.get);
  const budget = useQuery(api.budget.overview);
  const checklist = useQuery(api.checklist.list);
  const guests = useQuery(api.guests.list);
  const vendors = useQuery(api.vendors.list);
  const toggleItem = useMutation(api.checklist.toggle);
  const couplePhoto = useQuery(api.wedding.getCouplePhoto);
  const { uploading, openPicker, inputProps } = useCouplePhotoUpload();

  const [bootTime] = useState(() => Date.now());
  const [openingScene, setOpeningScene] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (document.documentElement.dataset.effects === "off") return false;
    try {
      const storageKey = "satujanji.dashboard-scene";
      if (window.sessionStorage.getItem(storageKey)) return false;
      window.sessionStorage.setItem(storageKey, "seen");
      return true;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!openingScene) return;
    const timeout = window.setTimeout(() => setOpeningScene(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [openingScene]);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const effectsDisabled = document.documentElement.dataset.effects === "off";
  const sceneOn = openingScene && !reducedMotion && !effectsDisabled;

  const allTasks = checklist ?? [];
  const openTasks = allTasks.filter((item) => !item.done);
  const completedTasks = allTasks.length - openTasks.length;
  const guestCount = guests?.length ?? 0;
  const guestResponded = guests?.filter((guest) => guest.rsvp !== "pending").length ?? 0;
  const attendingPax =
    guests?.filter((guest) => guest.rsvp === "hadir").reduce((sum, guest) => sum + guest.pax, 0) ?? 0;
  const totalVendorCost = vendors?.reduce((sum, vendor) => sum + vendor.cost, 0) ?? 0;
  const paidVendorCost = vendors?.reduce((sum, vendor) => sum + vendorPaidAmount(vendor), 0) ?? 0;
  const vendorObligation = Math.max(0, totalVendorCost - paidVendorCost);
  const savingsTotal = budget?.savingsTotal ?? 0;
  const fundingGap = Math.max(0, vendorObligation - savingsTotal);
  const monthsRemaining = wedding
    ? Math.max(1, Math.ceil((wedding.weddingDate - bootTime) / (30.4375 * DAY_MS)))
    : 1;
  const monthlySaving = Math.ceil(fundingGap / monthsRemaining);
  const paidRatio = totalVendorCost > 0 ? paidVendorCost / totalVendorCost : 0;

  const agendaItems = [...openTasks]
    .sort((a, b) => {
      const priorityDifference =
        PRIORITY_RANK[normalizePriority(a.priority)] - PRIORITY_RANK[normalizePriority(b.priority)];
      return (
        priorityDifference ||
        (a.dueDate ?? Number.POSITIVE_INFINITY) - (b.dueDate ?? Number.POSITIVE_INFINITY) ||
        a.sortOrder - b.sortOrder
      );
    })
    .slice(0, 4);

  const toggleTask = async (itemId: (typeof openTasks)[number]["_id"]) => {
    await toggleItem({ itemId, done: true });
    bloom();
  };

  const quickActions: { to: string; label: string; hint: string; icon: Icon }[] = [
    { to: "/app/budget", label: "Catat biaya", hint: "Pengeluaran baru", icon: Wallet },
    { to: "/app/tamu", label: "Tambah tamu", hint: "Daftar undangan", icon: UserPlus },
    { to: "/app/rundown", label: "Rundown acara", hint: "Susunan hari-H", icon: CalendarDays },
    { to: "/app/moodboard", label: "Moodboard", hint: "Referensi visual", icon: Palette },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:gap-7 xl:grid-cols-12 xl:gap-8">
      <input type="file" accept="image/*" className="hidden" {...inputProps} />

      {!wedding ? (
        <Skeleton className="col-span-full h-[34rem] rounded-[32px] xl:h-[62vh]" />
      ) : (
        <section
          className={`dashboard-hero specular-edge relative isolate col-span-full flex min-h-[34rem] flex-col justify-between overflow-hidden rounded-[32px] px-5 pb-5 pt-5 sm:min-h-[38rem] sm:px-8 sm:pb-8 sm:pt-7 xl:min-h-[62vh] xl:px-12 xl:pb-10 xl:pt-9 ${
            sceneOn ? "dashboard-hero-opening" : ""
          }`}
          aria-label="Hari pernikahan"
        >
          <img
            src={couplePhoto ?? HERO_FALLBACK}
            alt=""
            aria-hidden="true"
            className={`dashboard-hero-photo absolute inset-0 -z-20 size-full object-cover ${
              sceneOn ? "dashboard-photo-opening" : ""
            }`}
            fetchPriority="high"
          />
          <div aria-hidden="true" className="dashboard-hero-scrim absolute inset-0 -z-10" />
          <div aria-hidden="true" className="dashboard-hero-batik pointer-events-none absolute inset-x-0 top-0 -z-10 h-2/3" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-sm font-medium text-white/90 sm:text-base">
              <Heart className="size-[18px] text-[var(--gold)]" weight="fill" />
              Menjelang hari pernikahan
            </p>
            <button
              type="button"
              onClick={openPicker}
              disabled={uploading}
              aria-label="Ganti foto pasangan"
              className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/60 bg-white/15 text-sm font-semibold text-white backdrop-blur-md transition-transform active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : couplePhoto ? (
                <img src={couplePhoto} alt="" className="size-full object-cover" />
              ) : (
                coupleInitials(wedding.partnerOneName, wedding.partnerTwoName)
              )}
            </button>
          </div>

          <div
            className={`relative z-10 mt-12 max-w-5xl sm:mt-16 ${
              sceneOn ? "dashboard-name-opening" : ""
            }`}
          >
            <h1 className="display-serif text-[clamp(2.75rem,8vw,7rem)] leading-[0.94] text-white">
              {wedding.partnerOneName} &amp; {wedding.partnerTwoName}
            </h1>

            <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
              <p className="ticket-chip px-3.5 py-2 text-[0.8125rem] text-white sm:text-sm">
                <CalendarDays className="size-4 shrink-0 text-[var(--gold)]" />
                <span className="num">{formatDateLongID(wedding.weddingDate)}</span>
              </p>
              {wedding.venueName && (
                <p className="ticket-chip px-3.5 py-2 text-[0.8125rem] text-white sm:text-sm">
                  <MapPin className="size-4 shrink-0 text-[var(--gold)]" />
                  <span className="truncate">{wedding.venueName}</span>
                </p>
              )}
            </div>
          </div>

          <div
            className={`relative z-10 mt-8 ${sceneOn ? "dashboard-countdown-opening" : ""}`}
          >
            <div className="w-full max-w-xl rounded-[22px] border border-white/25 bg-[rgb(16_29_21/38%)] px-4 py-4 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.28),0_18px_40px_-24px_rgb(0_0_0/0.7)] backdrop-blur-xl sm:px-6 sm:py-5">
              <p className="mb-3 text-[0.8125rem] text-white/75">Hitung mundur</p>
              <CountdownTimer weddingDate={wedding.weddingDate} />
            </div>
          </div>
        </section>
      )}

      {/* Panel status interaktif — tiga baris angka nyata, bukan kotak statistik. */}
      <section
        className="surface-card col-span-full divide-y divide-[var(--line)] overflow-hidden rounded-[28px] p-1"
        aria-label="Ringkasan persiapan"
      >
        <Link
          to="/app/budget"
          className="interactive-row group flex min-h-11 flex-col gap-2 rounded-[24px] px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] sm:px-5"
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[0.8125rem] text-[var(--ink-soft)]">Dana</p>
            <span className="flex items-center gap-1 text-[0.8125rem] text-[var(--brand)] opacity-0 transition-opacity group-hover:opacity-100">
              Buka budget <ArrowUpRight className="size-3.5" />
            </span>
          </div>
          <p className="max-w-[68ch] text-base leading-relaxed text-[var(--ink)] sm:text-lg">
            {budget === undefined || vendors === undefined ? (
              "Memuat ringkasan dana…"
            ) : totalVendorCost > 0 ? (
              <>
                Tabungan tercatat{" "}
                <strong className="num font-semibold">{formatRupiah(savingsTotal)}</strong> dari sisa
                kewajiban vendor{" "}
                <strong className="num font-semibold">{formatRupiah(vendorObligation)}</strong>.
                {fundingGap > 0 && (
                  <>
                    {" "}
                    Kurang{" "}
                    <strong className="num font-semibold">{formatRupiah(fundingGap)}</strong> — sekitar{" "}
                    <strong className="num font-semibold">{formatRupiah(monthlySaving)}</strong> per
                    bulan hingga {wedding ? formatDateID(wedding.weddingDate) : "hari pernikahan"}.
                  </>
                )}
              </>
            ) : (
              <>
                Dana pernikahan tercatat{" "}
                <strong className="num font-semibold">{formatRupiah(savingsTotal)}</strong>. Catat
                biaya vendor untuk melihat kebutuhan yang tersisa.
              </>
            )}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <MiniBar ratio={paidRatio} />
            <span className="num shrink-0 text-[0.8125rem] text-[var(--ink-soft)]">
              {formatRupiah(paidVendorCost)} dibayar
            </span>
          </div>
        </Link>

        <Link
          to="/app/checklist"
          className="interactive-row group flex min-h-11 flex-col gap-2 rounded-[24px] px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] sm:px-5"
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[0.8125rem] text-[var(--ink-soft)]">Persiapan</p>
            <span className="flex items-center gap-1 text-[0.8125rem] text-[var(--brand)] opacity-0 transition-opacity group-hover:opacity-100">
              Buka checklist <ArrowUpRight className="size-3.5" />
            </span>
          </div>
          <p className="max-w-[68ch] text-base leading-relaxed text-[var(--ink)] sm:text-lg">
            {checklist === undefined ? (
              "Memuat ringkasan tugas…"
            ) : openTasks.length === 0 ? (
              <>Semua {allTasks.length} tugas persiapan sudah selesai.</>
            ) : (
              <>
                <strong className="num font-semibold">{openTasks.length} tugas lagi</strong> dari{" "}
                {allTasks.length}; {completedTasks} sudah dicentang.
              </>
            )}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <MiniBar ratio={allTasks.length > 0 ? completedTasks / allTasks.length : 0} />
            <span className="num shrink-0 text-[0.8125rem] text-[var(--ink-soft)]">
              {allTasks.length > 0
                ? `${Math.round((completedTasks / allTasks.length) * 100)}%`
                : "belum ada"}
            </span>
          </div>
        </Link>

        <Link
          to="/app/tamu"
          className="interactive-row group flex min-h-11 flex-col gap-2 rounded-[24px] px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] sm:px-5"
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[0.8125rem] text-[var(--ink-soft)]">Tamu</p>
            <span className="flex items-center gap-1 text-[0.8125rem] text-[var(--brand)] opacity-0 transition-opacity group-hover:opacity-100">
              Buka daftar tamu <ArrowUpRight className="size-3.5" />
            </span>
          </div>
          <p className="max-w-[68ch] text-base leading-relaxed text-[var(--ink)] sm:text-lg">
            {guests === undefined ? (
              "Memuat ringkasan tamu…"
            ) : guestCount === 0 ? (
              "Belum ada tamu. Mulai dari keluarga terdekat."
            ) : (
              <>
                <strong className="num font-semibold">{guestResponded}</strong> dari {guestCount}{" "}
                undangan sudah menjawab; <strong className="num font-semibold">{attendingPax}</strong>{" "}
                orang diperkirakan hadir.
              </>
            )}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <MiniBar
              ratio={guestCount > 0 ? guestResponded / guestCount : 0}
              tone="accent"
            />
            <span className="num shrink-0 text-[0.8125rem] text-[var(--ink-soft)]">
              {guestResponded}/{guestCount}
            </span>
          </div>
        </Link>
      </section>

      {/* Bento: tugas prioritas + pintasan berdimensi. */}
      <section className="col-span-full min-w-0 xl:col-span-7" aria-labelledby="agenda-title">
        <div className="surface-card h-full p-4 sm:p-5">
          <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-3">
            <h2 id="agenda-title" className="display-serif text-2xl text-[var(--ink)] sm:text-3xl">
              Perlu dikerjakan
            </h2>
            <Link
              to="/app/checklist"
              className="flex min-h-11 shrink-0 items-center gap-1 text-[0.8125rem] font-medium text-[var(--brand)] hover:underline"
            >
              Lihat semua <ArrowUpRight className="size-4" />
            </Link>
          </div>

          {checklist === undefined ? (
            <div className="space-y-3 pt-4">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : agendaItems.length === 0 ? (
            <div className="py-7">
              <p className="text-base leading-relaxed text-[var(--ink-soft)]">
                Belum ada tugas terbuka untuk dikerjakan.
              </p>
              <button
                type="button"
                onClick={() => navigate("/app/checklist")}
                className="mt-3 min-h-11 text-sm font-semibold text-[var(--brand)] underline underline-offset-4"
              >
                Buka checklist
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {agendaItems.map((task) => {
                const priority = normalizePriority(task.priority);
                const due = deadlineLabel(task.dueDate, bootTime);
                return (
                  <li
                    key={task._id}
                    className="interactive-row flex min-h-[4.5rem] items-center gap-3 py-2"
                  >
                    <button
                      type="button"
                      aria-label={`Tandai tugas “${task.label}” selesai`}
                      onClick={() => void toggleTask(task._id)}
                      className="dashboard-check flex size-11 shrink-0 items-center justify-center text-[var(--brand)] transition-transform active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-5 place-items-center rounded-[6px] border border-[var(--line)] bg-[var(--paper)]"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-3.5"
                        >
                          <path className="dashboard-check-path" d="M4 12.5 9.5 18 20 6" />
                        </svg>
                      </span>
                    </button>
                    <span className="min-w-0 flex-1 py-1 text-sm font-medium leading-snug text-[var(--ink)] sm:text-base">
                      {task.label}
                    </span>
                    <span className="shrink-0 text-right text-[0.8125rem] leading-relaxed">
                      <span className={`block num ${due.tone}`}>{due.text}</span>
                      <span className="block text-[var(--gold)]">{PRIORITY_LABEL[priority]}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="col-span-full min-w-0 xl:col-span-5" aria-labelledby="shortcuts-title">
        <div className="surface-card h-full p-4 sm:p-5">
          <h2
            id="shortcuts-title"
            className="border-b border-[var(--line)] pb-3 display-serif text-2xl text-[var(--ink)] sm:text-3xl"
          >
            Pintasan
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-2.5">
            {quickActions.map(({ to, label, hint, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="interactive-row group flex h-full min-h-[6.5rem] flex-col justify-between rounded-2xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--paper)_72%,transparent)] p-3.5 transition-transform duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                >
                  <Icon
                    className="size-5 text-[var(--brand)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[-6deg]"
                    weight="duotone"
                  />
                  <span className="mt-3">
                    <span className="block text-sm font-semibold leading-tight text-[var(--ink)]">
                      {label}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-[0.8125rem] text-[var(--ink-soft)]">
                      {hint}
                      <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {budget !== undefined && checklist !== undefined && (
            <p className="mt-4 border-t border-[var(--line)] pt-3 text-[0.8125rem] leading-relaxed text-[var(--ink-soft)]">
              {completedTasks} tugas selesai dari {allTasks.length}; {budget.categories.length}{" "}
              kategori anggaran tersedia.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
