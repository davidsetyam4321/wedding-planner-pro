import {
  EmptyState,
  RowMenu,
  SectionHeader,
  Stagger,
  StaggerItem,
} from "@/components/Shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  CheckCircle2,
  ExternalLink,
  Gift,
  Link2,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

type Status = Doc<"seserahanItem">["status"];

/**
 * Tiga tahap belanja — sengaja sedikit dan lebar supaya bisa ditukar sekali
 * ketuk langsung dari baris daftar, tanpa membuka form.
 */
const STATUSES: {
  value: Status;
  label: string;
  icon: typeof Link2;
  surface: string;
}[] = [
  {
    value: "link",
    label: "Link",
    icon: Link2,
    surface: "bg-tint-butter text-tint-butter-foreground",
  },
  {
    value: "cart",
    label: "Keranjang",
    icon: ShoppingCart,
    surface: "bg-tint-lavender text-tint-lavender-foreground",
  },
  {
    value: "bought",
    label: "Dibeli",
    icon: CheckCircle2,
    surface: "bg-tint-mint text-tint-mint-foreground",
  },
];

/** "tokopedia.com/x" → "https://tokopedia.com/x"; kosong → undefined. */
function normalizeLink(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Validasi longgar: host minimal punya titik ("tokopedia.com/..."). */
function isPlausibleLink(url: string): boolean {
  return /^https?:\/\/[^\s/]+\.[^\s]{2,}/i.test(url);
}

/** Tampilan link: hanya host yang ditampilkan agar baris tetap rapi. */
function linkLabel(raw: string): string {
  try {
    return new URL(raw).host.replace(/^www\./, "");
  } catch {
    return raw;
  }
}

/** Satu baris seserahan: nama, link, dan switch status sekali ketuk. */
function SeserahanRow({
  item,
  onEdit,
}: {
  item: Doc<"seserahanItem">;
  onEdit: (item: Doc<"seserahanItem">) => void;
}) {
  const setStatus = useMutation(api.seserahan.setStatus);
  const remove = useMutation(api.seserahan.remove);
  const [busy, setBusy] = useState(false);
  const current = STATUSES.find((s) => s.value === item.status) ?? STATUSES[0];
  const bought = item.status === "bought";

  const switchTo = async (status: Status) => {
    if (busy || status === item.status) return;
    setBusy(true);
    try {
      await setStatus({ itemId: item._id, status });
    } catch {
      toast.error("Status gagal diperbarui. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="clay p-4">
      <div className="flex items-start gap-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${current.surface}`}
        >
          <current.icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-extrabold ${
              bought ? "text-muted-foreground line-through decoration-2" : ""
            }`}
          >
            {item.title}
          </p>
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer noopener"
              className="meta mt-0.5 flex items-center gap-1 text-primary hover:underline"
            >
              <Link2 className="size-3 shrink-0" />
              <span className="truncate">{linkLabel(item.link)}</span>
              <ExternalLink className="size-3 shrink-0 opacity-70" />
            </a>
          ) : (
            <p className="meta mt-0.5">Belum ada link</p>
          )}
        </div>
        <RowMenu
          onEdit={() => onEdit(item)}
          onDelete={() => {
            remove({ itemId: item._id })
              .then(() => toast.success(`“${item.title}” dihapus`))
              .catch(() => toast.error("Gagal menghapus seserahan."));
          }}
          deleteTitle={`Hapus “${item.title}”?`}
          deleteDescription="Baris seserahan ini hilang dari daftar berdua."
        />
      </div>

      {/* ── Switch status: Link → Keranjang → Dibeli, sekali ketuk ──── */}
      <div className="mt-3 flex gap-1 rounded-xl bg-secondary p-1">
        {STATUSES.map((s) => {
          const active = s.value === item.status;
          return (
            <button
              key={s.value}
              type="button"
              disabled={busy}
              aria-pressed={active}
              aria-label={`Status ${s.label} untuk ${item.title}`}
              onClick={() => void switchTo(s.value)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition ${
                active
                  ? `${s.surface} shadow-sm`
                  : "text-muted-foreground hover:bg-background/70"
              }`}
            >
              <s.icon className="size-3.5" />
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Halaman Seserahan: daftar hantaran + link toko + status belanja. */
export function SeserahanPage() {
  const items = useQuery(api.seserahan.list);
  const create = useMutation(api.seserahan.create);
  const update = useMutation(api.seserahan.update);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"seserahanItem"> | null>(null);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);

  const total = items?.length ?? 0;
  const bought = (items ?? []).filter((i) => i.status === "bought").length;
  const pct = total > 0 ? Math.round((bought / total) * 100) : 0;

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setLink("");
    setOpen(true);
  };

  const openEdit = (item: Doc<"seserahanItem">) => {
    setEditingId(item._id);
    setTitle(item.title);
    setLink(item.link ?? "");
    setOpen(true);
  };

  const save = async () => {
    const cleaned = title.trim();
    if (!cleaned) return;
    const href = normalizeLink(link);
    if (href && !isPlausibleLink(href)) {
      toast.error("Link belum valid — contoh: tokopedia.com/nama-barang");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await update({ itemId: editingId, title: cleaned, link: href ?? null });
      } else if (href) {
        await create({ title: cleaned, link: href });
      } else {
        await create({ title: cleaned });
      }
      setOpen(false);
    } catch {
      toast.error("Gagal menyimpan seserahan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Ringkasan progres ──────────────────────────────────────── */}
      <section className="clay p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label text-muted-foreground">Seserahan & hantaran</p>
            <p className="mt-1.5 font-serif text-xl leading-tight">
              {total === 0
                ? "Belum ada barang seserahan"
                : `${bought} dari ${total} sudah dibeli`}
            </p>
          </div>
          <span
            className={`chip shrink-0 ${
              total > 0 && pct === 100
                ? "bg-tint-mint text-tint-mint-foreground"
                : "bg-tint-butter text-tint-butter-foreground"
            }`}
          >
            <Gift className="size-3.5" />
            {pct}%
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ash-canvas">
          <div
            className="h-full rounded-full bg-inkwell-navy transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STATUSES.map((s) => {
            const count = (items ?? []).filter(
              (i) => i.status === s.value,
            ).length;
            return (
              <span key={s.value} className={`chip ${s.surface}`}>
                <s.icon className="size-3.5" />
                {count} {s.label}
              </span>
            );
          })}
        </div>
      </section>

      {/* ── Daftar ─────────────────────────────────────────────────── */}
      <SectionHeader
        title="Daftar seserahan"
        action={
          <Button size="sm" className="rounded-xl" onClick={openCreate}>
            <Plus className="size-4" /> Tambah
          </Button>
        }
      />

      {items === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          emoji="🎁"
          title="Belum ada seserahan"
          description="Catat barang hantaran beserta link toko — statusnya tinggal ditukar saat berbelanja."
          actionLabel="Tambah seserahan"
          onAction={openCreate}
        />
      ) : (
        <Stagger className="space-y-3">
          {items.map((item) => (
            <StaggerItem key={item._id}>
              <SeserahanRow item={item} onEdit={openEdit} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {/* ── Dialog tambah / ubah ───────────────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Ubah seserahan" : "Tambah seserahan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="seserahan-title" className="label">
                Nama barang
              </label>
              <Input
                id="seserahan-title"
                placeholder="Mukena motif, hampers keluarga…"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void save();
                }}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="seserahan-link" className="label">
                Link toko (opsional)
              </label>
              <Input
                id="seserahan-link"
                inputMode="url"
                placeholder="tokopedia.com/nama-barang"
                value={link}
                onChange={(event) => setLink(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void save();
                }}
                className="rounded-xl"
              />
              <p className="meta">
                Item baru otomatis berstatus “Link” — tinggal ditukar dari
                daftar.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              className="rounded-xl"
              disabled={!title.trim() || saving}
              onClick={() => void save()}
            >
              {saving ? "Menyimpan…" : editingId ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
