import { CHART_COLORS, ChartCard, ChartTip } from "@/components/Charts";
import {
  BackLink,
  DueChip,
  EmptyState,
  PageSkeleton,
  RowMenu,
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
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { bloom } from "@/lib/bloom";
import { waLink } from "@/lib/contact";
import {
  formatRupiah,
  formatRupiahShort,
  fromDateInputValue,
  toDateInputValue,
} from "@/lib/format";
import {
  FileDown,
  FileText,
  Loader2,
  MessageCircle,
  Phone,
  Plus,
  Search,
  X,
} from "lucide-react";
import { downloadCsv } from "@/lib/exportCsv";
import { printDocument } from "@/lib/printDoc";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { undoableDelete } from "@/lib/undo";

type VendorStatus = "belum" | "dp" | "lunas";

const STATUS_OPTIONS: { key: VendorStatus; label: string }[] = [
  { key: "belum", label: "Belum" },
  { key: "dp", label: "DP" },
  { key: "lunas", label: "Lunas" },
];

const STATUS_CHIP: Record<VendorStatus, string> = {
  belum: "bg-secondary text-secondary-foreground",
  dp: "bg-tint-butter text-tint-butter-foreground",
  lunas: "bg-primary text-primary-foreground",
};

/** Garis aksen warna status di sisi kiri kartu vendor (SatuJanji tones). */
const STATUS_ACCENT: Record<VendorStatus, string> = {
  belum: "bg-border",
  dp: "bg-gold/70",
  lunas: "bg-primary",
};

/** Warna status pembayaran (inkwell navy → coral emphasis). */
const STATUS_COLORS: Record<VendorStatus, string> = {
  belum: "#e8e7e5",
  dp: "#fedf89",
  lunas: "#151b31",
};

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

/** Total yang benar-benar sudah dibayar untuk satu vendor. */
function paidFor(vendor: {
  cost: number;
  status: string;
  dpAmount?: number;
}): number {
  if (vendor.status === "lunas") return vendor.cost;
  if (vendor.status === "dp") return Math.min(vendor.cost, vendor.dpAmount ?? 0);
  return 0;
}

/** Vendor: kontak, biaya, dan status pembayaran. */
export function VendorPage() {
  const vendors = useQuery(api.vendors.list);
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

  const list = vendors ?? [];
  const categories = Array.from(new Set(list.map((v) => v.category)));
  const totalCost = list.reduce((sum, v) => sum + v.cost, 0);
  const paidTotal = list.reduce((sum, v) => sum + paidFor(v), 0);
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

  // Pie status pembayaran — klik irisan/legenda → filter daftar vendor.
  const statusPieData: {
    key: VendorStatus;
    name: string;
    value: number;
    color: string;
  }[] = STATUS_OPTIONS.map((option) => ({
    key: option.key,
    name: option.label,
    value: list.filter((vendor) => vendor.status === option.key).length,
    color: STATUS_COLORS[option.key],
  })).filter((row) => row.value > 0);

  // Stacked bar DP vs sisa (6 vendor termahal) — klik batang → fokus daftar ke vendor itu.
  const paymentBarData = [...list]
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 6)
    .map((vendor) => ({
      id: vendor._id as string,
      name: vendor.name,
      terbayar: paidFor(vendor),
      sisa: Math.max(0, vendor.cost - paidFor(vendor)),
    }));

  const openNew = () => {
    setForm(EMPTY_FORM);
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
    <div className="space-y-4">
      <BackLink />

      <section className="clay p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label text-muted-foreground">Status pembayaran</p>
            <p className="meta mt-1">
              {list.length} vendor · {lunasCount} lunas · {categories.length} kategori
            </p>
          </div>
          <div className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-tint-butter text-xl text-tint-butter-foreground">
            📋
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2">
          <div className="stat-tile bg-secondary">
            <dt>Total biaya</dt>
            <dd>{formatRupiahShort(totalCost)}</dd>
          </div>
          <div className="stat-tile bg-secondary">
            <dt>Terbayar</dt>
            <dd>{formatRupiahShort(paidTotal)}</dd>
          </div>
          <div className="stat-tile bg-secondary">
            <dt>Sisa</dt>
            <dd>{formatRupiahShort(remaining)}</dd>
          </div>
        </dl>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-tint-sage">
          <div
            className="fill-botanical h-full rounded-full transition-all duration-700"
            style={{
              width: `${totalCost > 0 ? Math.round((paidTotal / totalCost) * 100) : 0}%`,
            }}
          />
        </div>
      </section>

      {statusPieData.length > 0 && (
        <ChartCard title="Status pembayaran" meta="Klik irisan untuk filter">
          <div className="flex items-center gap-4">
            <div className="relative size-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={58}
                    paddingAngle={3}
                    cornerRadius={6}
                    strokeWidth={0}
                  >
                    {statusPieData.map((row) => (
                      <Cell
                        key={row.key}
                        fill={row.color}
                        className="cursor-pointer"
                        onClick={() =>
                          setStatusFilter((previous) =>
                            previous === row.key ? null : row.key,
                          )
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="num text-sm font-extrabold">{list.length}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  vendor
                </span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-1.5">
              {statusPieData.map((row) => (
                <li key={row.key}>
                  <button
                    type="button"
                    onClick={() =>
                      setStatusFilter((previous) =>
                        previous === row.key ? null : row.key,
                      )
                    }
                    className="flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-xs transition-colors hover:bg-secondary"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-left font-semibold">
                      {row.name}
                    </span>
                    <span className="num font-bold">{row.value}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>
      )}

      {paymentBarData.length > 0 && (
        <ChartCard title="DP vs sisa pembayaran" meta="Klik batang untuk fokus vendor">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={paymentBarData}
                layout="vertical"
                margin={{ top: 4, right: 8, bottom: 0, left: 4 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="rgba(21,27,49,0.12)"
                />
                <XAxis
                  type="number"
                  tickFormatter={(value: number | string) =>
                    formatRupiahShort(Number(value))
                  }
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={94}
                />
                <Tooltip
                  content={<ChartTip format={formatRupiahShort} />}
                  cursor={{ fill: "rgba(21,27,49,0.06)" }}
                />
                <Bar
                  dataKey="terbayar"
                  name="Terbayar"
                  stackId="bayar"
                  fill="#151b31"
                  barSize={14}
                >
                  {paymentBarData.map((row) => (
                    <Cell
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => setQuery(row.name)}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="sisa"
                  name="Sisa"
                  stackId="bayar"
                  fill={CHART_COLORS[3]}
                  radius={[0, 4, 4, 0]}
                  barSize={14}
                >
                  {paymentBarData.map((row) => (
                    <Cell
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => setQuery(row.name)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#151b31]" /> Terbayar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#fedf89]" /> Sisa
            </span>
          </div>
        </ChartCard>
      )}

      <div className="flex gap-2">
        <Button className="flex-1 rounded-2xl" onClick={openNew}>
          <Plus className="size-4" /> Tambah vendor
        </Button>
        <Button
          variant="outline"
          className="rounded-2xl"
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
                paidFor(vendor),
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
          className="rounded-2xl"
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
                    formatRupiah(paidFor(vendor)),
                    formatRupiah(Math.max(0, vendor.cost - paidFor(vendor))),
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari vendor atau kategori…"
          className="pl-9"
        />
      </div>

      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategoryFilter(null)}
            className={`chip shrink-0 ${
              categoryFilter === null
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            Semua
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category)}
              className={`chip shrink-0 ${
                categoryFilter === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-tint-butter text-tint-butter-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {statusFilter && (
        <button
          type="button"
          onClick={() => setStatusFilter(null)}
          className="chip self-start bg-tint-butter text-tint-butter-foreground"
        >
          Status: {STATUS_OPTIONS.find((option) => option.key === statusFilter)?.label}{" "}
          <X className="size-3" />
        </button>
      )}

      <section className="space-y-3">
        <Stagger className="space-y-3">
          {visible.map((vendor) => {
            const status = vendor.status as VendorStatus;
            const paid = paidFor(vendor);
            const left = Math.max(0, vendor.cost - paid);
            const wa = vendor.contact ? waLink(vendor.contact) : null;
            return (
              <StaggerItem key={vendor._id}>
                <article className="clay relative overflow-hidden p-4 pl-5">
                  <span
                    className={`absolute inset-y-0 left-0 w-1.5 ${STATUS_ACCENT[status]}`}
                    aria-hidden
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold truncate">{vendor.name}</p>
                      <p className="meta">
                        {vendor.category}
                        {vendor.contact ? ` · ${vendor.contact}` : ""}
                      </p>
                      {vendor.note && <p className="meta mt-0.5 italic">{vendor.note}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
                        <p className="num text-sm font-extrabold">
                          {formatRupiah(vendor.cost)}
                        </p>
                        {left > 0 && (
                          <p className="num meta">sisa {formatRupiahShort(left)}</p>
                        )}
                      </div>
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
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="clay-inset flex gap-1 p-1">
                      {STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => void changeStatus(vendor._id, option.key)}
                          className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors ${
                            status === option.key
                              ? STATUS_CHIP[option.key]
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {paid > 0 && (
                      <span className="chip bg-tint-mint text-tint-mint-foreground">
                        Terbayar {formatRupiahShort(paid)}
                      </span>
                    )}

                    {vendor.dueDate && status !== "lunas" && (
                      <DueChip dueDate={vendor.dueDate} />
                    )}

                    {vendor.contact &&
                      (wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noreferrer"
                          className="chip bg-secondary text-secondary-foreground"
                          aria-label="Chat WhatsApp"
                        >
                          <MessageCircle className="size-3.5" /> Chat
                        </a>
                      ) : (
                        <span className="chip bg-secondary text-secondary-foreground">
                          <Phone className="size-3.5" /> {vendor.contact}
                        </span>
                      ))}
                  </div>
                </article>
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{form.id ? "Ubah vendor" : "Vendor baru"}</DialogTitle>
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
                <Label htmlFor="vendor-category">Kategori</Label>
                <Input
                  id="vendor-category"
                  list="vendor-categories"
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                  placeholder="cth. Katering"
                />
                <datalist id="vendor-categories">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
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
                <Input
                  id="vendor-cost"
                  type="number"
                  min={0}
                  step={100000}
                  value={form.cost}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, cost: event.target.value }))
                  }
                  placeholder="5000000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-dp">Sudah DP (Rp)</Label>
                <Input
                  id="vendor-dp"
                  type="number"
                  min={0}
                  step={100000}
                  value={form.dpAmount}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, dpAmount: event.target.value }))
                  }
                  placeholder="1000000"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status pembayaran</Label>
              <div className="clay-inset flex gap-1 p-1">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, status: option.key }))
                    }
                    className={`flex-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                      form.status === option.key
                        ? STATUS_CHIP[option.key]
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-due">Jatuh tempo pembayaran (opsional)</Label>
              <Input
                id="vendor-due"
                type="date"
                value={form.due}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, due: event.target.value }))
                }
              />
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
            <Button onClick={submit} disabled={busy} className="w-full rounded-2xl">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Simpan vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
