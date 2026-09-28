import { FlowerMark } from "@/components/Decor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { formatDateTimeID, formatRupiah } from "@/lib/format";
import { bloom } from "@/lib/bloom";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

/** Savings page: setoran dana pernikahan + riwayat. */
export function TabunganPage() {
  const wedding = useQuery(api.wedding.get);
  const deposits = useQuery(api.savings.list);
  const addDeposit = useMutation(api.savings.add);
  const removeDeposit = useMutation(api.savings.remove);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const total = deposits?.reduce((sum, d) => sum + d.amount, 0) ?? 0;
  const target = wedding?.fundTarget ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;

  const submit = async () => {
    const value = Number(amount);
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

  return (
    <div className="space-y-4 pt-3">
      <section className="clay grad-lavender relative overflow-hidden p-5 text-tint-lavender-foreground">
        <FlowerMark className="float-slow pointer-events-none absolute -right-3 -top-3 size-20 opacity-25" />
        <div className="relative flex items-center gap-3">
          <span className="text-2xl">🐷</span>
          <div>
            <h1 className="text-xl font-semibold">Tabungan</h1>
            <p className="mt-0.5 text-xs leading-relaxed opacity-80">
              Catat setiap setoran agar progres menuju target dana selalu
              terpantau.
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header justify-between">
          <span>Progres</span>
          <span className="normal-case tracking-normal">{pct}%</span>
        </div>
        <div className="p-3">
          <div className="flex items-end justify-between">
            <p className="text-xl font-semibold">{formatRupiah(total)}</p>
            <p className="text-xs text-muted-foreground">
              target {formatRupiah(target)}
            </p>
          </div>
          <div className="clay-inset mt-2 h-2.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">Setor baru</div>
        <div className="space-y-3 p-3">
          <div className="space-y-1.5">
            <Label htmlFor="deposit-amount">Nominal (Rp)</Label>
            <Input
              id="deposit-amount"
              type="number"
              min={0}
              step={10000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deposit-note">Catatan (opsional)</Label>
            <Input
              id="deposit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="cth. setoran gaji bulan ini"
            />
          </div>
          <Button onClick={submit} disabled={saving} className="w-full rounded-2xl">
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

      <section className="panel">
        <div className="panel-header">Riwayat setoran</div>
        <ul className="divide-y divide-border">
          {(deposits ?? []).map((deposit) => (
            <li key={deposit._id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="text-primary">+</span>
              <div className="flex-1 truncate">
                <p className="truncate">{deposit.note ?? "Setoran"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDateTimeID(deposit.savedAt)}
                </p>
              </div>
              <span className="tabular-nums">{formatRupiah(deposit.amount)}</span>
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
          {(deposits ?? []).length === 0 && (
            <li className="px-3 py-3 text-xs text-muted-foreground">
              {deposits === undefined ? "Memuat…" : "Belum ada setoran tercatat."}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
