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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { bloom } from "@/lib/bloom";
import {
  PRIORITY_BADGE,
  PRIORITY_LABEL,
  nextPriority,
  normalizePriority,
} from "@/lib/priority";
import { Check, Loader2, Plus, Search, Sparkles, Trash2 } from "lucide-react";
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
  const setPriority = useMutation(api.checklist.setPriority);
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
  const visibleOpen = visible.filter((item) => !item.done);
  const visibleDone = visible.filter((item) => item.done);

  const renderItem = (item: (typeof all)[number]) => (
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
      {!item.done && (
        <button
          type="button"
          title="Ubah prioritas tugas"
          onClick={() =>
            setPriority({
              itemId: item._id,
              priority: nextPriority(item.priority),
            })
          }
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider transition-transform active:scale-95 ${
            PRIORITY_BADGE[normalizePriority(item.priority)]
          }`}
        >
          {PRIORITY_LABEL[normalizePriority(item.priority)]}
        </button>
      )}
      <RowMenu
        onEdit={() => setEditing({ id: item._id, label: item.label })}
        onDelete={() => removeItem({ itemId: item._id })}
        deleteTitle={`Hapus tugas ini?`}
        deleteDescription={item.label}
      />
    </li>
  );

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

  if (items === undefined) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <section className="clay p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="label text-muted-foreground">Progres tugas</p>
            <p className="meta mt-1">
              {open.length} tugas menunggu · {done.length} selesai
            </p>
          </div>
          <div className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-tint-peach text-xl text-tint-peach-foreground">
            📝
          </div>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-secondary">
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

        <Stagger className="space-y-4">
          {(filter === "semua" || filter === "belum") && visibleOpen.length > 0 && (
            <StaggerItem>
              <section className="space-y-2">
                <p className="label px-1 text-muted-foreground">
                  Belum · {visibleOpen.length}
                </p>
                <ul className="space-y-2">
                  {visibleOpen.map(renderItem)}
                </ul>
              </section>
            </StaggerItem>
          )}

          {(filter === "semua" || filter === "selesai") && visibleDone.length > 0 && showDone && (
            <StaggerItem>
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="label text-muted-foreground">Selesai · {visibleDone.length}</p>
                  {filter === "semua" && (
                    <button
                      type="button"
                      onClick={() => setShowDone(false)}
                      className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
                    >
                      Sembunyikan
                    </button>
                  )}
                </div>
                <ul className="space-y-2">
                  {visibleDone.map(renderItem)}
                </ul>
              </section>
            </StaggerItem>
          )}
        </Stagger>

        {filter === "semua" && done.length > 0 && !showDone && (
          <button
            type="button"
            onClick={() => setShowDone(true)}
            className="text-[11px] font-bold text-muted-foreground"
          >
            Tampilkan {done.length} yang selesai
          </button>
        )}

        {visible.length === 0 && items !== undefined && (
          <EmptyState
            emoji={query || filter !== "semua" ? "🔍" : "📝"}
            title={
              query || filter !== "semua"
                ? "Tidak ada tugas yang cocok"
                : "Belum ada tugas"
            }
            description={
              query || filter !== "semua"
                ? "Coba kata kunci lain atau ganti filter."
                : "Tuliskan satu per satu, atau tempel daftar tugas sekaligus."
            }
            actionLabel={query || filter !== "semua" ? undefined : "Tempel banyak tugas"}
            onAction={query || filter !== "semua" ? undefined : () => setBulkOpen(true)}
          />
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
