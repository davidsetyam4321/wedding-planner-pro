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
import { formatRupiah, formatRupiahShort } from "@/lib/format";
import { ChevronLeft, Loader2, Phone, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

const STATUS_LABEL = {
  belum: "Belum bayar",
  dp: "Sudah DP",
  lunas: "Lunas",
} as const;

type VendorStatus = keyof typeof STATUS_LABEL;

/** Vendor: kontak, biaya, dan status pembayaran. */
export function VendorPage() {
  const vendors = useQuery(api.vendors.list);
  const createVendor = useMutation(api.vendors.create);
  const setStatus = useMutation(api.vendors.setStatus);
  const removeVendor = useMutation(api.vendors.remove);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [contact, setContact] = useState("");
  const [cost, setCost] = useState("");
  const [saving, setSaving] = useState(false);

  const list = vendors ?? [];
  const totalCost = list.reduce((sum, v) => sum + v.cost, 0);
  const paid = list.filter((v) => v.status === "lunas");
  const paidAmount = paid.reduce((sum, v) => sum + v.cost, 0);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Nama vendor wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await createVendor({ name, category, contact, cost: Number(cost) || 0 });
      toast.success("Vendor ditambahkan.");
      setOpen(false);
      setName("");
      setCategory("");
      setContact("");
      setCost("");
    } catch {
      toast.error("Gagal menambah vendor.");
    } finally {
      setSaving(false);
    }
  };

  const cycleStatus = async (vendorId: (typeof list)[number]["_id"], current: VendorStatus) => {
    const next: VendorStatus =
      current === "belum" ? "dp" : current === "dp" ? "lunas" : "belum";
    await setStatus({ vendorId, status: next });
  };

  return (
    <div className="space-y-4">
      <Link
        to="/app/lainnya"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
      >
        <ChevronLeft className="size-3.5" /> Lainnya
      </Link>

      <section className="clay p-5">
        <div className="flex items-center gap-3">
          <div className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-accent text-lg">
            📋
          </div>
          <div>
            <h1 className="text-lg font-extrabold leading-tight">Vendor</h1>
            <p className="text-[11px] text-muted-foreground">
              {list.length} vendor terdaftar
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="clay-inset rounded-2xl px-3 py-2">
            <p className="text-[10px] font-medium text-muted-foreground">Total biaya</p>
            <p className="text-sm font-bold">{formatRupiahShort(totalCost)}</p>
          </div>
          <div className="clay-inset rounded-2xl px-3 py-2">
            <p className="text-[10px] font-medium text-muted-foreground">Sudah lunas</p>
            <p className="text-sm font-bold text-primary">
              {formatRupiahShort(paidAmount)}{" "}
              <span className="text-[10px] font-medium text-muted-foreground">
                ({paid.length})
              </span>
            </p>
          </div>
        </div>
      </section>

      <Button className="w-full rounded-2xl" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Tambah vendor
      </Button>

      <section className="space-y-3">
        {list.map((vendor) => (
          <div key={vendor._id} className="clay p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{vendor.name}</p>
                <p className="text-[11px] text-muted-foreground">{vendor.category}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-bold">{formatRupiah(vendor.cost)}</span>
                <button
                  type="button"
                  aria-label="Hapus vendor"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    removeVendor({ vendorId: vendor._id });
                    toast.success("Vendor dihapus.");
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => cycleStatus(vendor._id, vendor.status as VendorStatus)}
                className={`rounded-xl px-3 py-1.5 text-[11px] font-bold clay-sm transition-all ${
                  vendor.status === "lunas"
                    ? "bg-primary text-primary-foreground"
                    : vendor.status === "dp"
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-secondary-foreground"
                }`}
              >
                {STATUS_LABEL[vendor.status as VendorStatus]}
              </button>
              {vendor.contact && (
                <span className="clay-inset flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] text-muted-foreground">
                  <Phone className="size-3" /> {vendor.contact}
                </span>
              )}
            </div>
          </div>
        ))}

        {vendors !== undefined && list.length === 0 && (
          <div className="clay-inset flex h-24 items-center justify-center rounded-3xl text-xs text-muted-foreground">
            Belum ada vendor. Catat vendor pertamamu!
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Vendor baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-name">Nama vendor</Label>
              <Input
                id="vendor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Dapur Ibu Sari"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-category">Kategori</Label>
              <Input
                id="vendor-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="cth. Katering"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-contact">Kontak (opsional)</Label>
              <Input
                id="vendor-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="cth. 0812-3456-7890"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-cost">Biaya (Rp)</Label>
              <Input
                id="vendor-cost"
                type="number"
                min={0}
                step={100000}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="5000000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={saving} className="w-full rounded-2xl">
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Simpan vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
