import { ChartTip } from "@/components/Charts";
import {
  EmptyState,
  LedgerFigure,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { bloom } from "@/lib/bloom";
import { formatDateShortID, formatRupiah, formatRupiahShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteBudgetItem, summarizeBudget } from "@/lib/budget";
import { downloadCsv } from "@/lib/exportCsv";
import { printDocument } from "@/lib/printDoc";
import {
  AlertTriangle,
  Check,
  FileDown,
  FileText,
  Loader2,
  Plus,
  Search,
  X,
} from "@/lib/icons";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

type CategoryId = Id<"budgetCategory">;

export function BudgetPage() {
  const budget = useQuery(api.budget.overview);
  const createCategory = useMutation(api.budget.createCategory);
  const updateCategory = useMutation(api.budget.updateCategory);
  const deleteCategory = useMutation(api.budget.deleteCategory);
  const addExpense = useMutation(api.budget.addExpense);
  const updateExpense = useMutation(api.budget.updateExpense);
  const togglePaid = useMutation(api.budget.toggleExpensePaid);
  const deleteExpense = useMutation(api.budget.deleteExpense);

  const categories = budget?.categories ?? [];
  const expenses = budget?.expenses ?? [];
  const savingsTotal = budget?.savingsTotal ?? 0;
  const summary = summarizeBudget(
    categories.map((category) => ({
      id: category._id,
      allocated: category.allocated,
    })),
    expenses.map((expense) => ({
      source: expense.source,
      categoryId: expense.source === "manual" ? expense.categoryId : undefined,
      amount: expense.amount,
      isPaid: expense.paidAt !== undefined,
      trendAt:
        "createdAt" in expense
          ? expense.createdAt ?? ("_creationTime" in expense ? expense._creationTime : undefined)
          : expense.paidAt,
    })),
    savingsTotal,
  );

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    id: null as Id<"budgetExpense"> | null,
    label: "",
    amount: "",
    categoryId: "" as string,
    paid: false,
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [busy, setBusy] = useState(false);
  const [chartTab, setChartTab] = useState<"ikhtisar" | "tren">("ikhtisar");
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  /** Cocokkan kata kunci dengan nama kategori atau keterangan pengeluaran. */
  const matchesQuery = (label: string) =>
    term === "" || label.toLowerCase().includes(term);

  const [categoryDialog, setCategoryDialog] = useState<{
    id: CategoryId | null;
    name: string;
    allocated: string;
  } | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  const {
    totalAllocated,
    totalSpent,
    totalPaid,
    spentPct,
    isOver,
    remainingFunds: sisaDana,
    vendorTotal,
    trendData,
    byCategory: categoryTotals,
  } = summary;

  // Pengeluaran vendor (turunan dari halaman Vendor) dihitung sekali dan tampil
  // sebagai kelompok terpisah — tidak menempel di tiap kategori.
  const vendorExpenses = expenses.filter(
    (expense): expense is Extract<typeof expense, { source: "vendor" }> =>
      expense.source === "vendor",
  );
  type ManualExpenseRow = Extract<(typeof expenses)[number], { source: "manual" }>;
  const manualExpenses = expenses.filter(
    (expense): expense is ManualExpenseRow => expense.source === "manual",
  );
  const categoryById = new Map(categories.map((category) => [category._id, category]));

  // Komposisi pengeluaran sebagai baris ledger berurut nominal — bukan donat.
  // `categoryId` ikut dibawa supaya klik-filter tidak mengandalkan nama (aman
  // untuk kategori kembar).
  type CompositionRow = { name: string; value: number; categoryId?: string };
  const compositionRows: CompositionRow[] = [
    ...categories.map((category) => ({
      name: category.name,
      value: categoryTotals.get(category._id)?.spent ?? 0,
      categoryId: category._id as string,
    })),
    ...(vendorTotal > 0
      ? [{ name: "Pembayaran vendor", value: vendorTotal }]
      : []),
  ]
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  // Dua angka "sisa" yang berbeda dan tidak boleh tertukar:
  // - sisaAnggaran: alokasi kategori dikurangi yang sudah terpakai.
  // - saldoKas: tabungan tercatat dikurangi yang sudah terpakai.
  const sisaAnggaran = totalAllocated - totalSpent;
  const belumDibayar = Math.max(0, totalSpent - totalPaid);
  const saldoKas = sisaDana;

  const filterCategory =
    categories.find((category) => category._id === filterCategoryId) ?? null;

  // Tampilkan semua pengeluaran manual sebagai daftar datar; kategori hanya
  // menjadi label tiap baris, bukan kartu yang merangkum nominal/alokasinya.
  const visibleManualExpenses = manualExpenses.filter((expense) => {
    const category = categoryById.get(expense.categoryId);
    if (filterCategory && expense.categoryId !== filterCategory._id) return false;
    return term === "" || matchesQuery(expense.label) || matchesQuery(category?.name ?? "");
  });

  // Vendor ditampilkan sebagai total gabungan saja; pencarian hanya mengenali
  // label grup, bukan menampilkan rincian nama/nominal tiap vendor.
  const vendorVisible =
    !filterCategory &&
    vendorExpenses.length > 0 &&
    (term === "" || matchesQuery("vendor"));

  /** Toggle filter kategori dari baris komposisi (baris Vendor diabaikan). */
  const toggleFilter = (id: string) => {
    if (id === "vendor") return;
    setFilterCategoryId((previous) => (previous === id ? null : id));
  };

  const openNewExpense = () => {
    setExpenseForm({
      id: null,
      label: "",
      amount: "",
      categoryId: categories[0]?._id ?? "",
      paid: false,
    });
    setNewCategoryName("");
    setExpenseOpen(true);
  };

  const openEditExpense = (expense: (typeof expenses)[number]) => {
    // Baris vendor turunan dari halaman Vendor — hanya bisa diubah di sana.
    if (expense.source === "vendor") return;
    setExpenseForm({
      id: expense._id,
      label: expense.label,
      amount: String(expense.amount),
      categoryId: expense.categoryId,
      paid: Boolean(expense.paidAt),
    });
    setExpenseOpen(true);
  };

  const submitExpense = async () => {
    const value = Number(expenseForm.amount);
    if (!expenseForm.label.trim()) {
      toast.error("Isi keterangan pengeluaran dulu, ya.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Nominal harus lebih dari 0.");
      return;
    }
    if (!expenseForm.categoryId && !newCategoryName.trim()) {
      toast.error("Pilih kategori atau isi nama kategori baru.");
      return;
    }
    setBusy(true);
    try {
      const existingCategory = expenseForm.categoryId as CategoryId | "";
      if (expenseForm.id) {
        await updateExpense({
          expenseId: expenseForm.id,
          label: expenseForm.label,
          amount: value,
          categoryId: existingCategory || undefined,
          paid: expenseForm.paid,
        });
        toast.success("Pengeluaran diperbarui.");
      } else {
        await addExpense({
          categoryId: existingCategory || undefined,
          categoryName: existingCategory ? undefined : newCategoryName,
          label: expenseForm.label,
          amount: value,
          paid: expenseForm.paid,
        });
        bloom();
        toast.success("Pengeluaran dicatat.");
      }
      setExpenseOpen(false);
    } catch {
      toast.error("Gagal menyimpan pengeluaran.");
    } finally {
      setBusy(false);
    }
  };

  const removeCategory = (category: (typeof categories)[number]) => {
    const removed = manualExpenses
      .filter((expense) => expense.categoryId === category._id)
      .map((expense) => ({
        label: expense.label,
        amount: expense.amount,
        paidAt: expense.paidAt,
      }));
    void deleteBudgetItem(
      `Kategori "${category.name}" dihapus.`,
      () => deleteCategory({ categoryId: category._id }),
      async () => {
        const categoryId = await createCategory({
          name: category.name,
          allocated: category.allocated,
        });
        for (const expense of removed) {
          await addExpense({
            categoryId,
            label: expense.label,
            amount: expense.amount,
            paid: Boolean(expense.paidAt),
          });
        }
      },
      { successMessage: "Kategori dipulihkan." },
    );
  };

  const submitCategory = async () => {
    if (!categoryDialog) return;

    const name = categoryDialog.name.trim();
    if (!name) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }
    const allocated = Number(categoryDialog.allocated) || 0;
    if (allocated < 0) {
      toast.error("Alokasi tidak boleh negatif.");
      return;
    }
    const duplicate = categories.some(
      (category) =>
        category._id !== categoryDialog.id &&
        category.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      toast.error("Nama kategori sudah dipakai.");
      return;
    }

    setBusy(true);
    try {
      if (categoryDialog.id) {
        await updateCategory({
          categoryId: categoryDialog.id,
          name,
          allocated,
        });
        toast.success("Kategori diperbarui.");
      } else {
        await createCategory({ name, allocated });
        bloom();
        toast.success("Kategori ditambahkan.");
      }
      setCategoryDialog(null);
    } catch {
      toast.error("Gagal menyimpan kategori.");
    } finally {
      setBusy(false);
    }
  };

  /**
   * Ekspor ikhtisar anggaran sebagai CSV: satu baris per kategori (pengeluaran
   * manualnya saja), baris Vendor tersendiri, lalu baris TOTAL. Kolom Sisa tidak
   * dipatok nol — kelebihan anggaran harus tetap terbaca.
   */
  const exportCsv = () => {
    const rows: (string | number)[][] = categories.map((category) => {
      const spent = categoryTotals.get(category._id)?.spent ?? 0;
      return [
        category.name,
        category.allocated,
        spent,
        category.allocated - spent,
      ];
    });
    if (vendorExpenses.length > 0) {
      rows.push(["Vendor (sinkron)", "", vendorTotal, ""]);
    }
    rows.push([
      "TOTAL",
      totalAllocated,
      totalSpent,
      totalAllocated - totalSpent,
    ]);
    downloadCsv("budget-satujanji", ["Kategori", "Alokasi", "Terpakai", "Sisa"], rows);
    toast.success("CSV anggaran diunduh.");
  };

  /** Cetak ringkasan anggaran → dialog “Simpan sebagai PDF” browser. */
  const exportPdf = () => {
    printDocument(
      "Ringkasan Anggaran Pernikahan",
      `Terpakai ${formatRupiah(totalSpent)} dari ${formatRupiah(totalAllocated)}`,
      [
        {
          title: "Per kategori",
          headers: ["Kategori", "Alokasi", "Terpakai", "Sisa"],
          rows: [
            ...categories.map((category) => {
              const spent = categoryTotals.get(category._id)?.spent ?? 0;
              return [
                category.name,
                formatRupiah(category.allocated),
                formatRupiah(spent),
                formatRupiah(category.allocated - spent),
              ];
            }),
            [
              "TOTAL",
              formatRupiah(totalAllocated),
              formatRupiah(totalSpent),
              formatRupiah(totalAllocated - totalSpent),
            ],
          ],
        },
        ...(vendorExpenses.length > 0
          ? [
              {
                title: "Pembayaran vendor (total gabungan)",
                headers: ["Keterangan", "Total", "Status"],
                rows: [["Total pembayaran vendor", formatRupiah(vendorTotal), "Lunas"]],
              },
            ]
          : []),
        {
          title: "Rincian pengeluaran manual",
          headers: ["Keterangan", "Nominal", "Status"],
          rows: expenses
            .filter((expense) => expense.source === "manual")
            .map((expense) => [
              expense.label,
              formatRupiah(expense.amount),
              expense.paidAt ? "Lunas" : "Belum",
            ]),
        },
        {
          title: "Tabungan",
          lines: [
            `Tabungan terkumpul: ${formatRupiah(savingsTotal)}`,
            `Saldo kas setelah biaya (tabungan − terpakai): ${formatRupiah(sisaDana)}`,
          ],
        },
      ],
    );
  };

  if (budget === undefined) return <PageSkeleton />;

  const sisaAnggaranLabel =
    sisaAnggaran < 0
      ? `Lewat ${formatRupiah(-sisaAnggaran)}`
      : formatRupiah(sisaAnggaran);

  return (
    <div className="sj-document-page sj-budget-page space-y-5">
      <PageHeading
        kicker="Buku kas"
        title="Anggaran pernikahan"
        summary={
          <>
            <strong className="num font-medium text-[var(--ink)]">{formatRupiah(totalSpent)}</strong>{" "}
            terpakai dari alokasi <strong className="num font-medium text-[var(--ink)]">{formatRupiah(totalAllocated)}</strong>{" "}
            di {categories.length} kategori; {formatRupiah(totalPaid)} sudah lunas ke vendor.
          </>
        }
        action={
          <>
            <Button className="rounded-xl" onClick={openNewExpense}>
              <Plus className="size-4" /> Catat pengeluaran
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setCategoryDialog({ id: null, name: "", allocated: "" })}
            >
              Kategori
            </Button>
            {categories.length > 0 && (
              <Button
                variant="ghost"
                className="rounded-xl"
                onClick={() => setCategoryManagerOpen(true)}
              >
                Kelola
              </Button>
            )}
          </>
        }
      />

      <section className="sj-paper-sheet p-5 sm:p-6" aria-label="Ringkasan buku kas">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div className="min-w-0">
            <p className="text-sm text-[var(--ink-soft)]">Sudah terpakai</p>
            <p className="figure-xl mt-1 text-[var(--ink)]">{formatRupiah(totalSpent)}</p>
            <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-[var(--ink-soft)]">
              {spentPct}% dari alokasi. {formatRupiah(totalPaid)} sudah dibayar ke vendor,{" "}
              {formatRupiah(belumDibayar)} masih tercatat belum dibayar.
            </p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-sm text-[var(--ink-soft)]">Sisa anggaran</p>
            <p
              className={cn(
                "num mt-1 text-2xl font-semibold leading-none",
                sisaAnggaran < 0 ? "text-[var(--danger)]" : "text-[var(--ink)]",
              )}
            >
              {sisaAnggaranLabel}
            </p>
            <p className="mt-1 text-[0.8125rem] text-[var(--ink-soft)]">
              Alokasi dikurangi yang terpakai
            </p>
          </div>
        </div>

        <StackBar
          className="mt-5 h-3"
          label={`Komposisi anggaran: ${formatRupiah(totalPaid)} terbayar, ${formatRupiah(belumDibayar)} belum dibayar, ${formatRupiah(Math.max(0, sisaAnggaran))} belum dialokasikan`}
          segments={[
            { label: "Terbayar", value: totalPaid, tone: "brand", title: `Terbayar ${formatRupiah(totalPaid)}` },
            { label: "Belum dibayar", value: belumDibayar, tone: "accent", title: `Belum dibayar ${formatRupiah(belumDibayar)}` },
            {
              label: "Belum dialokasikan",
              value: Math.max(0, sisaAnggaran),
              tone: "sunk",
              title: `Belum dialokasikan ${formatRupiah(Math.max(0, sisaAnggaran))}`,
            },
          ]}
        />
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] text-[var(--ink-soft)]">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full bg-[var(--brand)]" /> Terbayar
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full bg-[var(--accent)]" /> Belum dibayar
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full bg-[var(--paper-sunk)] ring-1 ring-[var(--line)]" /> Belum dialokasikan
          </span>
        </p>

        <dl className="mt-5 grid gap-x-10 gap-y-2.5 sm:grid-cols-2">
          <LedgerFigure label="Alokasi total" value={formatRupiah(totalAllocated)} />
          <LedgerFigure label="Sudah terpakai" value={formatRupiah(totalSpent)} />
          <LedgerFigure label="Sudah lunas ke vendor" value={formatRupiah(totalPaid)} />
          <LedgerFigure
            label="Belum dibayar"
            value={formatRupiah(belumDibayar)}
            hint="Bagian terpakai yang belum lunas"
          />
          <LedgerFigure
            label="Tabungan tercatat"
            value={formatRupiah(savingsTotal)}
            hint="Setoran yang sudah masuk"
          />
          <LedgerFigure
            label="Saldo kas"
            value={
              saldoKas < 0 ? `−${formatRupiah(-saldoKas)}` : formatRupiah(saldoKas)
            }
            hint="Tabungan dikurangi yang terpakai"
          />
        </dl>
        <div className="sj-double-rule mt-4 flex items-baseline justify-between gap-3 pt-2">
          <span className="text-sm font-medium text-[var(--ink)]">Total alokasi</span>
          <span className="num text-base font-semibold text-[var(--ink)]">
            {formatRupiah(totalAllocated)}
          </span>
        </div>
        {isOver && (
          <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-[var(--danger)]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Pengeluaran melewati alokasi{" "}
            {formatRupiah(Math.abs(sisaAnggaran))}. Kurangi kategori atau naikkan alokasinya.
          </p>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Tampilan buku kas"
          value={chartTab}
          onChange={setChartTab}
          className="max-w-[15rem]"
          options={[
            { value: "ikhtisar", label: "Ikhtisar" },
            { value: "tren", label: "Tren" },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11 rounded-xl" onClick={exportCsv}>
            <FileDown className="size-4" /> CSV
          </Button>
          <Button variant="outline" className="min-h-11 rounded-xl" onClick={exportPdf}>
            <FileText className="size-4" /> PDF
          </Button>
        </div>
      </div>

      {chartTab === "ikhtisar" ? (
        <section className="sj-paper-sheet p-5" aria-label="Komposisi pengeluaran">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--line)] pb-2">
            <h2 className="display-serif text-xl text-[var(--ink)]">Komposisi pengeluaran</h2>
            <span className="text-sm text-[var(--ink-soft)]">
              Total <span className="num text-[var(--ink)]">{formatRupiah(totalSpent)}</span>
            </span>
          </div>
          {compositionRows.length === 0 ? (
            <div className="pt-4">
              <p className="max-w-[55ch] text-sm leading-relaxed text-[var(--ink-soft)]">
                Belum ada pengeluaran tercatat. Catat yang pertama supaya komposisinya terbaca.
              </p>
              <button
                type="button"
                onClick={openNewExpense}
                className="mt-2 min-h-11 text-sm font-medium text-[var(--brand)] underline underline-offset-4"
              >
                Catat pengeluaran
              </button>
            </div>
          ) : (
            <ul className="mt-1">
              {compositionRows.map((row, index) => {
                const categoryId = row.categoryId;
                const active = categoryId ? filterCategoryId === categoryId : false;
                const share = totalSpent > 0 ? Math.round((row.value / totalSpent) * 100) : 0;
                const body = (
                  <>
                    <span className="flex w-full items-baseline gap-2">
                      <span className="truncate text-sm text-[var(--ink)] sm:text-base">{row.name}</span>
                      <span aria-hidden className="sj-dot-leader" />
                      <span className="num shrink-0 text-sm text-[var(--ink)]">{formatRupiah(row.value)}</span>
                      <span className="num w-10 shrink-0 text-right text-[0.8125rem] text-[var(--ink-soft)]">
                        {share}%
                      </span>
                    </span>
                    <span aria-hidden className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-[var(--paper-sunk)]">
                      <span
                        className="block h-full origin-left rounded-full bg-[var(--brand)] transition-transform duration-500"
                        style={{ transform: `scaleX(${Math.min(1, Math.max(0, share / 100))})` }}
                      />
                    </span>
                  </>
                );
                return (
                  <li key={`${row.name}-${index}`} className="sj-ledger-row">
                    {categoryId ? (
                      <button
                        type="button"
                        aria-pressed={active}
                        title={`Saring pengeluaran ${row.name}`}
                        onClick={() => toggleFilter(categoryId)}
                        className={cn(
                          "flex min-h-12 w-full flex-col justify-center px-1 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
                          active && "text-[var(--brand)]",
                        )}
                      >
                        {body}
                      </button>
                    ) : (
                      <div className="flex min-h-12 flex-col justify-center px-1 py-2.5">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <section className="sj-paper-sheet p-5" aria-label="Tren pengeluaran">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--line)] pb-2">
            <h2 className="display-serif text-xl text-[var(--ink)]">Tren pengeluaran</h2>
            <span className="text-sm text-[var(--ink-soft)]">
              {trendData.length > 0 ? `${trendData.length} bulan tercatat` : "belum ada data"}
            </span>
          </div>
          {trendData.length < 3 ? (
            <div className="pt-4">
              <p className="max-w-[55ch] text-sm leading-relaxed text-[var(--ink-soft)]">
                Tren bulanan baru terbaca setelah tiga bulan pengeluaran. Sejauh ini{" "}
                {trendData.length} bulan terisi — tambahkan catatan berikutnya agar garisnya bermakna.
              </p>
              <button
                type="button"
                onClick={openNewExpense}
                className="mt-2 min-h-11 text-sm font-medium text-[var(--brand)] underline underline-offset-4"
              >
                Catat pengeluaran
              </button>
            </div>
          ) : (
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={trendData}
                  margin={{ top: 8, right: 4, bottom: 0, left: -18 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--line)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "var(--ink-soft)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value: number | string) => formatRupiahShort(Number(value))}
                    tick={{ fontSize: 11, fill: "var(--ink-soft)" }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip
                    content={<ChartTip format={formatRupiah} />}
                    cursor={{ fill: "color-mix(in srgb, var(--brand) 8%, transparent)" }}
                  />
                  <Bar
                    dataKey="baru"
                    name="Bulan itu"
                    fill="var(--accent)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                  />
                  <Line
                    type="monotone"
                    dataKey="kumulatif"
                    name="Kumulatif"
                    stroke="var(--brand)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "var(--brand)" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      )}

      <section className="space-y-3" aria-label="Daftar pengeluaran">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-soft)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari pengeluaran atau kategori"
              className="min-h-11 pl-9 pr-11"
              aria-label="Cari pengeluaran"
            />
            {query !== "" && (
              <button
                type="button"
                aria-label="Bersihkan pencarian"
                onClick={() => setQuery("")}
                className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--ink-soft)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {filterCategory && (
            <button
              type="button"
              onClick={() => setFilterCategoryId(null)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--paper-sunk)] px-3 text-sm text-[var(--ink)] transition-colors hover:border-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            >
              Kategori: {filterCategory.name} <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-3 border-b border-[var(--line)] pb-1.5 text-[0.8125rem] text-[var(--ink-soft)]">
          <span>Keterangan</span>
          <span className="num">Nominal</span>
        </div>

        <Stagger>
          {visibleManualExpenses.map((expense) => {
            const category = categoryById.get(expense.categoryId);
            const rowDate = expense.createdAt ?? expense.paidAt;
            return (
              <StaggerItem key={expense._id}>
                <section className="sj-ledger-row flex flex-wrap items-center gap-x-3 gap-y-2 px-1 py-3 sm:flex-nowrap">
                  <button
                    type="button"
                    aria-label={expense.paidAt ? "Tandai belum lunas" : "Tandai lunas"}
                    aria-pressed={Boolean(expense.paidAt)}
                    onClick={() => {
                      togglePaid({ expenseId: expense._id, paid: !expense.paidAt });
                      if (!expense.paidAt) bloom();
                    }}
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-lg border transition-transform active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
                      expense.paidAt
                        ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--paper)]"
                        : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink-soft)] hover:border-[var(--brand)] hover:text-[var(--brand)]",
                    )}
                  >
                    <Check className="size-4" weight="bold" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm font-medium sm:text-base",
                        expense.paidAt ? "text-[var(--ink-soft)] line-through decoration-[var(--line)]" : "text-[var(--ink)]",
                      )}
                    >
                      {expense.label}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.8125rem] text-[var(--ink-soft)]">
                      <span>{category?.name ?? "Kategori dihapus"}</span>
                      {rowDate ? <span className="num">{formatDateShortID(rowDate)}</span> : null}
                    </p>
                  </div>

                  <div className="ml-auto shrink-0 text-right">
                    <p className="num text-sm font-semibold text-[var(--ink)] sm:text-base">
                      {formatRupiah(expense.amount)}
                    </p>
                    <p
                      className={cn(
                        "text-[0.8125rem]",
                        expense.paidAt ? "text-[var(--brand)]" : "text-[var(--accent)]",
                      )}
                    >
                      {expense.paidAt ? "Lunas" : "Belum dibayar"}
                    </p>
                  </div>

                  <RowMenu
                    onEdit={() => openEditExpense(expense)}
                    onDelete={() => {
                      void deleteBudgetItem(
                        `"${expense.label}" dihapus.`,
                        () => deleteExpense({ expenseId: expense._id }),
                        () =>
                          addExpense({
                            categoryId: expense.categoryId,
                            label: expense.label,
                            amount: expense.amount,
                            paid: Boolean(expense.paidAt),
                          }),
                        { successMessage: "Pengeluaran dipulihkan." },
                      );
                    }}
                    deleteTitle={`Hapus "${expense.label}"?`}
                  />
                </section>
              </StaggerItem>
            );
          })}

          {vendorVisible && (
            <StaggerItem key="vendor-group">
              <section className="sj-ledger-row flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-1 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--ink)] sm:text-base">
                    Pembayaran vendor
                  </p>
                  <p className="mt-0.5 text-[0.8125rem] text-[var(--ink-soft)]">
                    {vendorExpenses.length} pembayaran sudah tercatat
                  </p>
                </div>
                <span className="num shrink-0 text-sm font-semibold text-[var(--ink)] sm:text-base">
                  {formatRupiah(vendorTotal)}
                </span>
              </section>
            </StaggerItem>
          )}
        </Stagger>
      </section>

      {budget !== undefined &&
        (categories.length > 0 || term !== "") &&
        !vendorVisible &&
        visibleManualExpenses.length === 0 && (
          <EmptyState
            emoji={term ? "🔍" : "🧾"}
            title={term ? "Tidak ada yang cocok" : "Belum ada pengeluaran"}
            description={term ? "Coba ubah kata kunci atau hapus filter kategori." : "Catat pengeluaran agar mudah memantau anggaran."}
            actionLabel={!term ? "Catat pengeluaran" : undefined}
            onAction={!term ? openNewExpense : undefined}
          />
        )}

      {budget !== undefined &&
        categories.length === 0 &&
        expenses.length === 0 &&
        term === "" && (
        <EmptyState
          emoji="💸"
          title="Belum ada kategori"
          description="Buat kategori pengeluaran pertama untuk mulai mencatat anggaran."
          actionLabel="Buat kategori"
          onAction={() => setCategoryDialog({ id: null, name: "", allocated: "" })}
        />
      )}

      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="max-w-sm rounded-2xl border-[var(--line)] bg-[var(--paper)] shadow-[var(--elev-lifted)]">
          <DialogHeader>
            <DialogTitle>{expenseForm.id ? "Ubah pengeluaran" : "Pengeluaran baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-label">Keterangan</Label>
              <Input
                id="exp-label"
                value={expenseForm.label}
                onChange={(event) =>
                  setExpenseForm((previous) => ({ ...previous, label: event.target.value }))
                }
                placeholder="cth. DP katering"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Nominal (Rp)</Label>
              <MoneyInput
                id="exp-amount"
                  value={expenseForm.amount}
                  onChange={(amount) => setExpenseForm((previous) => ({ ...previous, amount }))}
                  placeholder="1.500.000"
                />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-category">Kategori</Label>
              <Select
                value={expenseForm.categoryId || undefined}
                onValueChange={(value) =>
                  setExpenseForm((previous) => ({
                    ...previous,
                    categoryId: value === "new-category" ? "" : value,
                  }))
                }
              >
                <SelectTrigger
                  id="exp-category"
                  className="min-h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 text-sm transition-colors hover:border-[var(--brand)] focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                >
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-1.5 shadow-[var(--elev-lifted)]">
                  {categories.map((category) => (
                    <SelectItem
                      key={category._id}
                      value={category._id}
                      className="rounded-lg py-2 focus:bg-accent focus:text-accent-foreground"
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value="new-category"
                    className="mt-1 rounded-lg border-t border-border py-2 text-primary focus:bg-accent focus:text-accent-foreground"
                  >
                    + Kategori baru…
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {expenseForm.categoryId === "" && (
              <div className="space-y-1.5">
                <Label htmlFor="exp-new-category">Nama kategori baru</Label>
                <Input
                  id="exp-new-category"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="cth. Mahar"
                />
              </div>
            )}
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-[var(--ink)]">
              <input
                type="checkbox"
                checked={expenseForm.paid}
                onChange={(event) =>
                  setExpenseForm((previous) => ({ ...previous, paid: event.target.checked }))
                }
                className="size-5 rounded-[4px] accent-[var(--brand)]"
              />
              Sudah dibayar
            </label>
          </div>
          <DialogFooter>
            <Button onClick={submitExpense} disabled={busy} className="w-full rounded-2xl">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryManagerOpen} onOpenChange={setCategoryManagerOpen}>
        <DialogContent className="max-w-sm rounded-2xl border-[var(--line)] bg-[var(--paper)] shadow-[var(--elev-lifted)]">
          <DialogHeader>
            <DialogTitle>Kelola kategori</DialogTitle>
          </DialogHeader>
          <ul className="divide-y divide-border">
            {categories.map((category) => (
              <li key={category._id} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {category.name}
                </span>
                <RowMenu
                  onEdit={() => {
                    setCategoryManagerOpen(false);
                    setCategoryDialog({
                      id: category._id,
                      name: category.name,
                      allocated: String(category.allocated),
                    });
                  }}
                  onDelete={() => removeCategory(category)}
                  deleteTitle={`Hapus kategori "${category.name}"?`}
                  deleteDescription="Semua pengeluaran di dalamnya juga akan terhapus."
                />
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog
        open={categoryDialog !== null}
        onOpenChange={(open) => !open && setCategoryDialog(null)}
      >
        <DialogContent className="max-w-sm rounded-2xl border-[var(--line)] bg-[var(--paper)] shadow-[var(--elev-lifted)]">
          <DialogHeader>
            <DialogTitle>
              {categoryDialog?.id ? "Ubah kategori" : "Kategori baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Nama kategori</Label>
              <Input
                id="cat-name"
                value={categoryDialog?.name ?? ""}
                onChange={(event) =>
                  setCategoryDialog((previous) =>
                    previous ? { ...previous, name: event.target.value } : previous,
                  )
                }
                placeholder="cth. Venue"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-alloc">Alokasi (Rp)</Label>
              <MoneyInput
                id="cat-alloc"
                  value={categoryDialog?.allocated ?? ""}
                  onChange={(allocated) => setCategoryDialog((previous) => previous ? { ...previous, allocated } : previous)}
                  placeholder="5.000.000"
                />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitCategory} disabled={busy} className="w-full rounded-2xl">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
