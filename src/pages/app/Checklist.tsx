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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { bloom } from "@/lib/bloom";
import { Check, Loader2, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

type Filter = "semua" | "belum" | "selesai";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "belum", label: "Belum" },
  { key: "selesai", label: "Selesai" },
];

export function ChecklistPage() {
  const items = useQuery(api.checklist.list);
  const createItem = useMutation(api.checklist.create);
  const createMany = useMutation(api.checklist.createMany);
  const updateItem = useMutation(api.checklist.update);
  const toggleItem = useMutation(api.checklist.toggle);
  const removeItem = useMutation(api.checklist.remove);
  const clearDone = useMutation(api.checklist.clearDone);

  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>("semua");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ id: Id<"checklistItem">; label: string } | null>(null);
  const [editingBusy, setEditingBusy] = useState(false);
  const [showDone, setShowDone] = useState(true);

  const all = items ?? [];
  const open = all.filter((item) => !item.done);
  const done = all.filter((item) => item.done);
  const pct = all.length > 0 ? Math.round((done.length / all.length) * 100) : 0;

  const matches = (text: string) =>
    query.trim() === "" || text.toLowerCase().includes(query.trim().toLowerCase());

  const visible = all.filter((item) => {
    if (filter === "belum" && item.done) return false;
    if (filter === "selesai" && !item.done) return false;
    return matches(item.label);
  });

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

  const submitBulk = async () => {
    const labels = bulkText
      .split("\n")
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);
    if (labels.length === 0) {
      toast.error("Belum ada tugas yang diisi.");
      return;
    }
    setBulkBusy(true);
    try {
      const count = await createMany({ labels });
      bloom();
      toast.success(`${count} tugas ditambahkan.`);
      setBulkText("");
      setBulkOpen(false);
    } catch {
      toast.error("Gagal menambah tugas.");
    } finally {
      setBulkBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setEditingBusy(true);
    try {
      await updateItem({ itemId: editing.id, label: editing.label });
      setEditing(null);
      toast.success("Tugas diperbarui.");
    } catch {
      toast.error("Gagal menyimpan tugas.");
    } finally {
      setEditingBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="clay grad-peach relative overflow-hidden p-5 text-tint-peach-foreground">
        <FlowerMark className="float-slow pointer-events-none absolute -right-3 -top-3 size-20 opacity-25" />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <h1 className="h-page">Checklist</h1>
            <p className="meta">{open.length} tugas menunggu · {done.length} selesai</p>
          </div>
          <div className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-white/70 text-xl">
            📝
          </div>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-tint-peach-foreground/70 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="num meta mt-1.5">{pct}% selesai</p>
      </section>

      <section className="clay space-y-3 p-4">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Tambah tugas, tekan Enter"
          />
          <Button type="submit" size="icon" className="rounded-xl" disabled={adding || !label.trim()}>
            {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            className="chip bg-tint-butter text-tint-butter-foreground"
          >
            <Sparkles className="size-3.5" /> Tempel banyak tugas
          </button>
          {done.length > 0 && showDone && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Hapus ${done.length} tugas yang sudah selesai?`)) {
                  clearDone().then(() => toast.success("Tugas selesai dibersihkan."));
                }
              }}
              className="chip bg-secondary text-secondary-foreground"
            >
              <Trash2 className="size-3.5" /> Bersihkan selesai
            </button>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="clay-inset flex gap-1.5 p-1.5">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              className={`chip flex-1 justify-center ${
                filter === option.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari tugas…"
            className="pl-9"
          />
        </div>

        <ul className="space-y-2">
          {visible.map((item) => (
            <li key={item._id} className="clay flex items-center gap-3 p-3">
              <button
                type="button"
                aria-label={item.done ? "Tandai belum selesai" : "Tandai selesai"}
                onClick={() => {
                  toggleItem({ itemId: item._id, done: !item.done });
                  if (!item.done) bloom();
                }}
                className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                  item.done
                    ? "bg-primary text-primary-foreground"
                    : "clay-inset text-muted-foreground hover:text-primary"
                }`}
              >
                <Check className="size-3.5" />
              </button>
              <span
                className={`flex-1 text-sm leading-snug ${
                  item.done ? "text-muted-foreground line-through" : ""
                }`}
              >
                {item.label}
              </span>
              <button
                type="button"
                aria-label="Ubah tugas"
                className="text-muted-foreground hover:text-primary"
                onClick={() => setEditing({ id: item._id, label: item.label })}
              >
                <Pencil className="size-3.5" />
              </button>
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
          {visible.length === 0 && items !== undefined && (
            <li className="clay-inset flex h-20 items-center justify-center rounded-3xl text-xs text-muted-foreground">
              {query || filter !== "semua"
                ? "Tidak ada tugas yang cocok."
                : "Belum ada tugas. Tambahkan yang pertama!"}
            </li>
          )}
        </ul>

        {filter === "semua" && done.length > 0 && (
          <button
            type="button"
            onClick={() => setShowDone((previous) => !previous)}
            className="text-[11px] font-bold text-muted-foreground"
          >
            {showDone ? "Sembunyikan yang selesai" : "Tampilkan yang selesai"}
          </button>
        )}
      </section>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tempel banyak tugas</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="bulk">Satu tugas per baris</Label>
            <Textarea
              id="bulk"
              rows={6}
              value={bulkText}
              onChange={(event) => setBulkText(event.target.value)}
              placeholder={"Booking MUA\nSurvey gaun\nAtur transportasi"}
            />
          </div>
          <DialogFooter>
            <Button onClick={submitBulk} disabled={bulkBusy} className="w-full rounded-2xl">
              {bulkBusy ? <Loader2 className="size-4 animate-spin" /> : "Tambah semua"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ubah tugas</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="edit-label">Tugas</Label>
            <Input
              id="edit-label"
              value={editing?.label ?? ""}
              onChange={(event) =>
                setEditing((previous) =>
                  previous ? { ...previous, label: event.target.value } : previous,
                )
              }
            />
          </div>
          <DialogFooter>
            <Button onClick={saveEdit} disabled={editingBusy} className="w-full rounded-2xl">
              {editingBusy ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
