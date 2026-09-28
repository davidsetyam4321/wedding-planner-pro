import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { FEATURES } from "@/lib/features";
import {
  countdownLabel,
  formatDateID,
  formatRupiah,
  formatRupiahShort,
} from "@/lib/format";
import { ArrowUpRight, CheckCircle2, Circle, Heart } from "lucide-react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";

/** Dashboard: ringkasan utama + akses ke delapan fitur. */
export function HomePage() {
  const { user } = useAuth();
  const wedding = useQuery(api.wedding.get);
  const savings = useQuery(api.savings.list);
  const budget = useQuery(api.budget.overview);
  const checklist = useQuery(api.checklist.list);
  const toggleItem = useMutation(api.checklist.toggle);

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

  return (
    <div className="space-y-4">
      <section className="clay p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              Selamat datang kembali
            </p>
            <h1 className="mt-0.5 text-xl font-extrabold leading-tight">
              {user?.name ?? wedding?.partnerOneName ?? "Pengantin"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {wedding
                ? `${formatDateID(wedding.weddingDate)}${wedding.venueName ? ` · ${wedding.venueName}` : ""}`
                : "Memuat rencana pernikahan…"}
            </p>
          </div>
          <div className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-accent">
            <Heart className="size-5 text-primary" />
          </div>
        </div>

        <div className="clay-inset mt-4 flex items-center justify-between rounded-3xl px-4 py-3">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">
              Menuju hari bahagia
            </p>
            <p className="text-2xl font-extrabold text-primary">
              {wedding ? countdownLabel(wedding.weddingDate) : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium text-muted-foreground">
              Dana terkumpul
            </p>
            <p className="text-sm font-bold">{formatRupiahShort(savingsTotal)}</p>
            <p className="text-[11px] text-muted-foreground">{fundPct}% dari target</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <div className="clay p-3">
          <p className="text-[10px] font-semibold text-muted-foreground">Budget</p>
          <p className="mt-1 text-sm font-extrabold">{formatRupiahShort(spent)}</p>
          <div className="clay-inset mt-2 h-2 overflow-hidden rounded-full">
            <div className="h-full rounded-full bg-primary" style={{ width: `${spentPct}%` }} />
          </div>
        </div>
        <div className="clay p-3">
          <p className="text-[10px] font-semibold text-muted-foreground">Tabungan</p>
          <p className="mt-1 text-sm font-extrabold">{formatRupiahShort(savingsTotal)}</p>
          <div className="clay-inset mt-2 h-2 overflow-hidden rounded-full">
            <div className="h-full rounded-full bg-primary" style={{ width: `${fundPct}%` }} />
          </div>
        </div>
        <div className="clay p-3">
          <p className="text-[10px] font-semibold text-muted-foreground">Checklist</p>
          <p className="mt-1 text-sm font-extrabold">{doneCount} selesai</p>
          <div className="clay-inset mt-2 h-2 overflow-hidden rounded-full">
            <div className="h-full rounded-full bg-primary" style={{ width: `${taskPct}%` }} />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-end justify-between">
          <h2 className="text-sm font-bold">8 fitur Planner Wedding</h2>
          <span className="text-[11px] text-muted-foreground">semua aktif</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((feature) => (
            <Link key={feature.to} to={feature.to} className="clay clay-press p-4">
              <div className="clay-sm flex size-9 items-center justify-center rounded-xl bg-accent">
                <feature.icon className="size-4 text-primary" />
              </div>
              <p className="mt-2.5 text-sm font-bold leading-tight">{feature.label}</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {feature.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="clay p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Tugas berikutnya</h2>
          <Link
            to="/app/checklist"
            className="flex items-center gap-1 text-[11px] font-semibold text-primary"
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
                onClick={() => toggleItem({ itemId: task._id, done: true })}
                className="clay-inset flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-primary"
              >
                <Circle className="size-3.5" />
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
            <li className="text-xs text-muted-foreground">Memuat tugas…</li>
          )}
        </ul>
      </section>

      <section className="clay p-4">
        <h2 className="text-sm font-bold">Ringkasan dana</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target dana</span>
            <span className="font-semibold">{formatRupiah(fundTarget)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Terkumpul</span>
            <span className="font-semibold text-primary">{formatRupiah(savingsTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Alokasi anggaran</span>
            <span className="font-semibold">{formatRupiah(allocated)}</span>
          </div>
          <div className="clay-inset mt-1 flex justify-between rounded-2xl px-3 py-2">
            <span className="text-muted-foreground">Sisa dana yang dicari</span>
            <span className="font-bold">
              {formatRupiah(Math.max(0, fundTarget - savingsTotal))}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
