import {
  EmptyState,
  MoneyInput,
  PageHeading,
  RowMenu,
  Segmented,
  StackBar,
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { formatRupiah } from "@/lib/format";
import { ExternalLink, Plus } from "@/lib/icons";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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

/**
 * Satu baris hantaran: nama, tautan toko, jumlah & nilai, lalu tiga tahap
 * belanja yang bisa ditukar sekali ketuk.
 */
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
    <div className="sj-ledger-row px-1 py-4 sm:px-2">
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label={`Tandai ${item.title} ${bought ? "belum dibeli" : "sudah dibeli"}`}
          disabled={busy}
          onClick={() => void switchTo(bought ? "cart" : "bought")}
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-[var(--brand)] transition-transform duration-200 active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] disabled:opacity-60"
        >
          <span
            aria-hidden="true"
            className="grid size-5 place-items-center rounded-[6px] border border-[var(--line)] bg-[var(--paper)]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
              style={{
                strokeDasharray: 26,
                strokeDashoffset: bought ? 0 : 26,
                transition: "stroke-dashoffset 320ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <path d="M4 12.5 9.5 18 20 6" />
            </svg>
          </span>
        </button>

        <div className="min-w-0 flex-1 pt-1.5">
          <p
            className={`text-base font-medium leading-snug ${
              bought ? "text-[var(--ink-soft)] line-through decoration-1" : "text-[var(--ink)]"
            }`}
          >
            {item.title}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-[var(--ink-soft)]">
            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 items-center gap-1 underline-offset-4 hover:text-[var(--ink)] hover:underline"
              >
                <span className="truncate">{linkLabel(item.link)}</span>
                <ExternalLink className="size-3 shrink-0" />
              </a>
            ) : (
              <span className="inline-flex min-h-11 items-center">Belum ada link</span>
            )}
            <span aria-hidden="true" className="hidden h-px w-6 bg-[var(--line)] sm:block" />
            <span className="num">{quantity} barang</span>
          </div>

          {item.note && (
            <p className="mt-1 max-w-[62ch] whitespace-pre-wrap text-[0.8125rem] leading-relaxed text-[var(--ink-soft)]">
              {item.note}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="num whitespace-nowrap pt-1.5 text-sm font-medium text-[var(--ink)]">
            {item.unitPrice !== undefined ? formatRupiah(unitPrice * quantity) : "harga belum diisi"}
          </p>
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

      <div className="mt-3 w-full max-w-sm">
        <Segmented
          label={`Tahap belanja ${item.title}`}
          value={item.status}
          disabled={busy}
          onChange={(next) => void switchTo(next)}
          options={STATUSES.map((stage) => ({ value: stage.value, label: stage.label }))}
        />
      </div>
    </div>
  );
}

/** Halaman Seserahan: daftar hantaran + link toko + status belanja. */
export function SeserahanPage() {
  const items = useQuery(api.seserahan.list);
  const create = useMutation(api.seserahan.create);
  const update = useMutation(api.seserahan.update);
  const reducedMotion = useReducedMotion();

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
  const complete = total > 0 && bought === total;
  const statusData = STATUSES.map((status) => ({
    ...status,
    count: (items ?? []).filter((item) => item.status === status.value).length,
  }));
  const visibleItems = (items ?? []).filter(
    (item) => statusFilter === null || item.status === statusFilter,
  );
  const activeFilterLabel = STATUSES.find((status) => status.value === statusFilter)?.label;

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
    <div className="sj-document-page sj-gift-page space-y-5 pb-6">
      <PageHeading
        kicker="Daftar hantaran"
        title="Seserahan & hantaran"
        summary={
          total > 0 ? (
            <>
              <strong className="num font-semibold text-[var(--ink)]">{totalQuantity} barang</strong>{" "}
              dengan nilai tercatat{" "}
              <strong className="num font-semibold text-[var(--ink)]">{formatRupiah(totalValue)}</strong>
              ; {bought} dari {total} sudah dibeli.
            </>
          ) : (
            "Catat barang untuk mulai menyiapkan hantaran."
          )
        }
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 text-sm font-medium text-white shadow-[var(--elev-ambient)] transition-transform duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
          >
            <Plus className="size-4" /> Tambah barang
          </button>
        }
      />

      {/* ── Progres hantaran ───────────────────────────────────────── */}
      <section className="sj-paper-sheet p-5" aria-label="Progres hantaran">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <p className="max-w-[58ch] text-base leading-relaxed text-[var(--ink)]">
              {total === 0
                ? "Belum ada barang seserahan yang dicatat."
                : complete
                  ? `Semua ${total} barang sudah dibeli. Tinggal dikemas untuk hantaran.`
                  : `${bought} dari ${total} barang sudah dibeli; ${total - bought} masih dicari atau di keranjang.`}
            </p>
            <p className="mt-1 text-[0.8125rem] text-[var(--ink-soft)]">
              {totalQuantity} barang di daftar
              {itemsWithPrice < total && total > 0
                ? `, ${total - itemsWithPrice} belum punya harga`
                : ""}
              .
            </p>
          </div>
          <div className="shrink-0">
            <p className="num display-serif text-[clamp(2.25rem,5vw,3rem)] leading-none text-[var(--ink)]">
              {pct}%
            </p>
            {complete && (
              <motion.svg
                viewBox="0 0 120 6"
                className="mt-1 h-1.5 w-24"
                aria-hidden="true"
                preserveAspectRatio="none"
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.path
                  d="M1 4C18 1.5 30 5 48 3s36 2 71-1"
                  fill="none"
                  stroke="var(--accent, #a06f30)"
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  initial={reducedMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
                />
              </motion.svg>
            )}
          </div>
        </div>

        <StackBar
          className="mt-4"
          label={`${bought} dari ${total} barang sudah dibeli`}
          segments={[
            { label: "Sudah dibeli", value: bought, tone: "brand", title: `Dibeli: ${bought} barang` },
            {
              label: "Belum dibeli",
              value: Math.max(0, total - bought),
              tone: "sunk",
              title: `Belum dibeli: ${Math.max(0, total - bought)} barang`,
            },
          ]}
        />

        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-[var(--line)] pt-3">
          <button
            type="button"
            aria-pressed={statusFilter === null}
            onClick={() => setStatusFilter(null)}
            className={`inline-flex min-h-11 items-center gap-1.5 border-b-2 px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
              statusFilter === null
                ? "border-[var(--brand)] text-[var(--ink)]"
                : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
          >
            Semua <span className="num text-[0.8125rem]">{total}</span>
          </button>
          {statusData.map((status) => (
            <button
              key={status.value}
              type="button"
              aria-pressed={statusFilter === status.value}
              onClick={() =>
                setStatusFilter((current) => (current === status.value ? null : status.value))
              }
              className={`inline-flex min-h-11 items-center gap-1.5 border-b-2 px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
                statusFilter === status.value
                  ? "border-[var(--brand)] text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              {status.label} <span className="num text-[0.8125rem]">{status.count}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Daftar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[var(--line)] pb-2">
        <h2 className="display-serif text-xl leading-snug text-[var(--ink)] sm:text-2xl">
          {activeFilterLabel ? `Daftar seserahan: ${activeFilterLabel}` : "Daftar seserahan"}
        </h2>
        {items !== undefined && (
          <span className="num text-[0.8125rem] text-[var(--ink-soft)]">
            {visibleItems.length} barang
          </span>
        )}
      </div>

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
          description="Tahap ini masih kosong. Lihat semua barang untuk menukar tahapnya."
          actionLabel="Lihat semua barang"
          onAction={() => setStatusFilter(null)}
        />
      ) : (
        <Stagger className="space-y-1">
          {visibleItems.map((item) => (
            <StaggerItem key={item._id}>
              <SeserahanRow item={item} onEdit={openEdit} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {/* ── Dialog tambah / ubah ───────────────────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="display-serif text-2xl">
              {editingId ? "Ubah seserahan" : "Tambah seserahan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="seserahan-title" className="text-sm font-medium text-[var(--ink)]">
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
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="seserahan-link" className="text-sm font-medium text-[var(--ink)]">
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
                className="rounded-lg"
              />
              <p className="text-[0.8125rem] leading-relaxed text-[var(--ink-soft)]">
                Barang baru otomatis berstatus “Dicari” — tautannya bisa ditambahkan nanti.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="seserahan-price" className="text-sm font-medium text-[var(--ink)]">
                  Harga satuan (Rp)
                </label>
                <MoneyInput
                  id="seserahan-price"
                  value={unitPrice}
                  onChange={setUnitPrice}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="seserahan-quantity" className="text-sm font-medium text-[var(--ink)]">
                  Jumlah barang
                </label>
                <Input
                  id="seserahan-quantity"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="seserahan-note" className="text-sm font-medium text-[var(--ink)]">
                Catatan (opsional)
              </label>
              <Textarea
                id="seserahan-note"
                placeholder="Ukuran, warna, detail pesanan…"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="min-h-20 rounded-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              className="rounded-lg"
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
