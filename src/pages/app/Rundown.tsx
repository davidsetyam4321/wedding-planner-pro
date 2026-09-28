import { FlowerMark } from "@/components/Decor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { bloom } from "@/lib/bloom";
import { ChevronLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

/** Rundown acara: susunan agenda hari-H urut jam. */
export function RundownPage() {
  const items = useQuery(api.rundown.list);
  const createItem = useMutation(api.rundown.create);
  const removeItem = useMutation(api.rundown.remove);

  const [startTime, setStartTime] = useState("08:00");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const list = items ?? [];
  const firstTime = list[0]?.startTime;
  const lastTime = list[list.length - 1]?.startTime;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Nama acara wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await createItem({ startTime, title, note: note || undefined });
      bloom();
      toast.success("Agenda ditambahkan.");
      setTitle("");
      setNote("");
    } catch {
      toast.error("Gagal menambah agenda.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link
        to="/app/lainnya"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
      >
        <ChevronLeft className="size-3.5" /> Lainnya
      </Link>

      <section className="clay grad-sage relative overflow-hidden p-5 text-tint-sage-foreground">
        <FlowerMark className="float-slow pointer-events-none absolute -right-3 -top-3 size-20 opacity-25" />
        <div className="relative flex items-center gap-3">
          <div className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-white/70 text-lg">
            ⏰
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight">Rundown Acara</h1>
            <p className="text-[11px] opacity-80">
              {list.length} agenda
              {firstTime && lastTime ? ` · ${firstTime}–${lastTime}` : ""}
            </p>
          </div>
        </div>
      </section>

      <section className="clay p-4">
        <h2 className="text-sm font-bold">Tambah agenda</h2>
        <form className="mt-3 space-y-3" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rundown-time">Jam mulai</Label>
              <Input
                id="rundown-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rundown-title">Acara</Label>
              <Input
                id="rundown-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth. Prosesi akad"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rundown-note">Catatan (opsional)</Label>
            <Input
              id="rundown-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="cth. koordinasi dengan MC"
            />
          </div>
          <Button type="submit" className="w-full rounded-2xl" disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Plus className="size-4" /> Tambah agenda
              </>
            )}
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        {list.map((item) => (
          <div key={item._id} className="clay flex items-start gap-3 p-3.5">
            <div className="clay-sm shrink-0 rounded-2xl bg-primary px-3 py-2 text-center">
              <p className="text-xs font-extrabold text-primary-foreground">
                {item.startTime}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-snug">{item.title}</p>
              {item.note && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">{item.note}</p>
              )}
            </div>
            <button
              type="button"
              aria-label="Hapus agenda"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => {
                removeItem({ itemId: item._id });
                toast.success("Agenda dihapus.");
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}

        {items !== undefined && list.length === 0 && (
          <div className="clay-inset flex h-24 items-center justify-center rounded-3xl text-xs text-muted-foreground">
            Belum ada agenda. Susun acara hari-H dari sini!
          </div>
        )}
      </section>
    </div>
  );
}
