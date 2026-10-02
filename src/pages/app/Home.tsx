import { coupleInitials, useCouplePhotoUpload } from "@/components/CouplePhoto";
import { FlowerMark } from "@/components/Decor";
import { EmptyState, Stagger, StaggerItem } from "@/components/Shared";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { FEATURES } from "@/lib/features";
import { bloom } from "@/lib/bloom";
import {
  formatDateID,
  formatRupiah,
  formatRupiahShort,
} from "@/lib/format";
import {
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";

/** Dashboard: ringkasan acara, akses cepat ke seluruh modul, dan progres persiapan. */
export function HomePage() {
  const navigate = useNavigate();
  const wedding = useQuery(api.wedding.get);
  const savings = useQuery(api.savings.list);
  const budget = useQuery(api.budget.overview);
  const checklist = useQuery(api.checklist.list);
  const guests = useQuery(api.guests.list);
  const vendors = useQuery(api.vendors.list);
  const toggleItem = useMutation(api.checklist.toggle);
  const couplePhoto = useQuery(api.wedding.getCouplePhoto);
  const { uploading, openPicker, inputProps } = useCouplePhotoUpload();

  const savingsTotal = savings?.reduce((sum, d) => sum + d.amount, 0) ?? 0;
  const fundTarget = wedding?.fundTarget ?? 0;
  const fundPct =
    fundTarget > 0 ? Math.min(100, Math.round((savingsTotal / fundTarget) * 100)) : 0;

  const spent = budget?.expenses.reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const allocated = budget?.categories.reduce((sum, c) => sum + c.allocated, 0) ?? 0;
  const spentPct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;

  const openTasks = (checklist ?? []).filter((item) => !item.done);
  const doneCount = (checklist ?? []).length - openTasks.length;
  const taskPct =
    (checklist ?? []).length > 0
      ? Math.round((doneCount / (checklist ?? []).length) * 100)
      : 0;

  const guestTotal = guests?.length ?? 0;
  const guestHadir = guests?.filter((g) => g.rsvp === "hadir").length ?? 0;
  const guestPending = guests?.filter((g) => g.rsvp === "pending").length ?? 0;
  const guestTidak = guestTotal - guestHadir - guestPending;

  const vendorTotal = vendors?.length ?? 0;
  const vendorLunas = vendors?.filter((v) => v.status === "lunas").length ?? 0;
  const vendorDp = vendors?.filter((v) => v.status === "dp").length ?? 0;

  const completeTask = async (itemId: (typeof openTasks)[number]["_id"]) => {
    await toggleItem({ itemId, done: true });
    bloom();
  };

  return (
    <div className="space-y-4">
      <input type="file" accept="image/*" className="hidden" {...inputProps} />

      {!wedding ? (
        <Skeleton className="h-[26rem] w-full rounded-3xl" />
      ) : (
        <section className="clay relative overflow-hidden">
          <div className="relative aspect-[4/3] w-full">
            {couplePhoto ? (
              <img
                src={couplePhoto}
                alt="Foto pasangan"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grad-warm flex h-full w-full flex-col items-center justify-center gap-1.5">
                <FlowerMark className="float-slow size-9 text-primary/25" />
                <p className="font-serif text-2xl font-semibold text-primary/60">
                  {coupleInitials(wedding.partnerOneName, wedding.partnerTwoName)}
                </p>
                <p className="label text-muted-foreground">Foto pasangan</p>
              </div>
            )}

            <div className="photo-scrim absolute inset-0" />

            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="label text-white/70">Menuju hari pernikahan</p>
              <h1 className="h-page mt-1.5 text-white">
                {`${wedding.partnerOneName} & ${wedding.partnerTwoName}`}
              </h1>
              <p className="meta mt-1 text-white/85">
                {formatDateID(wedding.weddingDate)}
                {wedding.venueName ? ` · ${wedding.venueName}` : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={openPicker}
              disabled={uploading}
              className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-bold text-foreground shadow-sm backdrop-blur transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Camera className="size-3.5" />
              )}
              {couplePhoto ? "Ganti foto" : "Tambah foto"}
            </button>
          </div>
        </section>
      )}

      {budget === undefined || savings === undefined || checklist === undefined ? (
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : (
        <section className="grid grid-cols-3 gap-3">
          <Link
            to="/app/budget"
            className="clay clay-press grad-mint p-3 text-tint-mint-foreground"
          >
            <p className="label opacity-80">Budget</p>
            <p className="num mt-1 text-sm font-extrabold">{formatRupiahShort(spent)}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/60">
              <div className="h-full rounded-full bg-tint-mint-foreground/70" style={{ width: `${spentPct}%` }} />
            </div>
          </Link>
          <Link
            to="/app/tabungan"
            className="clay clay-press grad-lavender p-3 text-tint-lavender-foreground"
          >
            <p className="label opacity-80">Tabungan</p>
            <p className="num mt-1 text-sm font-extrabold">
              {formatRupiahShort(savingsTotal)}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/60">
              <div className="h-full rounded-full bg-tint-lavender-foreground/70" style={{ width: `${fundPct}%` }} />
            </div>
          </Link>
          <Link
            to="/app/checklist"
            className="clay clay-press grad-peach p-3 text-tint-peach-foreground"
          >
            <p className="label opacity-80">Checklist</p>
            <p className="num mt-1 text-sm font-extrabold">{doneCount} selesai</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/60">
              <div className="h-full rounded-full bg-tint-peach-foreground/70" style={{ width: `${taskPct}%` }} />
            </div>
          </Link>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-end justify-between">
          <h2 className="h-card">Akses cepat</h2>
          <span className="meta">8 modul utama</span>
        </div>
        <Stagger className="grid grid-cols-4 gap-2.5">
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.to}>
              <Link
                to={feature.to}
                className={`clay clay-press flex flex-col items-center gap-1.5 px-1.5 py-3 ${feature.surface}`}
              >
                <feature.icon className="size-5" />
                <span className="block text-center text-[10px] font-bold leading-tight">
                  {feature.label}
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section>
        <div className="mb-2 flex items-end justify-between">
          <h2 className="h-card">Tamu & Vendor</h2>
          <span className="meta">respons & pembayaran</span>
        </div>
        {guests === undefined || vendors === undefined ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/app/tamu"
              className="clay clay-press grad-sky p-4 text-tint-sky-foreground"
            >
              <div className="flex items-center justify-between">
                <p className="label opacity-80">Daftar tamu</p>
                <span className="text-base">💌</span>
              </div>
              <p className="num mt-1.5 text-2xl font-extrabold">{guestTotal}</p>
              <p className="mt-1 text-[11px] leading-snug opacity-80">
                {guestTotal === 0
                  ? "Belum ada tamu — tambahkan sekarang."
                  : `${guestHadir} hadir · ${guestPending} menunggu · ${guestTidak} tidak hadir`}
              </p>
            </Link>
            <Link
              to="/app/vendor"
              className="clay clay-press grad-butter p-4 text-tint-butter-foreground"
            >
              <div className="flex items-center justify-between">
                <p className="label opacity-80">Vendor</p>
                <span className="text-base">📋</span>
              </div>
              <p className="num mt-1.5 text-2xl font-extrabold">{vendorTotal}</p>
              <p className="mt-1 text-[11px] leading-snug opacity-80">
                {vendorTotal === 0
                  ? "Belum ada vendor — tambahkan sekarang."
                  : `${vendorLunas} lunas · ${vendorDp} DP · ${vendorTotal - vendorLunas - vendorDp} belum bayar`}
              </p>
            </Link>
          </div>
        )}
      </section>

      <section className="clay p-5">
        <div className="flex items-center justify-between">
          <h2 className="h-card">Agenda terkini</h2>
          <Link
            to="/app/checklist"
            className="flex items-center gap-1 text-[11px] font-bold text-primary"
          >
            Lihat semua <ArrowUpRight className="size-3" />
          </Link>
        </div>

        {checklist === undefined ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-10 w-full rounded-2xl" />
          </div>
        ) : checklist.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              emoji="📝"
              title="Belum ada tugas"
              description="Susun daftar tugas persiapan pernikahan Anda."
              actionLabel="Buat tugas"
              onAction={() => navigate("/app/checklist")}
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {openTasks.slice(0, 3).map((task) => (
              <li key={task._id} className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Tandai selesai"
                  onClick={() => completeTask(task._id)}
                  className="clay-inset flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-primary"
                >
                  <Circle className="size-4" />
                </button>
                <span className="flex-1 text-sm leading-snug">{task.label}</span>
              </li>
            ))}
            {openTasks.length === 0 && (
              <li className="clay-inset flex items-center gap-2 rounded-2xl px-3 py-2 text-xs text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary" />
                Seluruh tugas telah diselesaikan.
              </li>
            )}
          </ul>
        )}
      </section>

      <section className="clay grad-sky p-5 text-tint-sky-foreground">
        <h2 className="h-card">Ringkasan keuangan</h2>
        {!wedding || budget === undefined || savings === undefined ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-6 w-full rounded-xl bg-white/70" />
            <Skeleton className="h-6 w-full rounded-xl bg-white/70" />
            <Skeleton className="h-6 w-full rounded-xl bg-white/70" />
            <Skeleton className="h-8 w-full rounded-xl bg-white/70" />
          </div>
        ) : fundTarget === 0 ? (
          <div className="mt-3">
            <EmptyState
              emoji="💰"
              title="Target dana belum ditetapkan"
              description="Tentukan target dana agar rencana keuangan terukur."
              actionLabel="Atur target dana"
              onAction={() => navigate("/app/pengaturan")}
            />
          </div>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="opacity-75">Target dana</span>
              <span className="num font-semibold">{formatRupiah(fundTarget)}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-75">Alokasi anggaran</span>
              <span className="num font-semibold">{formatRupiah(allocated)}</span>
            </div>
            <div className="flex justify-between rounded-2xl bg-white/60 px-3 py-2">
              <span className="opacity-75">Kebutuhan dana tambahan</span>
              <span className="num font-extrabold">
                {formatRupiah(Math.max(0, fundTarget - savingsTotal))}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
