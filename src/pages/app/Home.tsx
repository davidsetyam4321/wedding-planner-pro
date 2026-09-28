import { coupleInitials, useCouplePhotoUpload } from "@/components/CouplePhoto";
import { FlowerMark } from "@/components/Decor";
import { api } from "@/convex/_generated/api";
import { FEATURES } from "@/lib/features";
import { bloom } from "@/lib/bloom";
import {
  countdownLabel,
  formatDateID,
  formatRupiah,
  formatRupiahShort,
} from "@/lib/format";
import { ArrowUpRight, Camera, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";

/** Dashboard: ringkasan utama + pintu masuk ke delapan fitur. */
export function HomePage() {
  const wedding = useQuery(api.wedding.get);
  const savings = useQuery(api.savings.list);
  const budget = useQuery(api.budget.overview);
  const checklist = useQuery(api.checklist.list);
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

  const completeTask = async (itemId: (typeof openTasks)[number]["_id"]) => {
    await toggleItem({ itemId, done: true });
    bloom();
  };

  return (
    <div className="space-y-4">
      <input type="file" accept="image/*" className="hidden" {...inputProps} />

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
                {coupleInitials(wedding?.partnerOneName, wedding?.partnerTwoName)}
              </p>
              <p className="label text-muted-foreground">Foto pasangan</p>
            </div>
          )}

          <div className="photo-scrim absolute inset-0" />

          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="label text-white/70">Menuju hari bahagia</p>
            <h1 className="h-page mt-1.5 text-white">
              {wedding
                ? `${wedding.partnerOneName} & ${wedding.partnerTwoName}`
                : "Memuat rencana…"}
            </h1>
            <p className="meta mt-1 text-white/85">
              {wedding ? formatDateID(wedding.weddingDate) : ""}
              {wedding?.venueName ? ` · ${wedding.venueName}` : ""}
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

        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div>
            <p className="label text-muted-foreground">Hitung mundur</p>
            <p className="num mt-1 text-3xl font-semibold leading-none text-primary">
              {wedding ? countdownLabel(wedding.weddingDate) : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="label text-muted-foreground">Dana terkumpul</p>
            <p className="num mt-1 text-sm font-bold">
              {formatRupiahShort(savingsTotal)}
            </p>
            <div className="mt-1.5 ml-auto h-1.5 w-28 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${fundPct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

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

      <section>
        <div className="mb-2 flex items-end justify-between">
          <h2 className="h-card">8 fitur Planner Wedding</h2>
          <span className="meta">semua aktif</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((feature) => (
            <Link
              key={feature.to}
              to={feature.to}
              className={`clay clay-press p-4 ${feature.surface}`}
            >
              <div className="flex items-center justify-between">
                <feature.icon className="size-5" />
                <span className="text-lg">{feature.emoji}</span>
              </div>
              <p className="mt-2.5 text-sm font-extrabold leading-tight">
                {feature.label}
              </p>
              <p className="mt-1 text-[11px] leading-snug opacity-80">
                {feature.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="clay p-5">
        <div className="flex items-center justify-between">
          <h2 className="h-card">Tugas berikutnya</h2>
          <Link
            to="/app/checklist"
            className="flex items-center gap-1 text-[11px] font-bold text-primary"
          >
            Lihat semua <ArrowUpRight className="size-3" />
          </Link>
        </div>
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
          {openTasks.length === 0 && checklist !== undefined && (
            <li className="clay-inset flex items-center gap-2 rounded-2xl px-3 py-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              Semua tugas sudah selesai. Selamat!
            </li>
          )}
          {checklist === undefined && (
            <li className="meta">Memuat tugas…</li>
          )}
        </ul>
      </section>

      <section className="clay grad-sky p-5 text-tint-sky-foreground">
        <h2 className="h-card">Ringkasan dana</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="opacity-75">Target dana</span>
            <span className="num font-semibold">{formatRupiah(fundTarget)}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-75">Terkumpul</span>
            <span className="num font-semibold">{formatRupiah(savingsTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-75">Alokasi anggaran</span>
            <span className="num font-semibold">{formatRupiah(allocated)}</span>
          </div>
          <div className="flex justify-between rounded-2xl bg-white/60 px-3 py-2">
            <span className="opacity-75">Sisa dana yang dicari</span>
            <span className="num font-extrabold">
              {formatRupiah(Math.max(0, fundTarget - savingsTotal))}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
