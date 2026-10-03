import { FlowerMark } from "@/components/Decor";
import {
  BackLink,
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
import { formatRupiah, formatRupiahShort } from "@/lib/format";
import {
  Loader2,
  MessageCircle,
  Phone,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

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

/** Garis aksen warna status di sisi kiri kartu vendor. */
const STATUS_ACCENT: Record<VendorStatus, string> = {
  belum: "bg-muted-foreground/30",
  dp: "bg-amber-400",
  lunas: "bg-emerald-500",
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

  const list = vendors ?? [];
  const categories = Array.from(new Set(list.map((v) => v.category)));
  const totalCost = list.reduce((sum, v) => sum + v.cost, 0);
  const paidTotal = list.reduce((sum, v) => sum + paidFor(v), 0);
  const remaining = Math.max(0, totalCost - paidTotal);
  const lunasCount = list.filter((v) => v.status === "lunas").length;

  const visible = list.filter((vendor) => {
    if (categoryFilter && vendor.category !== categoryFilter) return false;
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return (
      vendor.name.toLowerCase().includes(term) ||
      vendor.category.toLowerCase().includes(term)
    );
  });

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
      <BackLink fallback="/app/lainnya" />

      <section className="clay grad-butter relative overflow-hidden p-5 text-tint-butter-foreground">
        <FlowerMark className="float-slow pointer-events-none absolute -right-3 -top-3 size-20 opacity-25" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h1 className="h-page">Vendor</h1>
            <p className="meta">
              {list.length} vendor · {lunasCount} lunas · {categories.length} kategori
            </p>
          </div>
          <div className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-white/70 text-xl">
            📋
          </div>
        </div>
        <dl className="relative mt-4 grid grid-cols-3 gap-2">
          <div className="stat-tile bg-white/70">
            <dt>Total biaya</dt>
            <dd>{formatRupiahShort(totalCost)}</dd>
          </div>
          <div className="stat-tile bg-white/70">
            <dt>Terbayar</dt>
            <dd>{formatRupiahShort(paidTotal)}</dd>
          </div>
          <div className="stat-tile bg-white/70">
            <dt>Sisa</dt>
            <dd>{formatRupiahShort(remaining)}</dd>
          </div>
        </dl>
        <div className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${totalCost > 0 ? Math.round((paidTotal / totalCost) * 100) : 0}%`,
            }}
          />
        </div>
      </section>

      <Button className="w-full rounded-2xl" onClick={openNew}>
        <Plus className="size-4" /> Tambah vendor
      </Button>

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
                          toast.success("Vendor dihapus.");
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
