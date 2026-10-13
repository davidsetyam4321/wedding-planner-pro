import { coupleInitials, useCouplePhotoUpload } from "@/components/CouplePhoto";
import {
  EmptyState,
  SectionHeader,
  Stagger,
  StaggerItem,
} from "@/components/Shared";
import { Skeleton } from "@/components/ui/skeleton";
import AnimatedContent from "@/components/AnimatedContent";
import CountUp from "@/components/CountUp";
import { SekarSudut } from "@/components/Decor";
import { api } from "@/convex/_generated/api";
import { bloom } from "@/lib/bloom";
import {
  countdownParts,
  formatDateLongID,
  formatRupiahShort,
} from "@/lib/format";
import {
  PRIORITY_BADGE,
  PRIORITY_LABEL,
  PRIORITY_RANK,
  normalizePriority,
} from "@/lib/priority";
import {
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronRight,
  Heart,
  Loader2,
  Mail,
  MapPin,
  Palette,
  UserPlus,
  Wallet,
} from "@/lib/icons";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";

/** Hitung mundur detik per detik — hanya komponen ini yang re-render tiap detik. */
function CountdownTimer({ weddingDate }: { weddingDate: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = countdownParts(weddingDate, now);
  const cells = [
    { value: parts.days, label: "Hari", gold: false },
    { value: parts.hours, label: "Jam", gold: false },
    { value: parts.minutes, label: "Menit", gold: false },
    { value: parts.seconds, label: "Detik", gold: true },
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5 text-center sm:gap-2 lg:gap-3">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="flex flex-col items-center rounded-xl bg-white/15 py-1.5 shadow-sm backdrop-blur-md sm:rounded-2xl sm:py-2.5 lg:py-3"
        >
          <p key={cell.value} className="countdown-digit num font-serif text-lg font-semibold leading-tight text-white sm:text-[1.35rem] lg:text-2xl">
            {String(cell.value).padStart(2, "0")}
          </p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-white sm:text-[11px] lg:text-xs">
            {cell.label}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Kartu ringkasan sederhana, tiap angka langsung menuju fitur terkait. */
function SummaryCard({
  to,
  label,
  value,
  numericValue,
  detail,
  pct,
  icon: Icon,
  tone,
}: {
  to: string;
  label: string;
  value: string;
  numericValue?: number;
  detail: string;
  pct: number;
  icon: typeof CheckCircle2;
  tone: "nature" | "secondary" | "soft";
}) {
  const progress = Math.min(100, Math.max(0, pct));
  const toneStyles = {
    nature: { icon: "text-leaf", progress: "fill-botanical" },
    secondary: { icon: "text-gold-deep", progress: "fill-secondary" },
    soft: { icon: "text-soft-deep", progress: "fill-soft" },
  }[tone];

  return (
    <Link
      to={to}
      className="clay clay-press group block rounded-xl p-3 transition-transform hover:-translate-y-0.5 sm:rounded-2xl sm:p-4"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-muted-foreground">{label}</span>
        <Icon className={`size-4 shrink-0 ${toneStyles.icon}`} />
      </span>
      <span className="mt-1.5 block truncate font-serif text-lg font-semibold leading-tight sm:mt-2 sm:text-xl lg:text-2xl">
        {numericValue === undefined ? value : <CountUp to={numericValue} duration={0.5} />}
      </span>
      <span className="mt-1 block text-[11px] leading-snug text-muted-foreground sm:text-xs sm:leading-relaxed lg:text-[13px]">
        {detail}
      </span>
      <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-mist-gray">
        <span
          className={`${toneStyles.progress} block h-full rounded-full transition-all duration-700`}
          style={{ width: `${progress}%` }}
        />
      </span>
    </Link>
  );
}

/** Dashboard ringkas berbentuk bento: countdown, ringkasan, aksi cepat, agenda. */
export function HomePage() {
  const navigate = useNavigate();
  const wedding = useQuery(api.wedding.get);
  const budget = useQuery(api.budget.overview);
  const checklist = useQuery(api.checklist.list);
  const guests = useQuery(api.guests.list);
  const toggleItem = useMutation(api.checklist.toggle);
  const couplePhoto = useQuery(api.wedding.getCouplePhoto);
  const { uploading, openPicker, inputProps } = useCouplePhotoUpload();
  const workspace = useQuery(api.workspace.status);

  const spent =
    budget?.expenses.reduce((sum, expense) => sum + expense.amount, 0) ?? 0;
  const allocated =
    budget?.categories.reduce((sum, category) => sum + category.allocated, 0) ?? 0;
  const spentPct =
    allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;

  const allTasks = checklist ?? [];
  const openTasks = allTasks.filter((item) => !item.done);
  const doneTasks = allTasks.filter((item) => item.done);
  const taskPct =
    allTasks.length > 0 ? Math.round((doneTasks.length / allTasks.length) * 100) : 0;

  const guestTotal = guests?.length ?? 0;
  const guestHadir = guests?.filter((g) => g.rsvp === "hadir").length ?? 0;
  const guestTidak = guests?.filter((g) => g.rsvp === "tidak").length ?? 0;
  const unansweredGuests = Math.max(0, guestTotal - guestHadir - guestTidak);
  const rsvpPct =
    guestTotal > 0 ? Math.round(((guestHadir + guestTidak) / guestTotal) * 100) : 0;
  const remainingBudget = Math.max(0, allocated - spent);

  const agendaItems = [...openTasks]
    .sort(
      (a, b) =>
        PRIORITY_RANK[normalizePriority(a.priority)] -
          PRIORITY_RANK[normalizePriority(b.priority)] ||
        (a.dueDate ?? Number.POSITIVE_INFINITY) -
          (b.dueDate ?? Number.POSITIVE_INFINITY) ||
        a.sortOrder - b.sortOrder,
    )
    .slice(0, 4);

  const toggleTask = async (itemId: (typeof openTasks)[number]["_id"]) => {
    await toggleItem({ itemId, done: true });
    bloom();
  };

  return (
    <div className="grid grid-cols-2 items-start gap-2.5 sm:gap-4 lg:grid-cols-4 lg:gap-5 xl:grid-cols-12 xl:gap-6">
      <input type="file" accept="image/*" className="hidden" {...inputProps} />

      {/* ── Pill sinkronisasi ────────────────────────────────── */}
      {wedding && (
        <div className="col-span-2 flex items-center justify-between rounded-full border border-atmosphere-blue/30 bg-white/60 px-3 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur-md lg:col-span-4 lg:px-4 lg:py-2 xl:col-span-12">
          <span className="flex items-center gap-1.5">
            <span className="size-2 animate-pulse rounded-full bg-atmosphere-blue" />
            Sinkronisasi otomatis
          </span>
          <span className="text-tint-sky-foreground">
            {workspace?.connectedEmail
              ? `Tersinkron dengan ${workspace.connectedEmail}`
              : workspace?.isAnonymous
                ? "Ruang kerja lokal"
                : workspace?.inviteCode
                  ? `Kode undangan ${workspace.inviteCode}`
                  : "Belum ada kode undangan"}
          </span>
        </div>
      )}

      {/* ── Hero: menuju janji suci + hitung mundur ────────── */}
      {!wedding ? (
        <Skeleton className="col-span-2 h-52 w-full rounded-3xl lg:col-span-2 xl:col-span-5 xl:h-64" />
      ) : (
        <AnimatedContent
          distance={50}
          threshold={0.05}
          className="sky-band relative col-span-2 overflow-hidden rounded-2xl p-3 shadow-float sm:rounded-3xl sm:p-5 lg:col-span-2 lg:p-6 xl:col-span-5 xl:p-7"
        >
          {/* Selalu ada lukisan langit di belakang; foto pasangan menimpa jika diunggah */}
          {!couplePhoto && (
            <div className="absolute inset-0 bg-gradient-to-br from-midnight-navy/90 via-leaf-deep/80 to-brick-accent/80" />
          )}
          {couplePhoto && (
            <>
              {/* Latar = foto pasangan yang diunggah; overlay navy menjaga teks tetap terbaca. */}
              <img
                src={couplePhoto}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-midnight-navy/90 via-leaf-deep/80 to-brick-accent/85" />
            </>
          )}
          <div className="pointer-events-none absolute -right-10 -top-14 size-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 size-40 rounded-full bg-atmosphere-blue/25 blur-2xl" />
          <SekarSudut className="pointer-events-none absolute right-4 top-4 size-7" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="eyebrow text-gold">
                <Heart className="size-3.5" />
                Menuju Janji Suci
              </span>
            </div>
            <button
              type="button"
              onClick={openPicker}
              disabled={uploading}
              aria-label="Ganti foto pasangan"
              className="size-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white/40 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {uploading ? (
                <span className="flex size-full items-center justify-center bg-card">
                  <Loader2 className="size-4 animate-spin" />
                </span>
              ) : (
                <span className="flex size-full items-center justify-center bg-tint-sage text-[11px] font-extrabold text-tint-sage-foreground">
                  {coupleInitials(
                    wedding.partnerOneName,
                    wedding.partnerTwoName,
                  )}
                </span>
              )}
            </button>
          </div>

          {/* Nama pasangan sebagai tanda tangan script — titik personal ala undangan. */}
          <p className="signature relative z-10 mt-1 text-[1.75rem] leading-tight text-white sm:text-[2.15rem] lg:text-4xl xl:text-[2.75rem]">
            {`${wedding.partnerOneName} & ${wedding.partnerTwoName}`}
          </p>

          <div className="relative z-10 mt-2 max-w-sm sm:mt-3 xl:max-w-lg">
            <CountdownTimer weddingDate={wedding.weddingDate} />
          </div>

          <div className="relative z-10 mt-2 space-y-1 text-[11px] text-white sm:mt-3 sm:text-[12px]">
            <p className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0 text-white" />
              <span className="font-semibold text-white">
                {formatDateLongID(wedding.weddingDate)}
              </span>
            </p>
            {wedding.venueName && (
              <p className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-white" />
                <span>{wedding.venueName}</span>
              </p>
            )}
          </div>

        </AnimatedContent>
      )}


      {/* ── Ringkasan persiapan ───────────────────────────────────────── */}
      <section className="col-span-2 lg:col-span-2 xl:col-span-7">
        <SectionHeader title="Ringkasan" />
        {budget === undefined || checklist === undefined || guests === undefined ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="col-span-2 h-24 rounded-2xl sm:col-span-1" />
          </div>
        ) : (
          <Stagger className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
            <StaggerItem>
              <SummaryCard
                to="/app/checklist"
                label="Tugas tersisa"
                value={`${openTasks.length}`}
                numericValue={openTasks.length}
                detail={allTasks.length > 0 ? `${doneTasks.length} dari ${allTasks.length} tugas selesai` : "Belum ada tugas persiapan"}
                pct={taskPct}
                icon={CheckCircle2}
                tone="nature"
              />
            </StaggerItem>
            <StaggerItem>
              <SummaryCard
                to="/app/tamu"
                label="RSVP belum dijawab"
                value={`${unansweredGuests}`}
                numericValue={unansweredGuests}
                detail={guestTotal > 0 ? `${guestHadir} hadir · ${guestTidak} tidak hadir` : "Belum ada tamu di daftar"}
                pct={rsvpPct}
                icon={Mail}
                tone="secondary"
              />
            </StaggerItem>
            <StaggerItem className="col-span-2 sm:col-span-1">
              <SummaryCard
                to="/app/budget"
                label="Sisa anggaran"
                value={formatRupiahShort(remainingBudget)}
                detail={allocated > 0 ? `${formatRupiahShort(spent)} terpakai dari ${formatRupiahShort(allocated)}` : "Atur anggaran pernikahan Anda"}
                pct={allocated > 0 ? spentPct : 0}
                icon={Wallet}
                tone="soft"
              />
            </StaggerItem>
          </Stagger>
        )}
      </section>

      {/* ── Aksi cepat — grid 2×2, selalu terlihat tanpa scroll ────── */}
      <section className="clay col-span-2 space-y-2 p-3 sm:space-y-2.5 sm:p-4 lg:col-span-2 lg:p-5 xl:col-span-5 xl:p-6">
        <SectionHeader title="Aksi cepat" />
        <Stagger className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {[
            { to: "/app/budget", label: "Catat Biaya", icon: Wallet, surface: "bg-tint-butter text-tint-butter-foreground" },
            { to: "/app/tamu", label: "Tambah Tamu", icon: UserPlus, surface: "bg-tint-rose text-tint-rose-foreground" },
            { to: "/app/rundown", label: "Rundown Acara", icon: CalendarPlus, surface: "bg-tint-sage text-tint-sage-foreground" },
            { to: "/app/moodboard", label: "Moodboard", icon: Palette, surface: "bg-tint-lavender text-tint-lavender-foreground" },
          ].map((action) => (
            <StaggerItem key={action.to}>
              <Link
                to={action.to}
                className="clay-inset clay-press group flex min-h-12 items-center gap-1.5 rounded-xl p-2 sm:min-h-14 sm:gap-2 sm:rounded-2xl sm:p-2.5"
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${action.surface} transition-transform duration-200 group-hover:scale-110 sm:size-9 sm:rounded-xl`}
                >
                  <action.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-xs font-bold leading-tight sm:text-[13px]">
                  {action.label}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── Agenda penting ────────────────────────────────────────────── */}
      <section className="clay col-span-2 space-y-2 p-3 sm:space-y-2.5 sm:p-4 lg:col-span-2 lg:p-5 xl:col-span-5 xl:p-6">
        <SectionHeader
          title="Agenda berikutnya"
          action={
            <Link
              to="/app/checklist"
              className="flex items-center gap-1 text-[11px] font-bold text-primary"
            >
              Lihat semua ({allTasks.length})
              <ArrowUpRight className="size-3" />
            </Link>
          }
        />
        {checklist === undefined ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        ) : agendaItems.length === 0 ? (
          <EmptyState
            emoji="📝"
            title="Belum ada tugas"
            description="Susun daftar tugas persiapan pernikahan Anda."
            actionLabel="Buat tugas"
            onAction={() => navigate("/app/checklist")}
          />
        ) : (
          <ul className="space-y-1.5">
            {agendaItems.slice(0, 3).map((task, index) => {
              const priority = normalizePriority(task.priority);
              return (
                <li
                  key={task._id}
                  className="clay-inset list-enter flex items-center gap-2 rounded-xl p-2 sm:gap-2.5 sm:p-2.5"
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <button
                    type="button"
                    aria-label={`Tandai tugas “${task.label}” selesai`}
                    onClick={() => toggleTask(task._id)}
                    className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      task.done
                        ? "border-tint-sage-foreground bg-tint-sage-foreground text-white"
                        : "border-border text-transparent hover:border-primary"
                    }`}
                  >
                    <Check className="size-4" />
                  </button>
                  <span
                    className={`min-w-0 flex-1 text-xs font-semibold leading-snug sm:text-sm ${
                      task.done ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {task.label}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                      task.done
                        ? "bg-tint-mint text-tint-mint-foreground"
                        : PRIORITY_BADGE[priority]
                    }`}
                  >
                    {task.done ? "Selesai" : PRIORITY_LABEL[priority]}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
