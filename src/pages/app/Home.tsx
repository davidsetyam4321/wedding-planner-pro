import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { countdownLabel, formatDateID, formatRupiah, formatRupiahShort } from "@/lib/format";
import { ChevronRight, ListChecks, PiggyBank, Wallet } from "lucide-react";
import { Link } from "react-router";
import { useQuery } from "convex/react";

/** Home dashboard: summary cards for budget, savings, checklist + next tasks. */
export function HomePage() {
  const { user } = useAuth();
  const wedding = useQuery(api.wedding.get);
  const savings = useQuery(api.savings.list);
  const budget = useQuery(api.budget.overview);
  const checklist = useQuery(api.checklist.list);

  const savingsTotal = savings?.reduce((sum, d) => sum + d.amount, 0) ?? 0;
  const fundTarget = wedding?.fundTarget ?? 0;
  const pct = fundTarget > 0 ? Math.min(100, Math.round((savingsTotal / fundTarget) * 100)) : 0;

  const spent = budget?.expenses.reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const allocated = budget?.categories.reduce((sum, c) => sum + c.allocated, 0) ?? 0;

  const openTasks = (checklist ?? []).filter((item) => !item.done).slice(0, 3);
  const openCount = (checklist ?? []).filter((item) => !item.done).length;

  return (
    <div className="space-y-4 pt-3">
      <section>
        <p className="prompt-label text-xs text-muted-foreground">status</p>
        <h1 className="mt-0.5 text-lg font-semibold">
          Hai {user?.name ?? wedding?.partnerOneName ?? "pengantin"}! 👋
        </h1>
        <p className="text-xs text-muted-foreground">
          {wedding
            ? `${countdownLabel(wedding.weddingDate)} · ${formatDateID(wedding.weddingDate)}`
            : "Memuat tanggal pernikahan…"}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link to="/app/tabungan" className="group">
          <div className="panel scanline-top p-3 transition-colors group-hover:border-primary/50">
            <div className="flex items-center justify-between">
              <PiggyBank className="size-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">tabungan</span>
            </div>
            <p className="mt-2 text-base font-semibold">{formatRupiahShort(savingsTotal)}</p>
            <p className="text-[11px] text-muted-foreground">{pct}% dari {formatRupiahShort(fundTarget)}</p>
            <div className="mt-2 h-1 w-full border border-border bg-background">
              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </Link>

        <Link to="/app/budget" className="group">
          <div className="panel scanline-top p-3 transition-colors group-hover:border-primary/50">
            <div className="flex items-center justify-between">
              <Wallet className="size-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">budget</span>
            </div>
            <p className="mt-2 text-base font-semibold">{formatRupiahShort(spent)}</p>
            <p className="text-[11px] text-muted-foreground">
              terpakai dari alokasi {formatRupiahShort(allocated)}
            </p>
            <div className="mt-2 h-1 w-full border border-border bg-background">
              <div
                className={`h-full ${spent > allocated ? "bg-destructive" : "bg-primary"}`}
                style={{
                  width: `${allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>
        </Link>
      </section>

      <section className="panel">
        <div className="panel-header justify-between">
          <span className="flex items-center gap-1.5">
            <ListChecks className="size-3.5" /> Checklist terdekat
          </span>
          <Link to="/app/checklist" className="normal-case tracking-normal hover:text-primary">
            {openCount} terbuka
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {openTasks.map((task) => (
            <li key={task._id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="text-muted-foreground">[ ]</span>
              <span className="flex-1 truncate">{task.label}</span>
            </li>
          ))}
          {openTasks.length === 0 && (
            <li className="px-3 py-3 text-xs text-muted-foreground">
              {checklist === undefined
                ? "Memuat tugas…"
                : "Semua tugas selesai. Mantap! 🎉"}
            </li>
          )}
        </ul>
        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" size="sm" className="w-full justify-between text-xs">
            <Link to="/app/checklist">
              Buka checklist <ChevronRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">Ringkasan dana</div>
        <div className="space-y-1.5 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target dana</span>
            <span className="font-medium">{formatRupiah(fundTarget)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Terkumpul</span>
            <span className="font-medium text-primary">{formatRupiah(savingsTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-dashed border-border pt-1.5">
            <span className="text-muted-foreground">Sisa perlu dikumpulkan</span>
            <span className="font-semibold">{formatRupiah(Math.max(0, fundTarget - savingsTotal))}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
