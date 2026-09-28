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
import { formatRupiah } from "@/lib/format";
import { bloom } from "@/lib/bloom";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

/** Budget page: allocation per category with expense tracking. */
export function BudgetPage() {
  const budget = useQuery(api.budget.overview);
  const createCategory = useMutation(api.budget.createCategory);
  const addExpense = useMutation(api.budget.addExpense);
  const togglePaid = useMutation(api.budget.toggleExpensePaid);
  const deleteExpense = useMutation(api.budget.deleteExpense);
  const deleteCategory = useMutation(api.budget.deleteCategory);

  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryAlloc, setNewCategoryAlloc] = useState("");
  const [creating, setCreating] = useState(false);

  const [expenseTarget, setExpenseTarget] = useState<Id<"budgetCategory"> | null>(null);
  const [expenseLabel, setExpenseLabel] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [addingExpense, setAddingExpense] = useState(false);

  const submitCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }
    setCreating(true);
    try {
      await createCategory({
        name: newCategoryName,
        allocated: Number(newCategoryAlloc) || 0,
      });
      bloom();
      toast.success("Kategori ditambahkan.");
      setNewCategoryOpen(false);
      setNewCategoryName("");
      setNewCategoryAlloc("");
    } catch {
      toast.error("Gagal menambah kategori.");
    } finally {
      setCreating(false);
    }
  };

  const submitExpense = async () => {
    if (!expenseTarget || !expenseLabel.trim() || !Number(expenseAmount)) {
      toast.error("Isi nama dan nominal pengeluaran.");
      return;
    }
    setAddingExpense(true);
    try {
      await addExpense({
        categoryId: expenseTarget,
        label: expenseLabel,
        amount: Number(expenseAmount),
      });
      bloom();
      toast.success("Pengeluaran dicatat.");
      setExpenseTarget(null);
      setExpenseLabel("");
      setExpenseAmount("");
    } catch {
      toast.error("Gagal mencatat pengeluaran.");
    } finally {
      setAddingExpense(false);
    }
  };

  const expensesFor = (categoryId: Id<"budgetCategory">) =>
    (budget?.expenses ?? []).filter((e) => e.categoryId === categoryId);

  const totalAllocated = (budget?.categories ?? []).reduce((s, c) => s + c.allocated, 0);
  const totalSpent = (budget?.expenses ?? []).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4 pt-3">
      <section className="clay grad-mint relative overflow-hidden p-5 text-tint-mint-foreground">
        <FlowerMark className="float-slow pointer-events-none absolute -right-3 -top-3 size-20 opacity-25" />
        <div className="relative flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <div>
            <h1 className="text-xl font-semibold">Budget</h1>
            <p className="mt-0.5 text-xs leading-relaxed opacity-80">
              Catat alokasi dan pengeluaran tiap vendor supaya dana tetap
              terkendali.
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header justify-between">
          <span>Ringkasan</span>
          <span className="normal-case tracking-normal">
            {formatRupiah(totalSpent)} / {formatRupiah(totalAllocated)}
          </span>
        </div>
        <div className="p-3">
          <div className="h-1.5 w-full border border-border bg-background">
            <div
              className={`h-full ${totalSpent > totalAllocated ? "bg-destructive" : "bg-primary"}`}
              style={{
                width: `${totalAllocated > 0 ? Math.min(100, (totalSpent / totalAllocated) * 100) : 0}%`,
              }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {totalSpent > totalAllocated
              ? "Total pengeluaran melebihi alokasi."
              : `Tersisa ${formatRupiah(Math.max(0, totalAllocated - totalSpent))} dari total alokasi.`}
          </p>
        </div>
      </section>

      {(budget?.categories ?? []).map((category) => {
        const expenses = expensesFor(category._id);
        const spent = expenses.reduce((s, e) => s + e.amount, 0);
        const over = spent > category.allocated;
        return (
          <section key={category._id} className="panel">
            <div className="panel-header justify-between">
              <span className="truncate">{category.name}</span>
              <span className="normal-case tracking-normal" style={{ color: over ? "var(--destructive)" : undefined }}>
                {formatRupiah(spent)} / {formatRupiah(category.allocated)}
              </span>
            </div>
            <ul className="divide-y divide-border">
              {expenses.map((expense) => (
                <li key={expense._id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <button
                    type="button"
                    aria-label={expense.paidAt ? "Tandai belum lunas" : "Tandai lunas"}
                    onClick={() =>
                      togglePaid({ expenseId: expense._id, paid: !expense.paidAt })
                    }
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] clay-inset ${
                      expense.paidAt
                        ? "bg-primary text-primary-foreground"
                        : "text-transparent hover:text-primary/60"
                    }`}
                  >
                    ✓
                  </button>
                  <span
                    className={`flex-1 truncate ${
                      expense.paidAt ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {expense.label}
                  </span>
                  <span className="text-xs tabular-nums">{formatRupiah(expense.amount)}</span>
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
              {expenses.length === 0 && (
                <li className="px-3 py-2 text-xs text-muted-foreground">
                  Belum ada pengeluaran di kategori ini.
                </li>
              )}
            </ul>
            <div className="flex gap-2 border-t border-border p-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setExpenseTarget(category._id)}
              >
                <Plus className="size-3.5" /> Pengeluaran
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (confirm(`Hapus kategori "${category.name}" beserta pengeluarannya?`)) {
                    deleteCategory({ categoryId: category._id });
                  }
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </section>
        );
      })}

      {(budget?.categories ?? []).length === 0 && budget !== undefined && (
        <p className="panel p-3 text-xs text-muted-foreground">
          Belum ada kategori. Tambahkan kategori pertama kalian di bawah.
        </p>
      )}

      <Button
        variant="secondary"
        className="w-full rounded-2xl"
        onClick={() => setNewCategoryOpen(true)}
      >
        <Plus className="size-4" /> Tambah kategori
      </Button>

      <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kategori baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Nama kategori</Label>
              <Input
                id="cat-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="cth. Sewa venue"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-alloc">Alokasi (Rp)</Label>
              <Input
                id="cat-alloc"
                type="number"
                min={0}
                step={100000}
                value={newCategoryAlloc}
                onChange={(e) => setNewCategoryAlloc(e.target.value)}
                placeholder="5000000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitCategory} disabled={creating} className="w-full">
              {creating ? <Loader2 className="size-4 animate-spin" /> : "Simpan kategori"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={expenseTarget !== null} onOpenChange={(open) => !open && setExpenseTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah pengeluaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-label">Keterangan</Label>
              <Input
                id="exp-label"
                value={expenseLabel}
                onChange={(e) => setExpenseLabel(e.target.value)}
                placeholder="cth. DP katering"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Nominal (Rp)</Label>
              <Input
                id="exp-amount"
                type="number"
                min={0}
                step={10000}
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="1500000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitExpense} disabled={addingExpense} className="w-full">
              {addingExpense ? <Loader2 className="size-4 animate-spin" /> : "Catat pengeluaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
