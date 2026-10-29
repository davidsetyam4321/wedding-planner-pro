import {
  BackLink,
  EmptyState,
  LedgerFigure,
  PageHeading,
  PageSkeleton,
  RowMenu,
  Segmented,
  StackBar,
  Stagger,
  StaggerItem,
  DateInputID,
  MoneyInput,
} from "@/components/Shared";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { vendorPaidAmount } from "@/lib/budget";
import { waLink } from "@/lib/contact";
import {
  formatRupiah,
  fromDateInputValue,
  toDateInputValue,
} from "@/lib/format";
import {
  ChevronDown,
  FileDown,
  FileText,
  Loader2,
  MessageCircle,
  Phone,
  Plus,
  Search,
  X,
} from "@/lib/icons";
import { downloadCsv } from "@/lib/exportCsv";
import { printDocument } from "@/lib/printDoc";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { undoableDelete } from "@/lib/undo";

type VendorStatus = "belum" | "dp" | "lunas";

const STATUS_OPTIONS: { key: VendorStatus; label: string }[] = [
  { key: "belum", label: "Belum" },
  { key: "dp", label: "DP" },
  { key: "lunas", label: "Lunas" },
];

/** Label panjang untuk baris daftar; nilai enum tetap belum/dp/lunas. */
const STATUS_LABEL: Record<VendorStatus, string> = {
  belum: "Belum dibayar",
  dp: "DP terbayar",
  lunas: "Lunas",
};

/**
 * Penanda status: tidak pernah hanya warna. Belum = cincin netral,
 * DP = separuh lingkaran emas, Lunas = centang hijau.
 */
function StatusMark({ status, className = "size-4" }: { status: VendorStatus; className?: string }) {
  if (status === "lunas") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
        <path d="M6 10.5 8.8 13.2 14 7.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "dp") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10 2a8 8 0 0 1 0 16Z" fill="currentColor" opacity="0.9" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
    </svg>
  );
}

/** “Jatuh tempo H-137”, “Jatuh tempo hari ini”, atau “Terlambat 3 hari”. */
function dueLabel(dueDate: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((dueDate - today.getTime()) / 86_400_000);
  if (days < 0) return { text: `Terlambat ${Math.abs(days)} hari`, late: true };
  if (days === 0) return { text: "Jatuh tempo hari ini", late: true };
  if (days === 1) return { text: "Jatuh tempo besok", late: false };
  return { text: `Jatuh tempo H-${days}`, late: false };
}

type VendorForm = {
  id: Id<"vendor"> | null;
  name: string;
  category: string;
  contact: string;
  cost: string;
  dpAmount: string;
  note: string;
  status: VendorStatus;
  /** nilai input type=date ("" = tanpa jatuh tempo) */
  due: string;
};

const EMPTY_FORM: VendorForm = {
  id: null,
  name: "",
  category: "",
  contact: "",
  cost: "",
  dpAmount: "",
  note: "",
  status: "belum",
  due: "",
};

/** Vendor: kontak, biaya, dan status pembayaran. */
export function VendorPage() {
  const vendors = useQuery(api.vendors.list);
  const vendorTypes = useQuery(api.wedding.getVendorCategories);
  const createVendor = useMutation(api.vendors.create);
  const updateVendor = useMutation(api.vendors.update);
  const setStatus = useMutation(api.vendors.setStatus);
  const removeVendor = useMutation(api.vendors.remove);

  const [form, setForm] = useState<VendorForm>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<VendorStatus | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  const list = vendors ?? [];
  const categories = Array.from(new Set(list.map((v) => v.category)));
  // Pilihan jenis vendor = daftar dari Pengaturan; jenis lama milik vendor yang
  // sedang diubah tetap ikut supaya nilai tersimpan tidak pernah putus.
  const typeOptions = (() => {
    const base = vendorTypes ?? [];
    if (
      form.category &&
      !base.some((type) => type.toLowerCase() === form.category.toLowerCase())
    ) {
      return [...base, form.category];
    }
    return base;
  })();
  const totalCost = list.reduce((sum, v) => sum + v.cost, 0);
  const paidTotal = list.reduce((sum, vendor) => sum + vendorPaidAmount(vendor), 0);
  const remaining = Math.max(0, totalCost - paidTotal);
  const lunasCount = list.filter((v) => v.status === "lunas").length;

  const visible = list.filter((vendor) => {
    if (categoryFilter && vendor.category !== categoryFilter) return false;
    if (statusFilter && vendor.status !== statusFilter) return false;
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return (
      vendor.name.toLowerCase().includes(term) ||
      vendor.category.toLowerCase().includes(term)
    );
  });

  const openNew = () => {
    // Jenis pertama dari daftar Pengaturan jadi pilihan awal.
    setForm({ ...EMPTY_FORM, category: vendorTypes?.[0] ?? "" });
    setFormOpen(true);
  };

  const openEdit = (vendor: (typeof list)[number]) => {
    setForm({
      id: vendor._id,
      name: vendor.name,
      category: vendor.category,
      contact: vendor.contact ?? "",
      cost: String(vendor.cost),
      dpAmount: vendor.dpAmount === undefined ? "" : String(vendor.dpAmount),
      note: vendor.note ?? "",
      status: vendor.status as VendorStatus,
      due: vendor.dueDate ? toDateInputValue(vendor.dueDate) : "",
    });
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Nama vendor wajib diisi.");
      return;
    }
    if (!form.category.trim()) {
      toast.error("Pilih jenis vendor — daftarkan barunya lewat menu Pengaturan.");
      return;
    }
    const cost = Number(form.cost) || 0;
    const dpAmount = form.dpAmount === "" ? 0 : Number(form.dpAmount) || 0;
    setBusy(true);
    try {
      if (form.id) {
        await updateVendor({
          vendorId: form.id,
          name: form.name,
          category: form.category,
          contact: form.contact,
          cost,
          dpAmount,
          note: form.note,
          status: form.status,
          dueDate: form.due ? fromDateInputValue(form.due) : null,
        });
        toast.success("Vendor diperbarui.");
      } else {
        await createVendor({
          name: form.name,
          category: form.category,
          contact: form.contact,
          cost,
          dpAmount,
          note: form.note,
          status: form.status,
          dueDate: form.due ? fromDateInputValue(form.due) : undefined,
        });
        bloom();
        toast.success("Vendor ditambahkan.");
      }
      setFormOpen(false);
      setForm(EMPTY_FORM);
    } catch {
      toast.error("Gagal menyimpan vendor.");
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (vendorId: Id<"vendor">, next: VendorStatus) => {
    await setStatus({ vendorId, status: next });
    if (next === "lunas") bloom();
  };

  if (vendors === undefined) return <PageSkeleton />;

  return (
    <div className="sj-document-page sj-vendor-page space-y-4">
      <BackLink />
      <PageHeading
        kicker="Daftar nota vendor"
        title="Vendor pernikahan"
        summary={
          list.length === 0 ? (
            "Belum ada nota vendor yang tercatat."
          ) : (
            <>
              {list.length} vendor menagih{" "}
              <strong className="num font-semibold text-[var(--ink)]">{formatRupiah(totalCost)}</strong>.{" "}
              <strong className="num font-semibold text-[var(--ink)]">{formatRupiah(paidTotal)}</strong>{" "}
              sudah terbayar, dan{" "}
              <strong className="num font-semibold text-[var(--ink)]">{formatRupiah(remaining)}</strong>{" "}
              masih harus disiapkan.
            </>
          )
        }
      />

      <section className="sj-paper-sheet p-5" aria-label="Pembayaran vendor">
        <div className="grid gap-5 lg:grid-cols-12 lg:items-end">
          <div className="min-w-0 lg:col-span-7">
            <p className="max-w-[52ch] display-serif text-[1.5rem] leading-snug text-[var(--ink)] sm:text-[1.75rem]">
              {list.length === 0
                ? "Mulai dari vendor utama: katering, dekorasi, lalu dokumentasi."
                : `${lunasCount} dari ${list.length} vendor sudah lunas. ${list.length - lunasCount} nota masih berjalan.`}
            </p>
            <div className="mt-4">
              <StackBar
                label={`Terbayar ${formatRupiah(paidTotal)} dari total ${formatRupiah(totalCost)}`}
                segments={[
                  {
                    label: "Terbayar",
                    value: paidTotal,
                    tone: "positive",
                    title: `Terbayar ${formatRupiah(paidTotal)}`,
                  },
                  {
                    label: "Belum dibayar",
                    value: remaining,
                    tone: "accent",
                    title: `Belum dibayar ${formatRupiah(remaining)}`,
                  },
                ]}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[0.8125rem] text-[var(--ink-soft)]">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2 rounded-full bg-[var(--positive)]" />
                Terbayar <span className="num text-[var(--ink)]">{formatRupiah(paidTotal)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2 rounded-full bg-[var(--accent)]" />
                Belum dibayar <span className="num text-[var(--ink)]">{formatRupiah(remaining)}</span>
              </span>
            </div>
          </div>

          <div className="grid gap-2.5 border-t border-[var(--line)] pt-4 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <LedgerFigure label="Total biaya" value={formatRupiah(totalCost)} strong />
            <LedgerFigure label="Sudah dibayar" value={formatRupiah(paidTotal)} />
            <div className="sj-double-rule pt-2">
              <LedgerFigure label="Belum dibayar" value={formatRupiah(remaining)} strong />
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-soft)]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari vendor atau kategori…"
            aria-label="Cari vendor atau kategori"
            className="pl-9"
          />
        </div>
        <Button className="rounded-lg" onClick={openNew}>
          <Plus className="size-4" /> Tambah vendor
        </Button>
        <Button
          variant="outline"
          className="rounded-lg"
          onClick={() => {
            downloadCsv(
              "vendor-satujanji",
              ["Nama", "Kategori", "Kontak", "Biaya", "DP", "Terbayar", "Status", "Jatuh tempo", "Catatan"],
              list.map((vendor) => [
                vendor.name,
                vendor.category,
                vendor.contact ?? "",
                vendor.cost,
                vendor.dpAmount ?? 0,
                vendorPaidAmount(vendor),
                STATUS_OPTIONS.find((option) => option.key === vendor.status)?.label ?? vendor.status,
                vendor.dueDate ? new Date(vendor.dueDate).toLocaleDateString("id-ID") : "",
                vendor.note ?? "",
              ]),
            );
            toast.success("CSV vendor diunduh.");
          }}
        >
          <FileDown className="size-4" /> CSV
        </Button>
        <Button
          variant="outline"
          className="rounded-lg"
          onClick={() =>
            printDocument(
              "Daftar Vendor & Pembayaran",
              `${list.length} vendor · terbayar ${formatRupiah(paidTotal)} dari ${formatRupiah(totalCost)}`,
              [
                {
                  title: "Pembayaran vendor",
                  headers: ["Vendor", "Kategori", "Biaya", "Terbayar", "Sisa", "Status"],
                  rows: list.map((vendor) => [
                    vendor.name,
                    vendor.category,
                    formatRupiah(vendor.cost),
                    formatRupiah(vendorPaidAmount(vendor)),
                    formatRupiah(Math.max(0, vendor.cost - vendorPaidAmount(vendor))),
                    STATUS_OPTIONS.find((option) => option.key === vendor.status)?.label ?? vendor.status,
                  ]),
                },
              ],
            )
          }
        >
          <FileText className="size-4" /> PDF
        </Button>
      </div>

      <div className="flex flex-col gap-3 border-y border-[var(--line)] py-3 lg:flex-row lg:items-center lg:justify-between">
        {categories.length > 1 ? (
          <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-0.5">
            <button
              type="button"
              onClick={() => setCategoryFilter(null)}
              aria-pressed={categoryFilter === null}
              className={`min-h-11 shrink-0 border-b-2 px-2 text-sm transition-colors ${
                categoryFilter === null
                  ? "border-[var(--brand)] font-medium text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              Semua jenis
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={categoryFilter === category}
                onClick={() => setCategoryFilter(category)}
                className={`min-h-11 shrink-0 border-b-2 px-2 text-sm transition-colors ${
                  categoryFilter === category
                    ? "border-[var(--brand)] font-medium text-[var(--ink)]"
                    : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">
            {list.length > 0 ? "Semua nota dalam satu daftar." : "Nota vendor akan tersusun di sini."}
          </p>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {statusFilter && (
            <button
              type="button"
              onClick={() => setStatusFilter(null)}
              className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[0.8125rem] text-[var(--ink-soft)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            >
              <X className="size-3.5" /> Hapus filter status
            </button>
          )}
          <Segmented
            label="Saring menurut status pembayaran"
            className="sm:w-auto"
            value={statusFilter ?? "semua"}
            onChange={(next) =>
              setStatusFilter(next === "semua" ? null : (next as VendorStatus))
            }
            options={[
              { value: "semua", label: `Semua ${list.length}` },
              ...STATUS_OPTIONS.map((option) => ({
                value: option.key,
                label: `${option.label} ${list.filter((vendor) => vendor.status === option.key).length}`,
              })),
            ]}
          />
        </div>
      </div>

      <section>
        <Stagger className="border-t border-[var(--line)]">
          {visible.map((vendor) => {
            const status = vendor.status as VendorStatus;
            const paid = vendorPaidAmount(vendor);
            const left = Math.max(0, vendor.cost - paid);
            const wa = vendor.contact ? waLink(vendor.contact) : null;
            const due = vendor.dueDate ? dueLabel(vendor.dueDate) : null;
            const isOpen = expandedId === vendor._id;
            const paidPct = vendor.cost > 0 ? Math.round((paid / vendor.cost) * 100) : 0;
            return (
              <StaggerItem key={vendor._id}>
                <motion.article
                  layout={reducedMotion ? false : true}
                  className="sj-ledger-row interactive-row relative"
                >
                  <div className="flex items-start gap-1.5 p-3 sm:p-4">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`vendor-${vendor._id}-rincian`}
                      onClick={() => setExpandedId(isOpen ? null : vendor._id)}
                      className="flex min-h-11 min-w-0 flex-1 flex-col gap-2 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                    >
                      <span className="flex w-full items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate text-base font-semibold leading-snug text-[var(--ink)]">
                            {vendor.name}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-[var(--ink-soft)]">
                            <span className="inline-flex items-center gap-1.5 text-[var(--ink)]">
                              <StatusMark
                                status={status}
                                className={`size-3.5 ${status === "lunas" ? "text-[var(--positive)]" : status === "dp" ? "text-[var(--accent)]" : "text-[var(--ink-soft)]"}`}
                              />
                              {STATUS_LABEL[status]}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{vendor.category}</span>
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="num block text-base font-semibold leading-snug text-[var(--ink)]">
                            {formatRupiah(vendor.cost)}
                          </span>
                          <span className="num mt-0.5 block text-[0.8125rem] text-[var(--ink-soft)]">
                            {left > 0 ? `Sisa ${formatRupiah(left)}` : "Tidak ada sisa"}
                          </span>
                        </span>
                      </span>

                      <span className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem]">
                        {due && (
                          <span className={due.late ? "text-[var(--danger)]" : "text-[var(--ink-soft)]"}>
                            {due.text}
                          </span>
                        )}
                        {!due && status !== "lunas" && (
                          <span className="text-[var(--ink-soft)]">Tanpa jatuh tempo</span>
                        )}
                        {vendor.contact && (
                          <span className="truncate text-[var(--ink-soft)]">{vendor.contact}</span>
                        )}
                        <span className="ml-auto inline-flex shrink-0 items-center gap-1 font-medium text-[var(--brand)]">
                          {isOpen ? "Tutup rincian" : "Rincian"}
                          <ChevronDown
                            aria-hidden="true"
                            className={`size-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          />
                        </span>
                      </span>
                    </button>

                    <RowMenu
                      onEdit={() => openEdit(vendor)}
                      onDelete={() => {
                        removeVendor({ vendorId: vendor._id });
                        undoableDelete(
                          `Vendor "${vendor.name}" dihapus.`,
                          () =>
                            createVendor({
                              name: vendor.name,
                              category: vendor.category,
                              contact: vendor.contact,
                              cost: vendor.cost,
                              dpAmount: vendor.dpAmount,
                              note: vendor.note,
                              status: vendor.status,
                              dueDate: vendor.dueDate,
                            }),
                          { successMessage: `Vendor "${vendor.name}" kembali.` },
                        );
                      }}
                      deleteTitle={`Hapus ${vendor.name}?`}
                    />
                  </div>

                  <div className="flex items-center gap-2.5 px-3 pb-3 sm:px-4">
                    <div className="min-w-0 flex-1">
                      <StackBar
                        label={`Terbayar ${formatRupiah(paid)} dari ${formatRupiah(vendor.cost)}`}
                        segments={[
                          { label: "Terbayar", value: paid, tone: "positive", title: `Terbayar ${formatRupiah(paid)}` },
                          { label: "Belum dibayar", value: left, tone: "sunk", title: `Belum dibayar ${formatRupiah(left)}` },
                        ]}
                      />
                    </div>
                    <span className="num shrink-0 text-[0.8125rem] text-[var(--ink-soft)]">
                      {paidPct}%
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="detail"
                        id={`vendor-${vendor._id}-rincian`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reducedMotion ? 0 : 0.18 }}
                        className="border-t border-[var(--line)] px-4 pb-4 pt-3 sm:px-5"
                      >
                        <div className="grid gap-4 sm:grid-cols-12">
                          <div className="min-w-0 sm:col-span-7">
                            <p className="text-[0.8125rem] text-[var(--ink-soft)]">Catatan</p>
                            <p className="mt-1 max-w-[58ch] text-sm leading-relaxed text-[var(--ink)]">
                              {vendor.note?.trim() ? vendor.note : "Belum ada catatan untuk vendor ini."}
                            </p>
                            <p className="mt-3 num text-sm text-[var(--ink)]">
                              Terbayar {formatRupiah(paid)} dari {formatRupiah(vendor.cost)}
                            </p>
                          </div>
                          <div className="sm:col-span-5">
                            <p className="text-[0.8125rem] text-[var(--ink-soft)]">Kontak</p>
                            {vendor.contact ? (
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="num inline-flex min-h-11 items-center gap-1.5 text-sm text-[var(--ink)]">
                                  <Phone className="size-4 text-[var(--ink-soft)]" /> {vendor.contact}
                                </span>
                                {wa ? (
                                  <a
                                    href={wa}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`Chat WhatsApp ${vendor.name}`}
                                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 text-sm font-medium text-[var(--brand)] transition-transform duration-200 hover:border-[var(--brand)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                                  >
                                    <MessageCircle className="size-4" /> Chat WhatsApp
                                  </a>
                                ) : (
                                  <span className="text-[0.8125rem] text-[var(--ink-soft)]">
                                    Nomor belum bisa dipakai untuk WhatsApp.
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="mt-1 text-sm text-[var(--ink-soft)]">Belum ada kontak.</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 border-t border-[var(--line)] pt-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="w-full sm:max-w-sm">
                            <Segmented
                              label={`Status pembayaran ${vendor.name}`}
                              value={status}
                              onChange={(next) => void changeStatus(vendor._id, next)}
                              options={STATUS_OPTIONS.map((option) => ({
                                value: option.key,
                                label: option.label,
                              }))}
                            />
                          </div>
                          <p className="text-[0.8125rem] leading-relaxed text-[var(--ink-soft)]">
                            {status === "lunas"
                              ? "Nota ini sudah lunas."
                              : status === "dp"
                                ? `DP tercatat ${formatRupiah(paid)}; sisa ${formatRupiah(left)}.`
                                : `Belum ada pembayaran; sisa ${formatRupiah(left)}.`}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              </StaggerItem>
            );
          })}
        </Stagger>

        {list.length === 0 && vendors !== undefined && (
          <EmptyState
            emoji="🤝"
            title="Belum ada vendor"
            description="Catat katering, dekorasi, dokumentasi — lengkap dengan status bayarnya."
            actionLabel="Tambah vendor"
            onAction={openNew}
          />
        )}
        {list.length > 0 && visible.length === 0 && (
          <EmptyState
            emoji="🔍"
            title="Tidak ada vendor yang cocok"
            description="Coba ubah filter kategori atau kata kunci pencarian."
          />
        )}
      </section>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="display-serif text-2xl">
              {form.id ? "Ubah vendor" : "Vendor baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-name">Nama vendor</Label>
              <Input
                id="vendor-name"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="cth. Dapur Ibu Sari"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vendor-category">Jenis vendor</Label>
                <div className="relative">
                  <select
                    id="vendor-category"
                    value={form.category}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        category: event.target.value,
                      }))
                    }
                    className="h-9 w-full appearance-none rounded-xl border border-transparent bg-popover px-3 pr-9 text-sm"
                  >
                    {typeOptions.length === 0 && (
                      <option value="">
                        Belum ada jenis — atur di Pengaturan
                      </option>
                    )}
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-contact">Kontak</Label>
                <Input
                  id="vendor-contact"
                  value={form.contact}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, contact: event.target.value }))
                  }
                  placeholder="0812xxxxxxx"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vendor-cost">Biaya (Rp)</Label>
                <MoneyInput id="vendor-cost" value={form.cost} onChange={(cost) => setForm((prev) => ({ ...prev, cost }))} placeholder="5.000.000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-dp">Sudah DP (Rp)</Label>
                <MoneyInput id="vendor-dp" value={form.dpAmount} onChange={(dpAmount) => setForm((prev) => ({ ...prev, dpAmount }))} placeholder="1.000.000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status pembayaran</Label>
              <Segmented
                label="Status pembayaran vendor baru"
                value={form.status}
                onChange={(next) => setForm((prev) => ({ ...prev, status: next }))}
                options={STATUS_OPTIONS.map((option) => ({
                  value: option.key,
                  label: option.label,
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-due">Jatuh tempo pembayaran (opsional)</Label>
              <DateInputID id="vendor-due" value={form.due} onChange={(due) => setForm((prev) => ({ ...prev, due }))} ariaLabel="Jatuh tempo pembayaran, format hari/bulan/tahun" />
              <p className="meta">
                Tenggat DP / pelunasan — muncul di pengingat bila mendekati.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-note">Catatan (opsional)</Label>
              <Input
                id="vendor-note"
                value={form.note}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, note: event.target.value }))
                }
                placeholder="cth. sudah termasuk dekorasi"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={busy} className="w-full rounded-lg">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Simpan vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
