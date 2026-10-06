import {
  CHART_COLORS as DONUT_COLORS,
  ChartCard,
  ChartTip,
} from "@/components/Charts";
import { EmptyState, PageSkeleton, RowMenu, Stagger, StaggerItem } from "@/components/Shared";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { formatRupiah, formatRupiahShort } from "@/lib/format";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  Wallet,
  X,
} from "lucide-react";
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
  const renameCategory = useMutation(api.budget.renameCategory);
  const setCategoryAllocation = useMutation(api.budget.setCategoryAllocation);
  const deleteCategory = useMutation(api.budget.deleteCategory);
  const addExpense = useMutation(api.budget.addExpense);
  const updateExpense = useMutation(api.budget.updateExpense);
  const togglePaid = useMutation(api.budget.toggleExpensePaid);
  const deleteExpense = useMutation(api.budget.deleteExpense);

  const categories = budget?.categories ?? [];
  const expenses = budget?.expenses ?? [];

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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [chartTab, setChartTab] = useState<"ikhtisar" | "tren">("ikhtisar");
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);

  const [categoryDialog, setCategoryDialog] = useState<{
    id: CategoryId | null;
    name: string;
    allocated: string;
  } | null>(null);

  const totalAllocated = categories.reduce((sum, category) => sum + category.allocated, 0);
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalPaid = expenses
    .filter((expense) => expense.paidAt)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const spentPct =
    totalAllocated > 0 ? Math.min(100, Math.round((totalSpent / totalAllocated) * 100)) : 0;
  const isOver = totalSpent > totalAllocated;

  // Donut komposisi alokasi per kategori (maks. 6 irisan + "Lainnya").
  const donutRaw = categories
    .map((category) => ({ name: category.name, value: Math.max(0, category.allocated) }))
    .filter((row) => row.value > 0);
  const donutTop = donutRaw.slice(0, 6);
  const donutRest = donutRaw.slice(6).reduce((sum, row) => sum + row.value, 0);
  const donutData =
    donutRest > 0 ? [...donutTop, { name: "Lainnya", value: donutRest }] : donutTop;
  const donutLegend = donutData.map((row, index) => ({
    ...row,
    color: DONUT_COLORS[index % DONUT_COLORS.length],
  }));

  // Tren bulanan: total per bulan + garis kumulatif (manual & bayaran vendor).
  const MONTH_LABELS = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  const byMonth = new Map<string, number>();
  for (const expense of expenses) {
    const ts =
      ("_creationTime" in expense ? expense._creationTime : 0) ||
      expense.paidAt ||
      0;
    if (!ts) continue;
    const date = new Date(ts);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + expense.amount);
  }
  const sortedMonthKeys = [...byMonth.keys()].sort();
  const trendData = sortedMonthKeys.map((key, index) => {
    const baru = byMonth.get(key) ?? 0;
    const kumulatif = sortedMonthKeys
      .slice(0, index + 1)
      .reduce((sum, monthKey) => sum + (byMonth.get(monthKey) ?? 0), 0);
    const monthIndex = Number(key.slice(5)) - 1;
    return {
      month: MONTH_LABELS[monthIndex] ?? key,
      baru,
      kumulatif,
    };
  });

  // Batang per kategori: alokasi vs terbayar (klik → filter daftar).
  const categoryBarData = categories.map((category) => ({
    id: category._id as string,
    name: category.name,
    alokasi: Math.max(0, category.allocated),
    terbayar: expenses
      .filter((expense) => expense.categoryId === category._id)
      .reduce((sum, expense) => sum + expense.amount, 0),
  }));

  const filterCategory =
    categories.find((category) => category._id === filterCategoryId) ?? null;
  const visibleCategories = filterCategory
    ? categories.filter((category) => category._id === filterCategory._id)
    : categories;

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
    if (!expenseForm.label.trim() || !value) {
      toast.error("Isi keterangan dan nominal dulu, ya.");
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

  const submitCategory = async () => {
    if (!categoryDialog) return;
    setBusy(true);
    try {
      if (categoryDialog.id) {
        await renameCategory({ categoryId: categoryDialog.id, name: categoryDialog.name });
        await setCategoryAllocation({
          categoryId: categoryDialog.id,
          allocated: Number(categoryDialog.allocated) || 0,
        });
        toast.success("Kategori diperbarui.");
      } else {
        await createCategory({
          name: categoryDialog.name,
          allocated: Number(categoryDialog.allocated) || 0,
        });
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
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-tint-sage">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isOver ? "bg-destructive" : "fill-botanical"
            }`}
            style={{ width: `${spentPct}%` }}
          />
        </div>
        <div className="relative mt-2 flex items-center gap-1.5">
          <p className="num meta font-bold">{spentPct}% terpakai</p>
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
            <dt>Sisa</dt>
            <dd>{formatRupiahShort(Math.max(0, totalAllocated - totalSpent))}</dd>
          </div>
        </dl>
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

      {/* Donut komposisi alokasi — klik irisan untuk filter daftar */}
      {chartTab === "ikhtisar" && donutData.length > 0 && (
        <section className="clay p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="h-card">Komposisi alokasi</h2>
            <span className="meta">{donutRaw.length} kategori</span>
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
                      const category = categories.find(
                        (item) => item.name === entry.name,
                      );
                      return (
                        <Cell
                          key={entry.name}
                          fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                          className="cursor-pointer"
                          onClick={
                            category
                              ? () =>
                                  setFilterCategoryId((previous) =>
                                    previous === category._id
                                      ? null
                                      : category._id,
                                  )
                              : undefined
                          }
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Alokasi
                </span>
                <span className="num text-[11px] font-extrabold">
                  {formatRupiahShort(totalAllocated)}
                </span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-1.5">
              {donutLegend.map((row) => (
                <li key={row.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {row.name}
                  </span>
                  <span className="num shrink-0 font-bold text-muted-foreground">
                    {formatRupiahShort(row.value)}
                  </span>
                </li>
              ))}
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
                    stroke="rgba(66,90,73,0.12)"
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
                    cursor={{ fill: "rgba(66,90,73,0.06)" }}
                  />
                  <Bar
                    dataKey="baru"
                    name="Bulan itu"
                    fill="#8fa694"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="kumulatif"
                    name="Kumulatif"
                    stroke="#775a19"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#775a19" }}
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
                  stroke="rgba(66,90,73,0.12)"
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
                  fill="#d3e8d4"
                  radius={[0, 4, 4, 0]}
                  barSize={9}
                />
                <Bar
                  dataKey="terbayar"
                  name="Terbayar"
                  fill="#425a49"
                  radius={[0, 4, 4, 0]}
                  barSize={9}
                >
                  {categoryBarData.map((row) => (
                    <Cell
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() =>
                        setFilterCategoryId((previous) =>
                          previous === row.id ? null : row.id,
                        )
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <div className="flex gap-2">
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

      <Stagger className="space-y-3">
        {visibleCategories.map((category) => {
          const categoryExpenses = expenses.filter(
            (expense) => expense.categoryId === category._id,
          );
          const spent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
          const over = spent > category.allocated;
          const pct =
            category.allocated > 0
              ? Math.min(100, Math.round((spent / category.allocated) * 100))
              : 0;
          const open = !collapsed[category._id];

          return (
            <StaggerItem key={category._id}>
              <Collapsible
                open={open}
                onOpenChange={(value) =>
                  setCollapsed((previous) => ({
                    ...previous,
                    [category._id]: !value,
                  }))
                }
              >
                <section className="clay overflow-hidden">
                  <div className="flex items-center gap-1 px-3 py-2.5">
                    <CollapsibleTrigger className="group flex min-w-0 flex-1 items-center gap-2 py-1 text-left">
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-0 group-data-[state=closed]:-rotate-90" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold">{category.name}</p>
                        <p className="num meta">
                          {formatRupiahShort(spent)} / {formatRupiahShort(category.allocated)}
                          {over ? " · melebihi!" : ` · sisa ${formatRupiahShort(category.allocated - spent)}`}
                        </p>
                      </div>
                      <span
                        className={`num shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                          over
                            ? "bg-destructive/10 text-destructive"
                            : "bg-tint-mint text-tint-mint-foreground"
                        }`}
                      >
                        {pct}%
                      </span>
                    </CollapsibleTrigger>
                    <RowMenu
                      onEdit={() =>
                        setCategoryDialog({
                          id: category._id,
                          name: category.name,
                          allocated: String(category.allocated),
                        })
                      }
                      onDelete={() => {
                        deleteCategory({ categoryId: category._id });
                        toast.success("Kategori dihapus.");
                      }}
                      deleteTitle={`Hapus kategori "${category.name}"?`}
                      deleteDescription="Semua pengeluaran di dalamnya juga akan terhapus."
                    />
                  </div>
                  <div className="mx-4 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        over ? "bg-destructive" : "fill-botanical"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <CollapsibleContent>
                    <ul className="divide-y divide-border">
                      {categoryExpenses.map((expense) =>
                        expense.source === "vendor" ? (
                          /* Turunan dari halaman Vendor: selalu terbayar, tanpa aksi edit/hapus. */
                          <li
                            key={expense.vendorId}
                            className="flex items-center gap-2.5 px-4 py-2.5"
                          >
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="size-3" />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {expense.label}
                            </span>
                            <span className="chip shrink-0 bg-tint-peach text-tint-peach-foreground">
                              Vendor
                            </span>
                            <span className="num text-sm font-bold">
                              {formatRupiah(expense.amount)}
                            </span>
                          </li>
                        ) : (
                          <li key={expense._id} className="flex items-center gap-2.5 px-4 py-2.5">
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
                            <span
                              className={`min-w-0 flex-1 truncate text-sm ${
                                expense.paidAt ? "text-muted-foreground" : ""
                              }`}
                            >
                              {expense.label}
                            </span>
                            <span className="num text-sm font-bold">
                              {formatRupiah(expense.amount)}
                            </span>
                            <RowMenu
                              onEdit={() => openEditExpense(expense)}
                              onDelete={() => deleteExpense({ expenseId: expense._id })}
                              deleteTitle={`Hapus "${expense.label}"?`}
                            />
                          </li>
                        ),
                      )}
                      {categoryExpenses.length === 0 && (
                        <li className="px-4 py-2.5 text-xs text-muted-foreground">
                          Belum ada pengeluaran di kategori ini.
                        </li>
                      )}
                    </ul>
                  </CollapsibleContent>
                </section>
              </Collapsible>
            </StaggerItem>
          );
        })}
      </Stagger>

      {budget !== undefined && categories.length === 0 && (
        <EmptyState
          emoji="💸"
          title="Belum ada kategori"
          description="Pecah anggaran pernikahan jadi kategori kecil biar gampang diatur."
          actionLabel="Catat pengeluaran"
          onAction={openNewExpense}
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
              <div className="relative">
                <select
                  id="exp-category"
                  value={expenseForm.categoryId}
                  onChange={(event) =>
                    setExpenseForm((previous) => ({
                      ...previous,
                      categoryId: event.target.value,
                    }))
                  }
                  className="h-9 w-full appearance-none rounded-xl border border-transparent bg-popover px-3 pr-9 text-sm"
                >
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                  <option value="">+ Kategori baru…</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
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
