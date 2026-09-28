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
import { formatDateTimeID, formatRupiah, formatRupiahShort } from "@/lib/format";
import { Loader2, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

const QUICK_AMOUNTS = [250_000, 500_000, 1_000_000, 2_000_000];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function TabunganPage() {
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
  const [targetValue, setTargetValue] = useState("");
  const [targetBusy, setTargetBusy] = useState(false);

  const list = deposits ?? [];
  const total = list.reduce((sum, deposit) => sum + deposit.amount, 0);
  const target = wedding?.fundTarget ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;

  const now = new Date();
  const thisMonth = list
    .filter((deposit) => {
      const date = new Date(deposit.savedAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, deposit) => sum + deposit.amount, 0);
  const average = list.length > 0 ? Math.round(total / list.length) : 0;

  const groups = list.reduce<Record<string, typeof list>>((accumulator, deposit) => {
    const date = new Date(deposit.savedAt);
    const key = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    accumulator[key] = accumulator[key] ?? [];
    accumulator[key].push(deposit);
    return accumulator;
  }, {});

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

  return (
    <div className="space-y-4">
      <section className="clay grad-lavender relative overflow-hidden p-5 text-tint-lavender-foreground">
        <FlowerMark className="float-slow pointer-events-none absolute -right-3 -top-3 size-20 opacity-25" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h1 className="h-page">Tabungan</h1>
            <p className="meta">Target {formatRupiahShort(target)}</p>
          </div>
          <button
            type="button"
            className="chip bg-white/70"
            onClick={() => {
              setTargetValue(String(target));
              setTargetOpen(true);
            }}
          >
            <Target className="size-3.5" /> Ubah target
          </button>
        </div>

        <p className="num relative mt-4 text-3xl font-extrabold">
          {formatRupiah(total)}
        </p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-tint-lavender-foreground/70 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="num meta mt-1.5">
          {pct}% terkumpul · sisa {formatRupiah(Math.max(0, target - total))}
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <dl className="clay stat-tile bg-tint-lavender text-tint-lavender-foreground">
          <dt>Bulan ini</dt>
          <dd>{formatRupiahShort(thisMonth)}</dd>
        </dl>
        <dl className="clay stat-tile bg-tint-sky text-tint-sky-foreground">
          <dt>Rata-rata</dt>
          <dd>{formatRupiahShort(average)}</dd>
        </dl>
        <dl className="clay stat-tile bg-tint-mint text-tint-mint-foreground">
          <dt>Setoran</dt>
          <dd>{list.length}×</dd>
        </dl>
      </section>

      <section className="clay space-y-3 p-4">
        <h2 className="h-card">Setor baru</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              disabled={saving}
              onClick={() => void submit(value)}
              className="chip bg-tint-lavender text-tint-lavender-foreground disabled:opacity-60"
            >
              + {formatRupiahShort(value)}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deposit-amount">Nominal (Rp)</Label>
          <Input
            id="deposit-amount"
            type="number"
            min={0}
            step={50000}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="500000"
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

      {Object.entries(groups).map(([month, monthDeposits]) => (
        <section key={month} className="clay overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="h-card">{month}</h2>
            <span className="num text-[11px] font-bold text-primary">
              + {formatRupiahShort(
                monthDeposits.reduce((sum, deposit) => sum + deposit.amount, 0),
              )}
            </span>
          </div>
          <ul className="divide-y divide-border">
            {monthDeposits.map((deposit) => (
              <li key={deposit._id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {deposit.note ?? "Setoran"}
                  </p>
                  <p className="meta">{formatDateTimeID(deposit.savedAt)}</p>
                </div>
                <span className="num text-sm font-bold text-primary">
                  +{formatRupiahShort(deposit.amount)}
                </span>
                <button
                  type="button"
                  aria-label="Ubah setoran"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() =>
                    setEditing({
                      id: deposit._id,
                      amount: String(deposit.amount),
                      note: deposit.note ?? "",
                    })
                  }
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Hapus setoran"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeDeposit({ depositId: deposit._id })}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {list.length === 0 && deposits !== undefined && (
        <p className="clay-inset flex h-24 items-center justify-center rounded-3xl text-xs text-muted-foreground">
          Belum ada setoran. Mulai dari nominal kecil, yang penting rutin!
        </p>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ubah setoran</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-amount">Nominal (Rp)</Label>
              <Input
                id="edit-amount"
                type="number"
                value={editing?.amount ?? ""}
                onChange={(event) =>
                  setEditing((previous) =>
                    previous ? { ...previous, amount: event.target.value } : previous,
                  )
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
            <Input
              id="target-value"
              type="number"
              min={0}
              step={1000000}
              value={targetValue}
              onChange={(event) => setTargetValue(event.target.value)}
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
