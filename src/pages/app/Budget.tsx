import { FlowerMark } from "@/components/Decor";
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
import { formatRupiah, formatRupiahShort } from "@/lib/format";
import {
  Check,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
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

  return (
    <div className="space-y-4">
      <section className="clay grad-mint relative overflow-hidden p-5 text-tint-mint-foreground">
        <FlowerMark className="float-slow pointer-events-none absolute -right-3 -top-3 size-20 opacity-25" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h1 className="h-page">Budget</h1>
            <p className="meta">
              Terpakai {formatRupiahShort(totalSpent)} dari{" "}
              {formatRupiahShort(totalAllocated)}
            </p>
          </div>
          <div className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-white/70">
            <Wallet className="size-5" />
          </div>
        </div>
        <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-white/70">
          <div
            className={`h-full rounded-full transition-all ${
              totalSpent > totalAllocated
                ? "bg-destructive"
                : "bg-tint-mint-foreground/70"
            }`}
            style={{ width: `${spentPct}%` }}
          />
        </div>
        <dl className="relative mt-3 grid grid-cols-3 gap-2">
          <div className="stat-tile bg-white/70">
            <dt>Terpakai</dt>
            <dd>{formatRupiahShort(totalSpent)}</dd>
          </div>
          <div className="stat-tile bg-white/70">
            <dt>Lunas</dt>
            <dd>{formatRupiahShort(totalPaid)}</dd>
          </div>
          <div className="stat-tile bg-white/70">
            <dt>Sisa</dt>
            <dd>{formatRupiahShort(Math.max(0, totalAllocated - totalSpent))}</dd>
          </div>
        </dl>
      </section>

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

      {categories.map((category) => {
        const categoryExpenses = expenses.filter(
          (expense) => expense.categoryId === category._id,
        );
        const spent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const over = spent > category.allocated;
        const pct =
          category.allocated > 0
            ? Math.min(100, Math.round((spent / category.allocated) * 100))
            : 0;

        return (
          <section key={category._id} className="clay overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">{category.name}</p>
                <p className="num meta">
                  {formatRupiahShort(spent)} / {formatRupiahShort(category.allocated)}
                  {over ? " · melebihi alokasi" : ` · sisa ${formatRupiahShort(category.allocated - spent)}`}
                </p>
              </div>
              <button
                type="button"
                aria-label="Ubah kategori"
                className="text-muted-foreground hover:text-primary"
                onClick={() =>
                  setCategoryDialog({
                    id: category._id,
                    name: category.name,
                    allocated: String(category.allocated),
                  })
                }
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Hapus kategori"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (confirm(`Hapus kategori "${category.name}" beserta pengeluarannya?`)) {
                    deleteCategory({ categoryId: category._id });
                    toast.success("Kategori dihapus.");
                  }
                }}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="h-1.5 bg-muted">
              <div
                className={`h-full ${over ? "bg-destructive" : "bg-tint-mint-foreground/60"}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <ul className="divide-y divide-border">
              {categoryExpenses.map((expense) => (
                <li key={expense._id} className="flex items-center gap-3 px-4 py-2.5">
                  <button
                    type="button"
                    aria-label={expense.paidAt ? "Tandai belum lunas" : "Tandai lunas"}
                    onClick={() => {
                      togglePaid({ expenseId: expense._id, paid: !expense.paidAt });
                      if (!expense.paidAt) bloom();
                    }}
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
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
                  <button
                    type="button"
                    aria-label="Ubah pengeluaran"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => openEditExpense(expense)}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Hapus pengeluaran"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteExpense({ expenseId: expense._id })}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
              {categoryExpenses.length === 0 && (
                <li className="px-4 py-2.5 text-xs text-muted-foreground">
                  Belum ada pengeluaran di kategori ini.
                </li>
              )}
            </ul>
          </section>
        );
      })}

      {budget !== undefined && categories.length === 0 && (
        <p className="clay-inset flex h-24 items-center justify-center rounded-3xl text-xs text-muted-foreground">
          Belum ada kategori. Buat kategori pertama kalian.
        </p>
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
