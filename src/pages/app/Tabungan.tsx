import { CHART_COLORS, ChartCard, ChartTip } from "@/components/Charts";
import {
  EmptyState,
  PageSkeleton,
  RowMenu,
  SectionHeader,
  Stagger,
  StaggerItem,
} from "@/components/Shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { bloom } from "@/lib/bloom";
import { formatDateID, formatDateTimeID, formatRupiah, formatRupiahShort } from "@/lib/format";
import { DateInputID, MoneyInput } from "@/components/Shared";
import { vendorPaidAmount } from "@/lib/budget";
import { Loader2, Plus, Target, TrendingUp } from "@/lib/icons";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { undoableDelete } from "@/lib/undo";
import { useMutation, useQuery } from "convex/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

const QUICK_AMOUNTS = [250_000, 500_000, 1_000_000, 2_000_000];

/** Ring progres SVG dengan gradasi sage → champagne (visualisasi target). */
function ProgressRing({ pct, size = 88, stroke = 10 }: { pct: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--tint-sage)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#sj-ring-grad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - (clamped / 100) * circumference}
      />
      <defs>
        <linearGradient id="sj-ring-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="var(--chart-1)" />
      <stop offset="100%" stopColor="var(--chart-2)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function TabunganPage() {
  const reducedMotion = useReducedMotion();
  const wedding = useQuery(api.wedding.get);
  const deposits = useQuery(api.savings.list);
  const addDeposit = useMutation(api.savings.add);
  const updateDeposit = useMutation(api.savings.update);
  const removeDeposit = useMutation(api.savings.remove);
  const updateSettings = useMutation(api.wedding.updateSettings);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<{
    id: Id<"savingDeposit">;
    amount: string;
    note: string;
  } | null>(null);
  const [editingBusy, setEditingBusy] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [range, setRange] = useState<3 | 6 | 12>(6);
  const [targetValue, setTargetValue] = useState("");
  const [targetBusy, setTargetBusy] = useState(false);

  const vendors = useQuery(api.vendors.list);
  const list = deposits ?? [];
  const total = list.reduce((sum, deposit) => sum + deposit.amount, 0);
  const target = wedding?.fundTarget ?? 0;
  const totalVendorCost = vendors?.reduce((sum, vendor) => sum + vendor.cost, 0) ?? 0;
  const paidVendorCost = vendors?.reduce((sum, vendor) => sum + vendorPaidAmount(vendor), 0) ?? 0;
  const vendorObligation = Math.max(0, totalVendorCost - paidVendorCost);
  const fundingGap = Math.max(0, vendorObligation - total);
  const monthsRemaining = wedding
    ? Math.max(1, Math.ceil((wedding.weddingDate - Date.now()) / (30.4375 * 24 * 60 * 60 * 1000)))
    : 1;
  const monthlySaving = Math.ceil(fundingGap / monthsRemaining);
  const pct = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;

  const now = new Date();
  const thisMonth = list
    .filter((deposit) => {
      const date = new Date(deposit.savedAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, deposit) => sum + deposit.amount, 0);
  const average = list.length > 0 ? Math.round(total / list.length) : 0;

  // Last 6 months of deposits for the mini bar chart (oldest → newest).
  const chart: { label: string; sum: number }[] = [];
  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const sum = list
      .filter((deposit) => {
        const saved = new Date(deposit.savedAt);
        return (
          saved.getMonth() === date.getMonth() &&
          saved.getFullYear() === date.getFullYear()
        );
      })
      .reduce((accumulator, deposit) => accumulator + deposit.amount, 0);
    chart.push({ label: MONTHS_SHORT[date.getMonth()], sum });
  }
  const chartMax = Math.max(...chart.map((bar) => bar.sum), 1);

  const groups = list.reduce<Record<string, typeof list>>((accumulator, deposit) => {
    const date = new Date(deposit.savedAt);
    const key = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    accumulator[key] = accumulator[key] ?? [];
    accumulator[key].push(deposit);
    return accumulator;
  }, {});

  // Proyeksi dana: kumulatif setoran pada akhir tiap bulan + garis target.
  const projectionData = Array.from({ length: range }, (_, index) => {
    const monthDate = new Date(
      now.getFullYear(),
      now.getMonth() - (range - 1 - index),
      1,
    );
    const monthEnd = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const kumulatif = list
      .filter((deposit) => deposit.savedAt <= monthEnd.getTime())
      .reduce((sum, deposit) => sum + deposit.amount, 0);
    return {
      label: MONTHS_SHORT[monthDate.getMonth()],
      kumulatif,
      target,
    };
  });

  const submit = async (valueOverride?: number) => {
    const value = valueOverride ?? Number(amount);
    if (!value || value <= 0) {
      toast.error("Isi nominal setoran yang valid.");
      return;
    }
    setSaving(true);
    try {
      await addDeposit({ amount: value, note: note || undefined });
      bloom();
      toast.success(`Setoran ${formatRupiah(value)} tercatat.`);
      setAmount("");
      setNote("");
    } catch {
      toast.error("Gagal menyimpan setoran.");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setEditingBusy(true);
    try {
      await updateDeposit({
        depositId: editing.id,
        amount: Number(editing.amount) || 0,
        note: editing.note,
      });
      setEditing(null);
      toast.success("Setoran diperbarui.");
    } catch {
      toast.error("Gagal memperbarui setoran.");
    } finally {
      setEditingBusy(false);
    }
  };

  const saveTarget = async () => {
    if (!wedding) return;
    setTargetBusy(true);
    try {
      await updateSettings({
        partnerOneName: wedding.partnerOneName,
        partnerTwoName: wedding.partnerTwoName,
        weddingDate: wedding.weddingDate,
        fundTarget: Number(targetValue) || 0,
        venueName: wedding.venueName,
      });
      setTargetOpen(false);
      bloom();
      toast.success("Target dana diperbarui.");
    } catch {
      toast.error("Gagal memperbarui target.");
    } finally {
      setTargetBusy(false);
    }
  };

  if (deposits === undefined) return <PageSkeleton />;

  return (
    <div className="sj-document-page sj-savings-page space-y-4">
      <header className="sj-page-heading border-b border-[var(--line)] pb-4">
        <p className="text-sm font-medium text-[var(--ink-soft)]">Buku kas · Tabungan</p>
        <h1 className="mt-1 font-serif text-[clamp(2.25rem,4vw,3.5rem)] leading-tight text-[var(--ink)]">Tabungan bersama</h1>
        <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-[var(--ink-soft)]">{list.length} setoran tercatat sampai saat ini.</p>
      </header>
      <section className="sj-paper-sheet p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--ink-soft)]">Progres menuju target</p>
            <p className="meta mt-1">Target {formatRupiahShort(target)}</p>
          </div>
          <button
            type="button"
            className="chip bg-tint-lavender text-tint-lavender-foreground"
            onClick={() => {
              setTargetValue(String(target));
              setTargetOpen(true);
            }}
          >
            <Target className="size-3.5" /> Ubah target
          </button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="num text-3xl font-extrabold">{formatRupiah(total)}</p>
            <p className="num mt-1.5 text-sm text-[var(--ink-soft)]">
              {pct}% terkumpul · kurang {formatRupiah(Math.max(0, target - total))} dari target
            </p>
          </div>
          <div className="relative shrink-0">
            <ProgressRing pct={pct} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="num text-sm font-extrabold text-primary">{pct}%</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Target
              </span>
            </div>
          </div>
        </div>
        <p className="mt-4 border-t border-[var(--line)] pt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
          {vendors === undefined ? "Memuat sisa kewajiban vendor…" : vendorObligation > 0
            ? <>Sisa kewajiban vendor <strong className="num text-[var(--ink)]">{formatRupiah(vendorObligation)}</strong>. {fundingGap > 0
              ? <>Tabungan masih kurang <strong className="num text-[var(--ink)]">{formatRupiah(fundingGap)}</strong> — sekitar <strong className="num text-[var(--ink)]">{formatRupiah(monthlySaving)}</strong> per bulan hingga {wedding ? formatDateID(wedding.weddingDate) : "hari pernikahan"}.</>
              : <>Tabungan tercatat sudah mencukupi kewajiban vendor saat ini.</>}</>
            : "Belum ada sisa kewajiban vendor yang tercatat."}
        </p>
      </section>

      <p className="border-b border-[var(--line)] py-3 text-sm text-[var(--ink-soft)]">
        Bulan ini <strong className="num text-[var(--ink)]">{formatRupiah(thisMonth)}</strong> · rata-rata per setoran <strong className="num text-[var(--ink)]">{formatRupiah(average)}</strong> · {list.length} kali setor
      </p>

      {/* Mini chart: 6 bulan terakhir */}
      <Stagger>
        <StaggerItem>
          <section className="clay p-4">
            <SectionHeader
              title="6 bulan terakhir"
              action={<TrendingUp className="size-4 text-primary" />}
            />
            <div className="mt-3 flex h-24 items-end justify-between gap-2">
              {chart.map((bar) => (
                <div
                  key={bar.label}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                >
                  <p className="num text-[9px] font-bold text-muted-foreground">
                    {bar.sum > 0 ? formatRupiahShort(bar.sum) : ""}
                  </p>
                  <div
                    className={`w-full max-w-9 rounded-t-lg transition-all ${
                      bar.sum > 0 ? "bg-primary" : "bg-mist-gray"
                    }`}
                    style={{
                      height: bar.sum > 0 ? `${Math.max(10, (bar.sum / chartMax) * 72)}px` : 6,
                    }}
                  />
                  <p className="num text-[10px] font-bold text-muted-foreground">
                    {bar.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </StaggerItem>
      </Stagger>

      <ChartCard
        title="Proyeksi dana"
        action={
          <div className="flex gap-1">
            {([3, 6, 12] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={range === value}
                onClick={() => setRange(value)}
                className={`chip ${
                  range === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {value} bln
              </button>
            ))}
          </div>
        }
      >
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={projectionData}
              margin={{ top: 8, right: 8, bottom: 0, left: -14 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-fog)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value: number | string) =>
                  formatRupiahShort(Number(value))
                }
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={58}
              />
              <Tooltip content={<ChartTip format={formatRupiahShort} />} />
              <Area
                type="monotone"
                dataKey="kumulatif"
                name="Terkumpul"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                fill="var(--chart-1)"
                fillOpacity={0.16}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Target"
                stroke={CHART_COLORS[1]}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[var(--chart-1)]" /> Terkumpul
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[var(--chart-2)]" /> Target
          </span>
        </div>
      </ChartCard>

      <section className="clay space-y-3 p-4">
        <SectionHeader title="Setor baru" />
        <div className="grid grid-cols-2 gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              disabled={saving}
              onClick={() => void submit(value)}
              className="clay-press rounded-2xl bg-tint-butter/60 px-3 py-2.5 text-sm font-extrabold text-tint-butter-foreground transition-all disabled:opacity-60"
            >
              + {formatRupiahShort(value)}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deposit-amount">Nominal (Rp)</Label>
          <MoneyInput
            id="deposit-amount"
            value={amount}
            onChange={setAmount}
            placeholder="500.000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deposit-note">Catatan (opsional)</Label>
          <Input
            id="deposit-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="cth. setoran gaji bulan ini"
          />
        </div>
        <Button onClick={() => void submit()} disabled={saving} className="w-full rounded-2xl">
          {saving ? <Loader2 className="size-4 animate-spin" /> : (
            <>
              <Plus className="size-4" /> Catat setoran
            </>
          )}
        </Button>
      </section>

      <Stagger className="space-y-3">
        {Object.entries(groups).map(([month, monthDeposits]) => (
          <StaggerItem key={month}>
            <section className="clay overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="h-card">{month}</h2>
                <span className="num text-[11px] font-bold text-primary">
                  + {formatRupiahShort(
                    monthDeposits.reduce((sum, deposit) => sum + deposit.amount, 0),
                  )}
                </span>
              </div>
              <ul className="divide-y divide-border">
                <AnimatePresence>
                {monthDeposits.map((deposit) => (
                  <motion.li key={deposit._id}
                    layout={reducedMotion ? false : "position"}
                    initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.2 }}
                    className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {deposit.note ?? "Setoran"}
                      </p>
                      <p className="meta">{formatDateTimeID(deposit.savedAt)}</p>
                    </div>
                    <span className="num text-sm font-bold text-primary">
                      +{formatRupiahShort(deposit.amount)}
                    </span>
                    <RowMenu
                      onEdit={() =>
                        setEditing({
                          id: deposit._id,
                          amount: String(deposit.amount),
                          note: deposit.note ?? "",
                        })
                      }
                      onDelete={() => {
                        void removeDeposit({ depositId: deposit._id });
                        undoableDelete(
                          `Setoran ${formatRupiahShort(deposit.amount)} dihapus.`,
                          () =>
                            addDeposit({
                              amount: deposit.amount,
                              note: deposit.note,
                            }),
                          { successMessage: "Setoran dipulihkan." },
                        );
                      }}
                      deleteTitle="Hapus setoran ini?"
                      deleteDescription="Total tabungan akan menyesuaikan."
                    />
                  </motion.li>
                ))}
                </AnimatePresence>
              </ul>
            </section>
          </StaggerItem>
        ))}
      </Stagger>

      {list.length === 0 && deposits !== undefined && (
        <EmptyState
          emoji="🐷"
          title="Belum ada setoran"
          description="Mulai dari nominal kecil, yang penting rutin. Tabungan cepat terasa kalau konsisten!"
          actionLabel={`Setor ${formatRupiahShort(QUICK_AMOUNTS[0])}`}
          onAction={() => void submit(QUICK_AMOUNTS[0])}
        />
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ubah setoran</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-amount">Nominal (Rp)</Label>
              <MoneyInput
                id="edit-amount"
                value={editing?.amount ?? ""}
                onChange={(amount) => setEditing((previous) => previous ? { ...previous, amount } : previous)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-note">Catatan</Label>
              <Input
                id="edit-note"
                value={editing?.note ?? ""}
                onChange={(event) =>
                  setEditing((previous) =>
                    previous ? { ...previous, note: event.target.value } : previous,
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveEdit} disabled={editingBusy} className="w-full rounded-2xl">
              {editingBusy ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={targetOpen} onOpenChange={setTargetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Target dana</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="target-value">Total kebutuhan (Rp)</Label>
            <MoneyInput
              id="target-value"
              value={targetValue}
              onChange={setTargetValue}
              placeholder="50.000.000"
            />
          </div>
          <DialogFooter>
            <Button onClick={saveTarget} disabled={targetBusy} className="w-full rounded-2xl">
              {targetBusy ? <Loader2 className="size-4 animate-spin" /> : "Simpan target"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
