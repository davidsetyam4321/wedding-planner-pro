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
  Check,
  ChevronRight,
  Heart,
  Loader2,
  MapPin,
  Palette,
  UserPlus,
  Wallet,
} from "@/lib/icons";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";

const HERO_FALLBACK = "/assets/upacara-jawa.jpg";

/** Countdown pauses while the document is hidden; the live region only reports days. */
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
  const cells = [
    { value: parts.days, label: "Hari" },
    { value: parts.hours, label: "Jam" },
    { value: parts.minutes, label: "Menit" },
    { value: parts.seconds, label: "Detik" },
  ];

  return (
    <div className="max-w-2xl" role="timer" aria-label={`Hitung mundur menuju hari pernikahan: ${parts.days} hari, ${parts.hours} jam, ${parts.minutes} menit, ${parts.seconds} detik`}>
      <span className="sr-only" aria-live="polite">{parts.days} hari menuju hari pernikahan</span>
      <div aria-hidden="true" className="grid grid-cols-4 gap-2 sm:gap-4">
        {cells.map(({ value, label }) => (
          <div key={label} className="min-w-0 border-t border-white/40 pt-2 sm:pt-3">
            <span key={value} className="dashboard-odometer num block font-serif text-2xl leading-none text-white sm:text-4xl lg:text-5xl">
              {String(value).padStart(2, "0")}
            </span>
            <span className="mt-2 block text-xs font-medium text-white/90 sm:text-sm">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function deadlineLabel(dueDate?: number) {
  return dueDate ? `Tenggat ${formatDateID(dueDate)}` : "Tanpa tenggat";
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
  const [openingScene, setOpeningScene] = useState(false);

  useEffect(() => {
    const storageKey = "satujanji.dashboard-scene";
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, "seen");
      setOpeningScene(true);
      const timeout = window.setTimeout(() => setOpeningScene(false), 1100);
      return () => window.clearTimeout(timeout);
    } catch {
      // Dashboard remains usable when session storage is unavailable.
    }
  }, []);

  const allTasks = checklist ?? [];
  const openTasks = allTasks.filter((item) => !item.done);
  const completedTasks = allTasks.length - openTasks.length;
  const guestCount = guests?.length ?? 0;
  const guestResponded = guests?.filter((guest) => guest.rsvp !== "pending").length ?? 0;
  const totalVendorCost = vendors?.reduce((sum, vendor) => sum + vendor.cost, 0) ?? 0;
  const paidVendorCost = vendors?.reduce((sum, vendor) => sum + vendorPaidAmount(vendor), 0) ?? 0;
  const vendorObligation = Math.max(0, totalVendorCost - paidVendorCost);
  const savingsTotal = budget?.savingsTotal ?? 0;
  const fundingGap = Math.max(0, vendorObligation - savingsTotal);
  const monthsRemaining = wedding
    ? Math.max(1, Math.ceil((wedding.weddingDate - Date.now()) / (30.4375 * 24 * 60 * 60 * 1000)))
    : 1;
  const monthlySaving = Math.ceil(fundingGap / monthsRemaining);

  const agendaItems = [...openTasks]
    .sort((a, b) => {
      const priorityDifference = PRIORITY_RANK[normalizePriority(a.priority)] - PRIORITY_RANK[normalizePriority(b.priority)];
      return priorityDifference || (a.dueDate ?? Number.POSITIVE_INFINITY) - (b.dueDate ?? Number.POSITIVE_INFINITY) || a.sortOrder - b.sortOrder;
    })
    .slice(0, 4);

  const toggleTask = async (itemId: (typeof openTasks)[number]["_id"]) => {
    await toggleItem({ itemId, done: true });
    bloom();
  };

  const quickActions = [
    { to: "/app/budget", label: "Catat biaya", icon: Wallet },
    { to: "/app/tamu", label: "Tambah tamu", icon: UserPlus },
    { to: "/app/rundown", label: "Rundown acara", icon: CalendarDays },
    { to: "/app/moodboard", label: "Moodboard", icon: Palette },
  ];

  return (
    <div className="grid grid-cols-1 items-stretch gap-5 sm:gap-7 xl:grid-cols-12 xl:gap-8">
      <input type="file" accept="image/*" className="hidden" {...inputProps} />

      {!wedding ? (
        <Skeleton className="col-span-full min-h-[28rem] rounded-[2rem] xl:min-h-[60vh]" />
      ) : (
        <section className={`dashboard-hero kawung-edge relative isolate col-span-full flex min-h-[30rem] flex-col justify-between overflow-hidden rounded-[2rem] px-5 pb-6 pt-5 sm:min-h-[34rem] sm:px-8 sm:pb-9 sm:pt-8 xl:min-h-[60vh] xl:px-12 xl:pb-12 xl:pt-10 ${openingScene ? "dashboard-hero-opening" : ""}`} aria-label="Hari pernikahan">
          <img
            src={couplePhoto ?? HERO_FALLBACK}
            alt=""
            aria-hidden="true"
            className={`dashboard-hero-photo absolute inset-0 -z-20 size-full object-cover ${openingScene ? "dashboard-photo-opening" : ""}`}
          />
          <div aria-hidden="true" className="dashboard-hero-scrim absolute inset-0 -z-10" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-sm font-medium text-white sm:text-base">
              <Heart className="size-[18px]" weight="fill" />
              Menjelang hari pernikahan
            </p>
            <button
              type="button"
              onClick={openPicker}
              disabled={uploading}
              aria-label="Ganti foto pasangan"
              className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white/15 text-sm font-semibold text-white transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-70"
            >
              {uploading ? <Loader2 className="size-5 animate-spin" /> : couplePhoto ? <img src={couplePhoto} alt="" className="size-full object-cover" /> : coupleInitials(wedding.partnerOneName, wedding.partnerTwoName)}
            </button>
          </div>

          <div className={`relative z-10 mt-16 max-w-5xl sm:mt-20 ${openingScene ? "dashboard-name-opening" : ""}`}>
            <p className="dashboard-couple-name font-serif text-[clamp(3.5rem,9vw,8rem)] leading-[0.94] text-white">
              {wedding.partnerOneName} <span aria-hidden="true">&amp;</span><br className="hidden sm:block" /> {wedding.partnerTwoName}
            </p>
            <div className={`mt-8 sm:mt-10 ${openingScene ? "dashboard-countdown-opening" : ""}`}>
              <CountdownTimer weddingDate={wedding.weddingDate} />
            </div>
          </div>

          <div className="relative z-10 mt-10 flex flex-col gap-2 text-sm text-white sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-7 sm:text-base">
            <p className="flex items-center gap-2"><CalendarDays className="size-[18px] shrink-0" /><span>{formatDateLongID(wedding.weddingDate)}</span></p>
            {wedding.venueName && <p className="flex items-center gap-2"><MapPin className="size-[18px] shrink-0" /><span>{wedding.venueName}</span></p>}
          </div>
        </section>
      )}

      <section className="col-span-full grid grid-cols-1 gap-5 border-y border-[var(--line)] py-5 sm:grid-cols-2 sm:gap-8 sm:py-6" aria-label="Ringkasan persiapan">
        <Link to="/app/budget" className="group min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]">
          <p className="text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">
            {budget === undefined || vendors === undefined ? "Memuat ringkasan dana…" : totalVendorCost > 0
              ? <>Tabungan tercatat <strong className="num font-semibold text-[var(--ink)]">{formatRupiah(savingsTotal)}</strong>; sisa kewajiban vendor <strong className="num font-semibold text-[var(--ink)]">{formatRupiah(vendorObligation)}</strong>{fundingGap > 0 ? <> — perlu sekitar <strong className="num font-semibold text-[var(--ink)]">{formatRupiah(monthlySaving)}</strong> per bulan hingga {wedding ? formatDateID(wedding.weddingDate) : "hari pernikahan"}.</> : "."}</>
              : <>Dana pernikahan tercatat <strong className="num font-semibold text-[var(--ink)]">{formatRupiah(savingsTotal)}</strong>. Catat biaya vendor untuk melihat kebutuhan yang masih tersisa.</>}
          </p>
          <span className="sr-only">Buka Budget</span>
        </Link>
        <Link to="/app/checklist" className="group min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]">
          <p className="text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">
            {checklist === undefined || guests === undefined ? "Memuat ringkasan acara…" : <>{openTasks === 0 ? "Semua tugas persiapan sudah selesai" : <><strong className="num font-semibold text-[var(--ink)]">{openTasks} tugas lagi</strong> dari {allTasks.length}</>}; <strong className="num font-semibold text-[var(--ink)]">{guestResponded}</strong> dari {guestCount} undangan sudah menjawab RSVP.</>}
          </p>
          <span className="sr-only">Buka Checklist</span>
        </Link>
      </section>

      <section className="col-span-full grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-10 xl:col-span-6" aria-labelledby="agenda-title">
        <div>
          <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-3">
            <h2 id="agenda-title" className="font-serif text-2xl text-[var(--ink)] sm:text-3xl">Perlu dikerjakan</h2>
            <Link to="/app/checklist" className="flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-[var(--brand)] hover:underline">Lihat semua <ArrowUpRight className="size-4" /></Link>
          </div>
          {checklist === undefined ? (
            <div className="space-y-3 pt-4"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
          ) : agendaItems.length === 0 ? (
            <div className="py-7">
              <p className="text-base leading-relaxed text-[var(--ink-soft)]">Belum ada tugas terbuka untuk dikerjakan.</p>
              <button type="button" onClick={() => navigate("/app/checklist")} className="mt-3 min-h-11 text-sm font-semibold text-[var(--brand)] underline underline-offset-4">Buka checklist</button>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {agendaItems.map((task) => {
                const priority = normalizePriority(task.priority);
                return (
                  <li key={task._id} className="flex min-h-[4.5rem] items-center gap-3 py-2">
                    <button type="button" aria-label={`Tandai tugas “${task.label}” selesai`} onClick={() => void toggleTask(task._id)} className="flex size-11 shrink-0 items-center justify-center rounded-md text-[var(--brand)] transition-colors hover:bg-[var(--paper-sunk)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]">
                      <span aria-hidden="true" className="flex size-5 items-center justify-center rounded border border-[var(--line)]"><Check className="size-4 opacity-0" /></span>
                    </button>
                    <span className="min-w-0 flex-1 py-1 text-sm font-medium leading-snug text-[var(--ink)] sm:text-base">{task.label}</span>
                    <span className="max-w-32 shrink-0 text-right text-xs leading-relaxed text-[var(--ink-soft)] sm:max-w-40 sm:text-sm">{deadlineLabel(task.dueDate)}<br /><span className="text-[var(--accent)]">{PRIORITY_LABEL[priority]}</span></span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="col-span-full border-t border-[var(--line)] pt-5 md:col-span-2 md:border-t-0 md:pt-0 xl:col-span-6" aria-labelledby="shortcuts-title">
        <h2 id="shortcuts-title" className="border-b border-[var(--line)] pb-3 font-serif text-2xl text-[var(--ink)] sm:text-3xl">Pintasan</h2>
        <ul className="divide-y divide-[var(--line)]">
          {quickActions.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link to={to} className="group flex min-h-14 items-center gap-4 py-2 text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]">
                <Icon className="size-5 shrink-0 text-[var(--brand)]" />
                <span className="flex-1 text-base">{label}</span>
                <ChevronRight className="size-5 shrink-0 text-[var(--ink-soft)] transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
        {budget !== undefined && checklist !== undefined && (
          <div className="mt-8 border-t border-double border-[var(--line)] pt-4 text-sm text-[var(--ink-soft)]">
            <p>{completedTasks} tugas selesai dari {allTasks.length}; {budget.categories.length} kategori anggaran tersedia.</p>
          </div>
        )}
      </section>
    </div>
  );
}
