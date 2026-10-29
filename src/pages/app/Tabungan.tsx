import { CHART_COLORS, ChartTip } from "@/components/Charts";
import {
  EmptyState,
  MoneyInput,
  PageHeading,
  PageSkeleton,
  RowMenu,
  Segmented,
  StackBar,
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
  const now = new Date();
  const monthsRemaining = wedding
    ? Math.max(1, Math.ceil((wedding.weddingDate - now.getTime()) / (30.4375 * 24 * 60 * 60 * 1000)))
    : 1;
  const monthlySaving = Math.ceil(fundingGap / monthsRemaining);
  const pct = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;

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
  const chartReady =
    list.length >= 2 && chart.filter((bar) => bar.sum > 0).length >= 3;

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
    <div className="sj-document-page sj-savings-page space-y-5">
      <PageHeading
        kicker="Buku kas"
        title="Tabungan bersama"
        summary={
          list.length === 0
            ? "Belum ada setoran. Catat setoran pertama kalian di bawah."
            : <><span className="num">{list.length} setoran</span> tercatat sejak setoran pertama sampai hari ini.</>
        }
        action={
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-transparent px-3.5 text-sm font-medium text-[var(--ink)] transition-transform duration-200 hover:border-[var(--brand)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            onClick={() => {
              setTargetValue(String(target));
              setTargetOpen(true);
            }}
          >
            <Target className="size-4" weight="light" /> Ubah target
          </button>
        }
      />

      <section
        className="sj-paper-sheet p-5 sm:p-6"
        aria-label="Ringkasan tabungan"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-8">
          <div className="min-w-0">
            <p className="text-sm text-[var(--ink-soft)]">
              Terkumpul dari target{" "}
              <span className="num text-[var(--ink)]">{formatRupiah(target)}</span>
            </p>
            <p className="figure-xl mt-2 text-[var(--ink)]">{formatRupiah(total)}</p>
            <p className="mt-3 max-w-[48ch] text-base leading-relaxed text-[var(--ink-soft)]">
              <strong className="num font-semibold text-[var(--ink)]">{pct}%</strong> terkumpul.
              {target > 0 && (
                <>
                  {" "}Masih kurang{" "}
                  <strong className="num font-semibold text-[var(--ink)]">
                    {formatRupiah(Math.max(0, target - total))}
                  </strong>{" "}
                  dari target.
                </>
              )}
            </p>
            <StackBar
              className="mt-5 h-3"
              label={`Tabungan ${pct}% dari target ${formatRupiah(target)}`}
              segments={[
                { label: "Terkumpul", value: total, tone: "brand", title: formatRupiah(total) },
                {
                  label: "Masih kurang",
                  value: Math.max(0, target - total),
                  tone: "sunk",
                  title: formatRupiah(Math.max(0, target - total)),
                },
              ]}
            />
            <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[0.8125rem] text-[var(--ink-soft)]">
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-[var(--brand)]"
                />
                Terkumpul <span className="num">{formatRupiah(total)}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-[color-mix(in_srgb,var(--ink-soft)_25%,transparent)]"
                />
                Kurang <span className="num">{formatRupiah(Math.max(0, target - total))}</span>
              </span>
            </div>
          </div>

          <div className="surface-sunk min-w-0 p-4">
            <p className="text-[0.8125rem] text-[var(--ink-soft)]">
              Kebutuhan vendor yang belum dibayar
            </p>
            <p className="num mt-1 display-serif text-2xl leading-tight text-[var(--ink)]">
              {vendors === undefined ? "Memuat…" : formatRupiah(vendorObligation)}
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-[var(--ink-soft)]">
              {vendors === undefined ? (
                "Memuat sisa kewajiban vendor…"
              ) : vendorObligation > 0 ? (
                fundingGap > 0 ? (
                  <>
                    Tabungan tercatat belum menutup sisa kewajiban vendor. Kurang{" "}
                    <strong className="num font-semibold text-[var(--ink)]">
                      {formatRupiah(fundingGap)}
                    </strong>{" "}
                    — sekitar{" "}
                    <strong className="num font-semibold text-[var(--ink)]">
                      {formatRupiah(monthlySaving)}
                    </strong>{" "}
                    per bulan sampai{" "}
                    {wedding ? formatDateID(wedding.weddingDate) : "hari pernikahan"}.
                  </>
                ) : (
                  <>Tabungan tercatat sudah menutup sisa kewajiban vendor saat ini.</>
                )
              ) : (
                "Belum ada sisa kewajiban vendor yang tercatat. Tambahkan vendor untuk melihat kebutuhan dana."
              )}
            </p>
            {vendorObligation > 0 && (
              <StackBar
                className="mt-3 h-1.5"
                label={`Tabungan ${formatRupiah(total)} dibanding sisa kewajiban ${formatRupiah(vendorObligation)}`}
                segments={[
                  { label: "Tabungan", value: total, tone: "positive", title: formatRupiah(total) },
                  { label: "Kurang", value: fundingGap, tone: "warning", title: formatRupiah(fundingGap) },
                ]}
              />
            )}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-[var(--line)] pt-4 sm:grid-cols-3 sm:gap-6">
          <div>
            <dt className="text-[0.8125rem] text-[var(--ink-soft)]">Bulan ini</dt>
            <dd className="num mt-0.5 display-serif text-xl text-[var(--ink)]">
              {formatRupiah(thisMonth)}
            </dd>
          </div>
          <div>
            <dt className="text-[0.8125rem] text-[var(--ink-soft)]">Rata-rata per setoran</dt>
            <dd className="num mt-0.5 display-serif text-xl text-[var(--ink)]">
              {formatRupiah(average)}
            </dd>
          </div>
          <div>
            <dt className="text-[0.8125rem] text-[var(--ink-soft)]">Jumlah setoran</dt>
            <dd className="num mt-0.5 display-serif text-xl text-[var(--ink)]">
              {list.length} kali
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="min-w-0 lg:col-span-7">
          <section
            className="sj-paper-sheet h-full p-5"
            aria-labelledby="enam-bulan-title"
          >
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[var(--line)] pb-3">
              <h2 id="enam-bulan-title" className="display-serif text-2xl text-[var(--ink)]">
                Enam bulan terakhir
              </h2>
              <TrendingUp className="size-4 text-[var(--accent)]" weight="light" />
            </div>

            {!chartReady ? (
              <div className="pt-4">
                <p className="max-w-[54ch] text-sm leading-relaxed text-[var(--ink-soft)]">
                  Grafik bulanan muncul setelah ada setoran di tiga bulan berbeda. Satu setoran
                  lagi tidak cukup untuk menunjukkan pola.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("setor-baru")
                      ?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" })
                  }
                  className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                >
                  Catat setoran
                </button>
              </div>
            ) : (
              <div className="mt-4 flex h-32 items-end gap-2 sm:gap-3">
                {chart.map((bar) => {
                  const ratio = bar.sum > 0 ? Math.max(0.08, bar.sum / chartMax) : 0;
                  return (
                    <div
                      key={bar.label}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
                      title={`${bar.label}: ${formatRupiah(bar.sum)}`}
                    >
                      <span className="num text-[0.8125rem] text-[var(--ink-soft)]">
                        {bar.sum > 0 ? formatRupiahShort(bar.sum) : ""}
                      </span>
                      <span className="flex h-full w-full max-w-10 items-end">
                        <span
                          aria-hidden="true"
                          className="block w-full origin-bottom rounded-t-[6px] transition-transform duration-500"
                          style={{
                            height: "100%",
                            transform: `scaleY(${ratio})`,
                            backgroundColor:
                              bar.sum > 0 ? "var(--brand)" : "var(--paper-sunk)",
                          }}
                        />
                      </span>
                      <span className="num text-[0.8125rem] text-[var(--ink-soft)]">
                        {bar.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <section
          id="setor-baru"
          className="sj-paper-sheet min-w-0 scroll-mt-24 p-4 sm:p-5 lg:col-span-5"
          aria-labelledby="setor-title"
        >
          <div className="border-b border-[var(--line)] pb-3">
            <h2 id="setor-title" className="display-serif text-2xl text-[var(--ink)]">
              Setor baru
            </h2>
            <p className="mt-1 text-[0.8125rem] text-[var(--ink-soft)]">
              Langsung tersinkron ke akun pasangan.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                disabled={saving}
                onClick={() => void submit(value)}
                title={`Setor ${formatRupiah(value)}`}
                className="num flex min-h-11 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-semibold text-[var(--ink)] transition-transform duration-200 hover:border-[var(--brand)] active:scale-[0.97] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
              >
                + {formatRupiah(value)}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
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
            <Button onClick={() => void submit()} disabled={saving} className="w-full rounded-lg">
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Plus className="size-4" /> Catat setoran
                </>
              )}
            </Button>
          </div>
        </section>
      </div>

      {list.length >= 2 ? (
        <section className="sj-paper-sheet p-4 sm:p-5" aria-labelledby="proyeksi-title">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] pb-3">
            <div className="min-w-0">
              <h2 id="proyeksi-title" className="display-serif text-2xl text-[var(--ink)]">
                Proyeksi dana
              </h2>
              <p className="mt-1 text-[0.8125rem] text-[var(--ink-soft)]">
                Kumulatif setoran sampai akhir bulan, dibanding target.
              </p>
            </div>
            <Segmented
              label="Rentang proyeksi"
              className="w-[12.5rem]"
              value={String(range)}
              onChange={(value) => setRange(Number(value) as 3 | 6 | 12)}
              options={[
                { value: "3", label: "3 bln" },
                { value: "6", label: "6 bln" },
                { value: "12", label: "12 bln" },
              ]}
            />
          </div>
          <div className="mt-3 h-48">
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
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value: number | string) => formatRupiahShort(Number(value))}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={58}
                />
                <Tooltip content={<ChartTip format={formatRupiah} />} />
                <Area
                  type="monotone"
                  dataKey="kumulatif"
                  name="Terkumpul"
                  stroke="var(--brand)"
                  strokeWidth={2.5}
                  fill="var(--brand)"
                  fillOpacity={0.14}
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
          <div className="mt-1 flex items-center gap-4 text-[0.8125rem] text-[var(--ink-soft)]">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[var(--brand)]" /> Terkumpul
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[var(--accent)]" /> Target
            </span>
          </div>
        </section>
      ) : (
        <p className="border-t border-[var(--line)] pt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
          Proyeksi dana muncul setelah dua setoran. Dengan satu setoran, grafik hanya akan
          menampilkan satu titik.
        </p>
      )}

      <section aria-labelledby="riwayat-title" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3 border-b border-[var(--line)] pb-3">
          <h2 id="riwayat-title" className="display-serif text-2xl text-[var(--ink)]">
            Riwayat setoran
          </h2>
          {list.length > 0 && (
            <span className="num text-[0.8125rem] text-[var(--ink-soft)]">
              {formatRupiah(total)} total
            </span>
          )}
        </div>

        {list.length === 0 ? (
          <EmptyState
            emoji="🐷"
            title="Belum ada setoran"
            description="Mulai dari nominal kecil, yang penting rutin."
            actionLabel={`Setor ${formatRupiah(QUICK_AMOUNTS[0])}`}
            onAction={() => void submit(QUICK_AMOUNTS[0])}
          />
        ) : (
          <Stagger className="space-y-3">
            {Object.entries(groups).map(([month, monthDeposits]) => (
              <StaggerItem key={month}>
                <section className="sj-paper-sheet overflow-hidden">
                  <div className="flex items-baseline justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
                    <h3 className="display-serif text-xl text-[var(--ink)]">{month}</h3>
                    <span className="num text-sm font-semibold text-[var(--brand)]">
                      + {formatRupiah(
                        monthDeposits.reduce((sum, deposit) => sum + deposit.amount, 0),
                      )}
                    </span>
                  </div>
                  <ul>
                    <AnimatePresence initial={false}>
                      {monthDeposits.map((deposit) => (
                        <motion.li
                          key={deposit._id}
                          layout={reducedMotion ? false : "position"}
                          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: reducedMotion ? 0 : 0.2 }}
                          className="sj-ledger-row flex items-center gap-2 px-4 py-3"
                        >
                          <div className="flex min-w-0 flex-1 items-baseline gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[var(--ink)]">
                                {deposit.note ?? "Setoran"}
                              </p>
                              <p className="num text-[0.8125rem] text-[var(--ink-soft)]">
                                {formatDateTimeID(deposit.savedAt)}
                              </p>
                            </div>
                            <span aria-hidden="true" className="sj-dot-leader" />
                            <span className="num shrink-0 text-sm font-semibold text-[var(--ink)]">
                              +{formatRupiah(deposit.amount)}
                            </span>
                          </div>
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
                                `Setoran ${formatRupiah(deposit.amount)} dihapus.`,
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
        )}
      </section>

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
                onChange={(amount) =>
                  setEditing((previous) => (previous ? { ...previous, amount } : previous))
                }
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
            <Button onClick={saveEdit} disabled={editingBusy} className="w-full rounded-lg">
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
            <p className="text-[0.8125rem] leading-relaxed text-[var(--ink-soft)]">
              Target ini dipakai untuk persentase tabungan di semua halaman.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={saveTarget} disabled={targetBusy} className="w-full rounded-lg">
              {targetBusy ? <Loader2 className="size-4 animate-spin" /> : "Simpan target"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
