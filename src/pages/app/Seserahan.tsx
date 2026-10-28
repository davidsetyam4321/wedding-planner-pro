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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { formatRupiah } from "@/lib/format";
import { ExternalLink, Plus } from "@/lib/icons";
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
}[] = [
  { value: "link", label: "Dicari" },
  { value: "cart", label: "Keranjang" },
  { value: "bought", label: "Dibeli" },
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
  const bought = item.status === "bought";
  const unitPrice = item.unitPrice ?? 0;
  const quantity = item.quantity ?? 1;

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
    <div className="sj-ledger-row p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`text-base font-semibold leading-snug ${
              bought ? "text-[var(--ink-soft)] line-through decoration-1" : "text-[var(--ink)]"
            }`}
          >
            {item.title}
          </p>
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-0.5 flex items-center gap-1 text-[0.8125rem] text-[var(--ink-soft)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
            >
              <span className="truncate">{linkLabel(item.link)}</span>
              <ExternalLink className="size-3 shrink-0" />
            </a>
          ) : (
            <p className="mt-0.5 text-[0.8125rem] text-[var(--ink-soft)]">Belum ada tautan</p>
          )}
          {item.note && (
            <p className="mt-1 whitespace-pre-wrap text-[0.8125rem] leading-relaxed text-[var(--ink-soft)]">
              {item.note}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-start">
          <span className="flex size-11 items-center justify-center">
            <Checkbox
              checked={bought}
              disabled={busy}
              aria-label={`Tandai ${item.title} ${bought ? "belum dibeli" : "sudah dibeli"}`}
              onCheckedChange={(checked) =>
                void switchTo(checked === true ? "bought" : "cart")
              }
              className="size-5 rounded-md border-[var(--line)]"
            />
          </span>
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
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="shrink-0 text-[0.8125rem] text-[var(--ink-soft)]">
          {quantity} barang
        </span>
        <span aria-hidden="true" className="sj-dot-leader" />
        <span className="num shrink-0 text-sm text-[var(--ink)]">
          {item.unitPrice !== undefined ? formatRupiah(unitPrice * quantity) : "harga belum diisi"}
        </span>
      </div>

      {/* ── Tahap belanja: Dicari → Keranjang → Dibeli, sekali ketuk ──── */}
      <div
        role="group"
        aria-label={`Tahap belanja ${item.title}`}
        className="sj-seg mt-3 w-full"
      >
        {STATUSES.map((s) => {
          const active = s.value === item.status;
          return (
            <button
              key={s.value}
              type="button"
              disabled={busy}
              data-active={String(active)}
              aria-pressed={active}
              onClick={() => void switchTo(s.value)}
              className="min-h-10 flex-1 rounded-[6px] px-2 text-sm text-[var(--ink-soft)] transition-colors disabled:opacity-60"
            >
              {s.label}
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
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);

  const total = items?.length ?? 0;
  const bought = (items ?? []).filter((i) => i.status === "bought").length;
  const totalQuantity = (items ?? []).reduce((sum, item) => sum + (item.quantity ?? 1), 0);
  const totalValue = (items ?? []).reduce(
    (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity ?? 1),
    0,
  );
  const itemsWithPrice = (items ?? []).filter((item) => item.unitPrice !== undefined).length;
  const pct = total > 0 ? Math.round((bought / total) * 100) : 0;
  const statusData = STATUSES.map((status) => ({
    ...status,
    count: (items ?? []).filter((item) => item.status === status.value).length,
  }));
  const visibleItems = (items ?? []).filter(
    (item) => statusFilter === null || item.status === statusFilter,
  );

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setLink("");
    setUnitPrice("");
    setQuantity("1");
    setNote("");
    setOpen(true);
  };

  const openEdit = (item: Doc<"seserahanItem">) => {
    setEditingId(item._id);
    setTitle(item.title);
    setLink(item.link ?? "");
    setUnitPrice(item.unitPrice === undefined ? "" : String(item.unitPrice));
    setQuantity(String(item.quantity ?? 1));
    setNote(item.note ?? "");
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
    const price = unitPrice.trim() === "" ? undefined : Number(unitPrice);
    const count = Number(quantity);
    if (price !== undefined && (!Number.isSafeInteger(price) || price < 0)) {
      toast.error("Harga harus berupa rupiah utuh nol atau lebih.");
      return;
    }
    if (!Number.isSafeInteger(count) || count < 1) {
      toast.error("Jumlah harus bilangan bulat minimal satu.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await update({
          itemId: editingId,
          title: cleaned,
          link: href ?? null,
          unitPrice: price ?? null,
          quantity: count,
          note: note.trim() || null,
        });
      } else {
        await create({
          title: cleaned,
          ...(href ? { link: href } : {}),
          ...(price === undefined ? {} : { unitPrice: price }),
          quantity: count,
          ...(note.trim() ? { note: note.trim() } : {}),
        });
      }
      setOpen(false);
    } catch {
      toast.error("Gagal menyimpan seserahan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sj-document-page sj-gift-page space-y-4">
      <header className="sj-page-heading border-b border-[var(--line)] pb-4">
        <p className="text-sm text-[var(--ink-soft)]">Daftar hantaran</p>
        <h1 className="mt-1 font-serif text-[clamp(2.25rem,4vw,3.5rem)] leading-tight text-[var(--ink)]">Seserahan &amp; hantaran</h1>
        <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-[var(--ink-soft)]">
          {total > 0
            ? `${totalQuantity} barang dengan nilai tercatat ${formatRupiah(totalValue)}.`
            : "Catat barang untuk mulai menyiapkan hantaran."}
        </p>
      </header>
      {/* ── Progres hantaran ───────────────────────────────────────── */}
      <section className="sj-paper-sheet p-5">
        <p className="max-w-[62ch] text-base leading-relaxed text-[var(--ink)]">
          {total === 0
            ? "Belum ada barang seserahan yang dicatat."
            : `${bought} dari ${total} barang sudah dibeli; ${total - bought} barang masih dicari atau di keranjang.`}
        </p>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <span className="text-[0.8125rem] text-[var(--ink-soft)]">{totalQuantity} barang di daftar</span>
          <span className="num text-sm text-[var(--ink)]">{pct}%</span>
        </div>
        <div
          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--paper-sunk)]"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progres belanja seserahan"
        >
          <div
            className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        {itemsWithPrice < total && total > 0 && (
          <p className="mt-2 text-[0.8125rem] text-[var(--ink-soft)]">
            {total - itemsWithPrice} barang belum punya harga.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
          <button
            type="button"
            aria-pressed={statusFilter === null}
            onClick={() => setStatusFilter(null)}
            className={`chip min-h-11 ${statusFilter === null ? "border-[var(--brand)] text-[var(--ink)]" : "border-[var(--line)] text-[var(--ink-soft)]"}`}
          >
            Semua <span className="num">{total}</span>
          </button>
          {statusData.map((status) => (
            <button
              key={status.value}
              type="button"
              aria-pressed={statusFilter === status.value}
              onClick={() => setStatusFilter((current) => current === status.value ? null : status.value)}
              className={`chip min-h-11 ${statusFilter === status.value ? "border-[var(--brand)] text-[var(--ink)]" : "border-[var(--line)] text-[var(--ink-soft)]"}`}
            >
              {status.label} <span className="num">{status.count}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Daftar ─────────────────────────────────────────────────── */}
      <SectionHeader
        title={statusFilter ? `Daftar seserahan · ${STATUSES.find((s) => s.value === statusFilter)?.label}` : "Daftar seserahan"}
        action={
          <Button size="sm" className="rounded-xl" onClick={openCreate}>
            <Plus className="size-4" /> Tambah
          </Button>
        }
      />

      {items === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          emoji="🎁"
          title="Belum ada seserahan"
          description="Catat barang hantaran beserta link toko — statusnya tinggal ditukar saat berbelanja."
          actionLabel="Tambah seserahan"
          onAction={openCreate}
        />
      ) : visibleItems.length === 0 ? (
        <EmptyState
          emoji="🛍️"
          title="Tidak ada barang di tahap ini"
          description="Pilih tahap belanja lain di atas untuk melihat barangnya."
          actionLabel="Lihat semua barang"
          onAction={() => setStatusFilter(null)}
        />
      ) : (
        <Stagger className="space-y-3">
          {visibleItems.map((item) => (
            <StaggerItem key={item._id}>
              <SeserahanRow item={item} onEdit={openEdit} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {/* ── Dialog tambah / ubah ───────────────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-lg">
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
                Tautan toko (opsional)
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
                Item baru otomatis berstatus “Dicari” — tautannya bisa ditambahkan nanti.

              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="seserahan-price" className="label">Harga satuan (Rp)</label>
                <Input
                  id="seserahan-price"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  placeholder="0"
                  value={unitPrice}
                  onChange={(event) => setUnitPrice(event.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="seserahan-quantity" className="label">Jumlah barang</label>
                <Input
                  id="seserahan-quantity"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="seserahan-note" className="label">Catatan (opsional)</label>
              <Textarea
                id="seserahan-note"
                placeholder="Ukuran, warna, detail pesanan…"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="min-h-20 rounded-xl"
              />
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
              disabled={
                !title.trim() ||
                saving ||
                (unitPrice.trim() !== "" && (!Number.isSafeInteger(Number(unitPrice)) || Number(unitPrice) < 0)) ||
                !Number.isSafeInteger(Number(quantity)) ||
                Number(quantity) < 1
              }
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
