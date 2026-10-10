import {
  CHART_COLORS as DONUT_COLORS,
  ChartCard,
  ChartTip,
} from "@/components/Charts";
import { EmptyState, PageSkeleton, RowMenu, Stagger, StaggerItem } from "@/components/Shared";
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
  Wallet,
  X,
} from "@/lib/icons";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
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

  // Donut komposisi pengeluaran — pengeluaran per kategori + irisan "Vendor"
  // tersendiri. `categoryId` ikut dibawa supaya klik-filter tidak mengandalkan
  // nama (aman untuk kategori kembar). Maks. 6 irisan + "Lainnya".
  type DonutRow = { name: string; value: number; categoryId?: string };
  const donutRaw: DonutRow[] = categories
    .map((category) => ({
      name: category.name,
      value: categoryTotals.get(category._id)?.spent ?? 0,
      categoryId: category._id as string,
    }))
    .filter((row) => row.value > 0);
  if (vendorTotal > 0) {
    donutRaw.push({ name: "Vendor", value: vendorTotal });
  }
  donutRaw.sort((a, b) => b.value - a.value);
  const donutTop = donutRaw.slice(0, 6);
  const donutRest = donutRaw.slice(6).reduce((sum, row) => sum + row.value, 0);
  const donutData: DonutRow[] =
    donutRest > 0 ? [...donutTop, { name: "Lainnya", value: donutRest }] : donutTop;
  const donutLegend = donutData.map((row, index) => ({
    ...row,
    color: DONUT_COLORS[index % DONUT_COLORS.length],
  }));

  // Batang per kategori: alokasi vs terbayar (klik → filter daftar).
  // Terbayar = pengeluaran manual kategori itu saja; pembayaran vendor tidak
  // lagi dijumlahkan ke setiap kategori (dulu terhitung berkali-kali), melainkan
  // tampil sebagai batang "Vendor" tersendiri tanpa alokasi.
  const categoryBarData = categories.map((category) => ({
    id: category._id as string,
    name: category.name,
    alokasi: Math.max(0, category.allocated),
    terbayar: categoryTotals.get(category._id)?.paid ?? 0,
  }));
  if (vendorTotal > 0) {
    categoryBarData.push({
      id: "vendor",
      name: "Vendor",
      alokasi: 0,
      terbayar: vendorTotal,
    });
  }

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

  /** Toggle filter kategori dari donut/batang grafik (baris Vendor diabaikan). */
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
            `Sisa dana (tabungan − terpakai): ${formatRupiah(sisaDana)}`,
          ],
        },
      ],
    );
  };

  if (budget === undefined) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <section className="clay p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label text-muted-foreground">Ikhtisar anggaran</p>
            <p className="meta mt-1">
              Terpakai {formatRupiahShort(totalSpent)} dari{" "}
              {formatRupiahShort(totalAllocated)}
            </p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-tint-mint text-tint-mint-foreground shadow-sm">
            <Wallet className="size-5" />
          </div>
        </div>
        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-mist-gray"
          role="progressbar"
          aria-label="Progres pengeluaran terhadap alokasi"
          aria-valuenow={Math.min(100, spentPct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isOver ? "bg-destructive" : "fill-botanical"
            }`}
            style={{ width: `${Math.min(100, spentPct)}%` }}
          />
        </div>
        <div className="relative mt-2 flex items-center gap-1.5">
          {isOver && (
            <span className="chip bg-destructive/90 text-white">
              <AlertTriangle className="size-3" /> Melebihi alokasi
            </span>
          )}
        </div>
        <dl className="relative mt-3 grid grid-cols-3 gap-2">
          <div className="stat-tile bg-secondary">
            <dt>Terpakai</dt>
            <dd>{formatRupiahShort(totalSpent)}</dd>
          </div>
          <div className="stat-tile bg-secondary">
            <dt>Lunas</dt>
            <dd>{formatRupiahShort(totalPaid)}</dd>
          </div>
          <div className="stat-tile bg-secondary">
            <dt>Sisa dana</dt>
            <dd className={sisaDana < 0 ? "text-destructive" : undefined}>
              {sisaDana < 0
                ? `−${formatRupiahShort(-sisaDana)}`
                : formatRupiahShort(sisaDana)}
            </dd>
          </div>
        </dl>
        <div className="mt-3 clay-sm rounded-xl p-3 bg-sky-tint">
          <p className="meta">Tabungan tercatat</p>
          <p className="num font-extrabold">{formatRupiahShort(savingsTotal)}</p>
          <p className="meta mt-0.5">Sisa dana = tabungan − terpakai</p>
        </div>
      </section>

      {/* Grafik: Ikhtisar (donut) | Tren (kumulatif + alokasi vs terbayar) */}
      <div className="flex gap-2" role="tablist" aria-label="Tampilan grafik budget">
        {(["ikhtisar", "tren"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={chartTab === tab}
            onClick={() => setChartTab(tab)}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition-all ${
              chartTab === tab
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "ikhtisar" ? "Ikhtisar" : "Tren"}
          </button>
        ))}
      </div>

      {/* Donut komposisi pengeluaran — klik irisan/legenda untuk filter daftar */}
      {chartTab === "ikhtisar" && donutData.length > 0 && (
        <section className="clay p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="h-card">Komposisi pengeluaran</h2>
            <span className="meta">{donutData.length} irisan</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative size-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={58}
                    paddingAngle={3}
                    cornerRadius={6}
                    strokeWidth={0}
                  >
                    {donutData.map((entry, index) => {
                      const categoryId = entry.categoryId;
                      return (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                          className={categoryId ? "cursor-pointer" : undefined}
                          onClick={
                            categoryId ? () => toggleFilter(categoryId) : undefined
                          }
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Terpakai
                </span>
                <span className="num text-[11px] font-extrabold">
                  {formatRupiahShort(totalSpent)}
                </span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-1">
              {donutLegend.map((row, index) => {
                const categoryId = row.categoryId;
                const active = categoryId
                  ? filterCategoryId === categoryId
                  : false;
                const dot = (
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                );
                const text = (
                  <>
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {row.name}
                    </span>
                    <span className="num shrink-0 font-bold text-muted-foreground">
                      {formatRupiahShort(row.value)}
                    </span>
                  </>
                );
                return (
                  <li key={`${row.name}-${index}`}>
                    {categoryId ? (
                      /* Legenda jadi tombol supaya filter bisa diakses keyboard. */
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleFilter(categoryId)}
                        className={`flex w-full items-center gap-2 rounded-xl px-2 py-1 text-xs transition-colors ${
                          active
                            ? "bg-tint-butter text-tint-butter-foreground"
                            : "hover:bg-secondary"
                        }`}
                      >
                        {dot}
                        {text}
                      </button>
                    ) : (
                      <span className="flex items-center gap-2 px-2 py-1 text-xs">
                        {dot}
                        {text}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {chartTab === "tren" && (
        <ChartCard
          title="Tren pengeluaran"
          meta={trendData.length > 0 ? `${trendData.length} bulan` : "belum ada data"}
        >
          {trendData.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Belum ada pengeluaran tercatat untuk tren.
            </p>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={trendData}
                  margin={{ top: 8, right: 4, bottom: 0, left: -18 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-fog)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value: number | string) => formatRupiahShort(Number(value))}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={58}
                  />
                  <Tooltip
                    content={<ChartTip format={formatRupiahShort} />}
                    cursor={{ fill: "var(--color-mist-gray)" }}
                  />
                  <Bar
                    dataKey="baru"
                    name="Bulan itu"
                    fill="var(--chart-3)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="kumulatif"
                    name="Kumulatif"
                    stroke="var(--chart-2)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "var(--chart-2)" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      )}

      {chartTab === "tren" && categoryBarData.length > 0 && (
        <ChartCard title="Alokasi vs terbayar" meta="Klik batang untuk filter daftar">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryBarData}
                layout="vertical"
                margin={{ top: 4, right: 8, bottom: 0, left: 4 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="var(--color-fog)"
                />
                <XAxis
                  type="number"
                  tickFormatter={(value: number | string) => formatRupiahShort(Number(value))}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={94}
                />
                <Tooltip content={<ChartTip format={formatRupiahShort} />} />
                <Bar
                  dataKey="alokasi"
                  name="Alokasi"
                  fill="var(--color-mist-gray)"
                  radius={[0, 4, 4, 0]}
                  barSize={9}
                >
                  {categoryBarData.map((row) => (
                    <Cell
                      key={`alokasi-${row.id}`}
                      className={
                        row.id === "vendor" ? undefined : "cursor-pointer"
                      }
                      onClick={() => toggleFilter(row.id)}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="terbayar"
                  name="Terbayar"
                  fill="var(--chart-1)"
                  radius={[0, 4, 4, 0]}
                  barSize={9}
                >
                  {categoryBarData.map((row) => (
                    <Cell
                      key={`terbayar-${row.id}`}
                      className={
                        row.id === "vendor" ? undefined : "cursor-pointer"
                      }
                      onClick={() => toggleFilter(row.id)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <div className="flex flex-wrap gap-2">
        <Button className="flex-1 rounded-2xl" onClick={openNewExpense}>
          <Plus className="size-4" /> Catat pengeluaran
        </Button>
        <Button
          variant="secondary"
          className="rounded-2xl"
          onClick={() => setCategoryDialog({ id: null, name: "", allocated: "" })}
        >
          Kategori
        </Button>
        {categories.length > 0 && (
          <Button
            variant="ghost"
            className="rounded-2xl"
            onClick={() => setCategoryManagerOpen(true)}
          >
            Kelola
          </Button>
        )}
        <Button
          variant="outline"
          className="rounded-2xl"
          onClick={exportCsv}
        >
          <FileDown className="size-4" /> CSV
        </Button>
        <Button
          variant="outline"
          className="rounded-2xl"
          onClick={exportPdf}
        >
          <FileText className="size-4" /> PDF
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari pengeluaran atau kategori"
          className="pl-9 pr-9"
          aria-label="Cari pengeluaran"
        />
        {query !== "" && (
          <button
            type="button"
            aria-label="Bersihkan pencarian"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {filterCategory && (
        <button
          type="button"
          onClick={() => setFilterCategoryId(null)}
          className="chip self-start bg-tint-butter text-tint-butter-foreground"
        >
          Filter: {filterCategory.name} <X className="size-3" />
        </button>
      )}

      <Stagger className="space-y-2">
        {visibleManualExpenses.map((expense) => {
          const category = categoryById.get(expense.categoryId);
          const rowDate = expense.createdAt ?? expense.paidAt;
          return (
            <StaggerItem key={expense._id}>
              <section className="clay flex items-center gap-2.5 px-3 py-2.5">
                <button
                  type="button"
                  aria-label={expense.paidAt ? "Tandai belum lunas" : "Tandai lunas"}
                  onClick={() => {
                    togglePaid({ expenseId: expense._id, paid: !expense.paidAt });
                    if (!expense.paidAt) bloom();
                  }}
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                    expense.paidAt
                      ? "bg-primary text-primary-foreground"
                      : "clay-inset text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Check className="size-3" />
                </button>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm ${expense.paidAt ? "text-muted-foreground" : ""}`}>
                    {expense.label}
                  </span>
                  <span className="meta mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px]">
                    <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
                      {category?.name ?? "Kategori dihapus"}
                    </span>
                    {rowDate ? <span>{formatDateShortID(rowDate)}</span> : null}
                  </span>
                </span>
                <span className="num shrink-0 text-sm font-bold">
                  {formatRupiah(expense.amount)}
                </span>
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
            <section className="clay flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Pembayaran vendor</p>
                <p className="meta text-[10px]">Total gabungan · {vendorExpenses.length} lunas</p>
              </div>
              <span className="num shrink-0 text-sm font-bold">
                {formatRupiahShort(vendorTotal)}
              </span>
            </section>
          </StaggerItem>
        )}
      </Stagger>

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
        <DialogContent className="max-w-sm">
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
              <Input
                id="exp-amount"
                type="number"
                min={0}
                step={50000}
                value={expenseForm.amount}
                onChange={(event) =>
                  setExpenseForm((previous) => ({ ...previous, amount: event.target.value }))
                }
                placeholder="1500000"
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
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm shadow-sm transition-colors hover:bg-secondary/50 focus-visible:border-ring focus-visible:ring-ring/30"
                >
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border bg-popover p-1.5 shadow-lg">
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
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={expenseForm.paid}
                onChange={(event) =>
                  setExpenseForm((previous) => ({ ...previous, paid: event.target.checked }))
                }
                className="size-4 accent-[var(--primary)]"
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
        <DialogContent className="max-w-sm">
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
        <DialogContent className="max-w-sm">
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
              <Input
                id="cat-alloc"
                type="number"
                min={0}
                step={500000}
                value={categoryDialog?.allocated ?? ""}
                onChange={(event) =>
                  setCategoryDialog((previous) =>
                    previous ? { ...previous, allocated: event.target.value } : previous,
                  )
                }
                placeholder="5000000"
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
