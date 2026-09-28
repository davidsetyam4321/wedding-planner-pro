import { FlowerMark } from "@/components/Decor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { bloom } from "@/lib/bloom";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

/** Checklist page: tugas persiapan pernikahan. */
export function ChecklistPage() {
  const items = useQuery(api.checklist.list);
  const createItem = useMutation(api.checklist.create);
  const toggleItem = useMutation(api.checklist.toggle);
  const removeItem = useMutation(api.checklist.remove);

  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const all = items ?? [];
  const doneCount = all.filter((item) => item.done).length;
  const pct = all.length > 0 ? Math.round((doneCount / all.length) * 100) : 0;

  const submit = async () => {
    if (!label.trim()) return;
    setAdding(true);
    try {
      await createItem({ label });
      bloom();
      setLabel("");
    } catch {
      toast.error("Gagal menambah tugas.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4 pt-3">
      <section className="clay grad-peach relative overflow-hidden p-5 text-tint-peach-foreground">
        <FlowerMark className="float-slow pointer-events-none absolute -right-3 -top-3 size-20 opacity-25" />
        <div className="relative flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <div>
            <h1 className="text-xl font-semibold">Checklist</h1>
            <p className="mt-0.5 text-xs leading-relaxed opacity-80">
              Semua yang perlu diselesaikan sebelum hari-H, di satu tempat.
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header justify-between">
          <span>Progres</span>
          <span className="normal-case tracking-normal">
            {doneCount}/{all.length} selesai
          </span>
        </div>
        <div className="p-3">
          <div className="clay-inset h-2.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">Tambah tugas</div>
        <form
          className="flex gap-2 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="cth. Survey venue kedua"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-2xl"
            disabled={adding || !label.trim()}
          >
            {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          </Button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">Daftar tugas</div>
        <ul className="divide-y divide-border">
          {all.map((item) => (
            <li key={item._id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <button
                type="button"
                aria-label={item.done ? "Tandai belum selesai" : "Tandai selesai"}
                onClick={() => {
                  toggleItem({ itemId: item._id, done: !item.done });
                  if (!item.done) bloom();
                }}
                className={`clay-inset flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  item.done
                    ? "bg-primary text-primary-foreground"
                    : "text-transparent hover:text-primary/60"
                }`}
              >
                ✓
              </button>
              <span
                className={`flex-1 ${item.done ? "text-muted-foreground line-through" : ""}`}
              >
                {item.label}
              </span>
              <button
                type="button"
                aria-label="Hapus tugas"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => removeItem({ itemId: item._id })}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
          {all.length === 0 && (
            <li className="px-3 py-3 text-xs text-muted-foreground">
              {items === undefined ? "Memuat…" : "Belum ada tugas. Tambahkan yang pertama!"}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
