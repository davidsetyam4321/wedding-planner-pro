import { coupleInitials, useCouplePhotoUpload } from "@/components/CouplePhoto";
import {
  EmptyState,
  SectionHeader,
  Stagger,
  StaggerItem,
} from "@/components/Shared";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { bloom } from "@/lib/bloom";
import { waLink } from "@/lib/contact";
import {
  countdownParts,
  daysUntil,
  formatDateLongID,
  formatDateShortID,
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
  Lock,
  Mail,
  Palette,
  PartyPopper,
  Phone,
  Sparkles,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";

/** Empat tahapan persiapan, dihitung dari hari menuju pernikahan. */
const PHASES = [
  { short: "H-6 Bln", icon: CheckCircle2, focus: "Menetapkan konsep, venue, dan target dana" },
  { short: "H-3 Bln", icon: Heart, focus: "Kunci vendor utama dan susun daftar tamu" },
  { short: "H-1 Bln", icon: Lock, focus: "Finalisasi undangan, katering, dan rundown acara" },
  { short: "Hari-H", icon: PartyPopper, focus: "Cek ulang detail acara dan istirahat yang cukup" },
];

function phaseIndex(days: number): number {
  if (days > 180) return 0;
  if (days > 90) return 1;
  if (days > 30) return 2;
  return 3;
}

/** Hitung mundur detik per detik — hanya komponen ini yang re-render tiap detik. */
function CountdownTimer({ weddingDate }: { weddingDate: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = countdownParts(weddingDate, now);
  const cells = [
    { value: parts.hours, label: "Jam" },
    { value: parts.minutes, label: "Mnt" },
    { value: parts.seconds, label: "Dtk" },
  ];

  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/80 p-3.5">
      <div className="min-w-0 flex-1">
        <p className="label text-muted-foreground">Menghitung detik bahagia</p>
        <p className="mt-1 font-serif text-xl font-semibold leading-tight">
          {parts.days > 0
            ? `H-${parts.days} Hari Lagi`
            : "Hari ini hari bahagia"}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="clay-sm w-12 rounded-xl bg-card py-1.5 text-center"
          >
            <p className="num text-lg font-extrabold leading-none">
              {String(cell.value).padStart(2, "0")}
            </p>
            <p className="label mt-1 text-[9px] text-muted-foreground">
              {cell.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Kartu statistik kecil gaya VOWCRAFT: label + ikon + angka + bar progres. */
function ReadinessCard({
  label,
  icon: Icon,
  value,
  suffix,
  pct,
  tone,
}: {
  label: string;
  icon: typeof Sparkles;
  value: string;
  suffix?: string;
  pct: number;
  tone: string;
}) {
  return (
    <div className="clay p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold text-muted-foreground">{label}</p>
        <Icon className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <p className="num mt-2 text-2xl font-extrabold leading-none">
        {value}
        {suffix && (
          <span className="ml-1.5 text-xs font-bold text-muted-foreground">
            {suffix}
          </span>
        )}
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all ${tone}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}

/** Dashboard "Ringkasan" ala VOWCRAFT: hitung mundur, kesiapan, aksi cepat,
 *  tahapan pernikahan, agenda prioritas, mood board, dan kontak darurat. */
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

  const moodCategories = useQuery(api.moodboard.listCategories);
  const firstMoodCategory = moodCategories?.[0]?.name;
  const moodBoxes = useQuery(
    api.moodboard.listBoxes,
    firstMoodCategory ? { category: firstMoodCategory } : "skip",
  );

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
  const rsvpPct =
    guestTotal > 0 ? Math.round(((guestHadir + guestTidak) / guestTotal) * 100) : 0;

  const readiness =
    budget && checklist && guests
      ? Math.round((taskPct + rsvpPct + spentPct) / 3)
      : 0;
  const onSchedule = readiness >= 60;
  const readinessNote =
    readiness >= 75 ? "Mantap" : readiness >= 45 ? "Berjalan" : "Mulai";

  const agendaItems = [
    ...[...openTasks].sort(
      (a, b) =>
        PRIORITY_RANK[normalizePriority(a.priority)] -
        PRIORITY_RANK[normalizePriority(b.priority)],
    ),
    ...doneTasks,
  ].slice(0, 4);

  const moodPhotos = (moodBoxes ?? [])
    .flatMap((box) => box.photos.map((photo) => ({ ...photo, url: photo.url })))
    .filter((photo) => photo.url !== "");
  const moodTitle = moodBoxes?.[0]?.title ?? firstMoodCategory ?? "";
  const contactVendors = (vendors ?? []).slice(0, 3);

  const days = wedding ? daysUntil(wedding.weddingDate) : 0;
  const activePhase = phaseIndex(days);

  const toggleTask = async (itemId: (typeof openTasks)[number]["_id"]) => {
    await toggleItem({ itemId, done: true });
    bloom();
  };

  const reopenTask = (itemId: (typeof doneTasks)[number]["_id"]) => {
    void toggleItem({ itemId, done: false });
  };

  return (
    <div className="space-y-5">
      <input type="file" accept="image/*" className="hidden" {...inputProps} />

      {/* ── Hero: perjalanan cinta + hitung mundur detail ─────────────── */}
      {!wedding ? (
        <Skeleton className="h-56 w-full rounded-3xl" />
      ) : (
        <section className="clay grad-warm relative overflow-hidden p-5">
          <div className="flex items-start justify-between gap-3">
            <span className="chip bg-tint-sage uppercase tracking-wider text-tint-sage-foreground">
              <span className="size-1.5 rounded-full bg-tint-sage-foreground" />
              Perjalanan cinta
            </span>
            <button
              type="button"
              onClick={openPicker}
              disabled={uploading}
              aria-label="Ganti foto pasangan"
              className="size-11 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {uploading ? (
                <span className="flex size-full items-center justify-center bg-card">
                  <Loader2 className="size-4 animate-spin" />
                </span>
              ) : couplePhoto ? (
                <img
                  src={couplePhoto}
                  alt="Foto pasangan"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center bg-primary text-[11px] font-extrabold text-primary-foreground">
                  {coupleInitials(
                    wedding.partnerOneName,
                    wedding.partnerTwoName,
                  )}
                </span>
              )}
            </button>
          </div>

          <p className="mt-3 font-serif text-[1.7rem] font-semibold leading-tight">
            {`${wedding.partnerOneName} & ${wedding.partnerTwoName}`}
          </p>
          <p className="meta mt-1.5 flex items-start gap-1.5">
            <CalendarDays className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {formatDateLongID(wedding.weddingDate)}
              {wedding.venueName ? ` • ${wedding.venueName}` : ""}
            </span>
          </p>

          <CountdownTimer weddingDate={wedding.weddingDate} />
        </section>
      )}

      {/* ── Ringkasan kesiapan ────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Ringkasan kesiapan"
          action={
            <span
              className={`chip ${
                onSchedule
                  ? "bg-tint-mint text-tint-mint-foreground"
                  : "bg-tint-butter text-tint-butter-foreground"
              }`}
            >
              <TrendingUp className="size-3.5" />
              {onSchedule ? "Sesuai jadwal" : "Perlu percepatan"}
            </span>
          }
        />
        {budget === undefined || checklist === undefined || guests === undefined ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
          </div>
        ) : (
          <Stagger className="grid grid-cols-2 gap-3">
            <StaggerItem>
              <ReadinessCard
                label="Kesiapan acara"
                icon={Sparkles}
                value={`${readiness}%`}
                suffix={readinessNote}
                pct={readiness}
                tone="bg-primary"
              />
            </StaggerItem>
            <StaggerItem>
              <ReadinessCard
                label="Tugas selesai"
                icon={CheckCircle2}
                value={`${doneTasks.length} / ${allTasks.length}`}
                suffix="Tugas"
                pct={taskPct}
                tone="bg-tint-sage-foreground"
              />
            </StaggerItem>
            <StaggerItem>
              <ReadinessCard
                label="RSVP tamu"
                icon={Mail}
                value={`${guestHadir} / ${guestTotal}`}
                suffix="Hadir"
                pct={guestTotal > 0 ? Math.round((guestHadir / guestTotal) * 100) : 0}
                tone="bg-tint-sky-foreground"
              />
            </StaggerItem>
            <StaggerItem>
              <ReadinessCard
                label="Anggaran terpakai"
                icon={Wallet}
                value={`${spentPct}%`}
                suffix="Terkendali"
                pct={spentPct}
                tone="bg-tint-butter-foreground"
              />
            </StaggerItem>
          </Stagger>
        )}
      </section>

      {/* ── Aksi cepat ────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Aksi cepat" />
        <Stagger className="grid grid-cols-4 gap-2.5">
          {[
            { to: "/app/budget", label: "Catat Biaya", icon: Wallet, surface: "bg-tint-mint text-tint-mint-foreground" },
            { to: "/app/tamu", label: "Undang Tamu", icon: UserPlus, surface: "bg-tint-sky text-tint-sky-foreground" },
            { to: "/app/rundown", label: "Tambah Agenda", icon: CalendarPlus, surface: "bg-tint-sage text-tint-sage-foreground" },
            { to: "/app/moodboard", label: "Inspirasi", icon: Palette, surface: "bg-tint-rose text-tint-rose-foreground" },
          ].map((action) => (
            <StaggerItem key={action.to}>
              <Link
                to={action.to}
                className="clay clay-press flex flex-col items-center gap-2 p-3"
              >
                <span
                  className={`flex size-12 items-center justify-center rounded-full ${action.surface}`}
                >
                  <action.icon className="size-5" />
                </span>
                <span className="text-center text-[11px] font-bold leading-tight">
                  {action.label}
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── Tahapan pernikahan ────────────────────────────────────────── */}
      {wedding && (
        <section>
          <SectionHeader
            title="Tahapan pernikahan"
            action={
              <span className="meta font-semibold">
                Fase {activePhase + 1} berlangsung
              </span>
            }
          />
          <div className="clay p-4">
            <div className="flex items-start">
              {PHASES.map((phase, index) => {
                const status =
                  index < activePhase
                    ? "done"
                    : index === activePhase
                      ? "active"
                      : "upcoming";
                const Icon = phase.icon;
                return (
                  <div
                    key={phase.short}
                    className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                  >
                    <div className="flex w-full items-center">
                      <span
                        className={`h-0.5 flex-1 ${
                          index === 0
                            ? "invisible"
                            : index <= activePhase
                              ? "bg-tint-sage-foreground"
                              : "bg-border"
                        }`}
                      />
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                          status === "done"
                            ? "bg-tint-sage-foreground text-white"
                            : status === "active"
                              ? "bg-tint-butter-foreground text-white"
                              : "border border-border bg-secondary text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span
                        className={`h-0.5 flex-1 ${
                          index >= PHASES.length - 1
                            ? "invisible"
                            : index < activePhase
                              ? "bg-tint-sage-foreground"
                              : "bg-border"
                        }`}
                      />
                    </div>
                    <p className="text-[11px] font-extrabold leading-none">
                      {phase.short}
                    </p>
                    <p
                      className={`text-[10px] font-semibold leading-none ${
                        status === "active"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {index === 3
                        ? formatDateShortID(wedding.weddingDate)
                        : status === "done"
                          ? "Selesai"
                          : status === "active"
                            ? "Aktif kini"
                            : "Mendatang"}
                    </p>
                  </div>
                );
              })}
            </div>

            <Link
              to="/app/checklist"
              className="mt-4 flex items-center gap-2.5 rounded-2xl bg-tint-sage p-3 text-tint-sage-foreground"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/70">
                <CheckCircle2 className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="label block opacity-70">Fokus saat ini</span>
                <span className="mt-0.5 block text-xs font-bold leading-snug">
                  {PHASES[activePhase].focus}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Daftar agenda penting ─────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Daftar agenda penting"
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
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
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
          <ul className="space-y-2">
            {agendaItems.map((task) => {
              const priority = normalizePriority(task.priority);
              return (
                <li key={task._id} className="clay flex items-center gap-3 p-3.5">
                  <button
                    type="button"
                    aria-label={
                      task.done ? "Tandai belum selesai" : "Tandai selesai"
                    }
                    onClick={() =>
                      task.done ? reopenTask(task._id) : toggleTask(task._id)
                    }
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
                      task.done
                        ? "border-tint-sage-foreground bg-tint-sage-foreground text-white"
                        : "border-border text-transparent hover:border-primary"
                    }`}
                  >
                    <Check className="size-4" />
                  </button>
                  <span
                    className={`min-w-0 flex-1 text-sm font-semibold leading-snug ${
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

      {/* ── Konsep & mood board ───────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Konsep & mood board"
          action={
            <Link
              to="/app/moodboard"
              className="flex items-center gap-1 text-[11px] font-bold text-primary"
            >
              Detail <ArrowUpRight className="size-3" />
            </Link>
          }
        />
        {moodCategories === undefined ||
        (firstMoodCategory !== undefined && moodBoxes === undefined) ? (
          <Skeleton className="h-56 w-full rounded-3xl" />
        ) : moodPhotos.length === 0 ? (
          <EmptyState
            emoji="🎨"
            title="Belum ada inspirasi"
            description="Kumpulkan referensi dekorasi, busana, dan makeup di mood board."
            actionLabel="Buka mood board"
            onAction={() => navigate("/app/moodboard")}
          />
        ) : (
          <div className="clay overflow-hidden">
            <div className="relative aspect-[16/10] w-full">
              <img
                src={moodPhotos[0].url}
                alt={moodTitle}
                className="h-full w-full object-cover"
              />
              <div className="photo-scrim absolute inset-0" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="label text-white/70">Tema utama acara</p>
                <p className="mt-1 font-serif text-lg font-semibold text-white">
                  {moodTitle}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 p-3.5">
              <div className="flex gap-2">
                {moodPhotos.slice(1, 5).map((photo, index) => (
                  <img
                    key={`${photo.url}-${index}`}
                    src={photo.url}
                    alt=""
                    className="clay-sm size-11 rounded-xl object-cover"
                  />
                ))}
              </div>
              <p className="meta shrink-0">{moodPhotos.length} foto tersimpan</p>
            </div>
          </div>
        )}
      </section>

      {/* ── Kontak darurat & tim inti ─────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Kontak darurat & tim inti"
          action={
            <Link
              to="/app/vendor"
              className="flex items-center gap-1 text-[11px] font-bold text-primary"
            >
              Semua vendor <ArrowUpRight className="size-3" />
            </Link>
          }
        />
        {vendors === undefined ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : contactVendors.length === 0 ? (
          <EmptyState
            emoji="📞"
            title="Belum ada kontak vendor"
            description="Tambahkan vendor beserta nomor kontaknya agar mudah dihubungi."
            actionLabel="Tambah vendor"
            onAction={() => navigate("/app/vendor")}
          />
        ) : (
          <ul className="space-y-2">
            {contactVendors.map((vendor) => {
              const wa = vendor.contact ? waLink(vendor.contact) : null;
              return (
                <li key={vendor._id} className="clay flex items-center gap-3 p-3.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tint-butter text-sm font-extrabold text-tint-butter-foreground">
                    {vendor.name.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {vendor.name}
                    </span>
                    <span className="meta block truncate">{vendor.category}</span>
                  </span>
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Hubungi ${vendor.name}`}
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tint-mint text-tint-mint-foreground transition hover:opacity-80"
                    >
                      <Phone className="size-4" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
