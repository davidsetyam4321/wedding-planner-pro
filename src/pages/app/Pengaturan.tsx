import { AccountSection } from "@/components/AccountSection";
import { BackLink, SectionHeader } from "@/components/Shared";
import { coupleInitials, useCouplePhotoUpload } from "@/components/CouplePhoto";
import { RingsMark } from "@/components/Decor";
import { PaletteSection } from "@/components/PaletteSettings";
import PixelTransition from "@/components/reactbits/PixelTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { fromDateInputValue, toDateInputValue } from "@/lib/format";
import { bloom } from "@/lib/bloom";
import { Camera, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

/** Pengaturan: identitas pernikahan dan target dana. */
export function PengaturanPage() {
  const wedding = useQuery(api.wedding.get);
  const couplePhoto = useQuery(api.wedding.getCouplePhoto);
  const updateSettings = useMutation(api.wedding.updateSettings);
  const removeCouplePhoto = useMutation(api.wedding.removeCouplePhoto);
  const vendorTypes = useQuery(api.wedding.getVendorCategories);
  const addVendorType = useMutation(api.wedding.addVendorCategory);
  const removeVendorType = useMutation(api.wedding.removeVendorCategory);
  const vendors = useQuery(api.vendors.list);
  const { uploading, openPicker, inputProps } = useCouplePhotoUpload();
  const [saving, setSaving] = useState(false);
  const [newVendorType, setNewVendorType] = useState("");
  const [typeBusy, setTypeBusy] = useState(false);

  const [partnerOne, setPartnerOne] = useState("");
  const [partnerTwo, setPartnerTwo] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [venue, setVenue] = useState("");
  const [target, setTarget] = useState("");
  const [seeded, setSeeded] = useState(false);

  // Seed the form once the document arrives, without an effect.
  if (wedding && !seeded) {
    setSeeded(true);
    setPartnerOne(wedding.partnerOneName);
    setPartnerTwo(wedding.partnerTwoName);
    setDateValue(toDateInputValue(wedding.weddingDate));
    setVenue(wedding.venueName ?? "");
    setTarget(String(wedding.fundTarget));
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!partnerOne.trim() || !partnerTwo.trim() || !dateValue) {
      toast.error("Nama dan tanggal pernikahan wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await updateSettings({
        partnerOneName: partnerOne,
        partnerTwoName: partnerTwo,
        weddingDate: fromDateInputValue(dateValue),
        fundTarget: Number(target) || 0,
        venueName: venue,
      });
      bloom();
      toast.success("Pengaturan tersimpan.");
    } catch {
      toast.error("Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  const types = vendorTypes ?? [];
  /** Jumlah vendor yang memakai sebuah jenis (tanpa membedakan huruf). */
  const usageOf = (name: string) => {
    const key = name.trim().toLowerCase();
    return (vendors ?? []).filter(
      (vendor) => vendor.category.trim().toLowerCase() === key,
    ).length;
  };

  const submitVendorType = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newVendorType.trim();
    if (!name) {
      toast.error("Isi nama jenis vendor dulu.");
      return;
    }
    if (types.some((type) => type.toLowerCase() === name.toLowerCase())) {
      toast.error("Jenis vendor sudah ada di daftar.");
      return;
    }
    setTypeBusy(true);
    try {
      await addVendorType({ name });
      setNewVendorType("");
      toast.success("Jenis vendor ditambahkan.");
    } catch {
      toast.error("Gagal menambahkan jenis vendor.");
    } finally {
      setTypeBusy(false);
    }
  };

  const deleteVendorType = async (name: string) => {
    // Divalidasi di sini juga supaya pesannya jelas, sebelum server menolak.
    const used = usageOf(name);
    if (used > 0) {
      toast.error(
        `Masih dipakai ${used} vendor — ubah jenis vendor mereka dulu.`,
      );
      return;
    }
    if (types.length <= 1) {
      toast.error("Minimal satu jenis vendor harus tersisa.");
      return;
    }
    try {
      await removeVendorType({ name });
      toast.success(`Jenis "${name}" dihapus.`);
    } catch {
      toast.error("Gagal menghapus jenis vendor.");
    }
  };

  return (
    <div className="space-y-4">
      <BackLink />

      <section className="clay p-5">
        <div className="flex items-center gap-3">
          <div className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-tint-rose text-lg text-tint-rose-foreground">
            ⚙️
          </div>
          <div>
            <p className="label text-muted-foreground">Preferensi ruang kerja</p>
            <p className="meta mt-1">Data ini dipakai di seluruh halaman</p>
          </div>
        </div>
      </section>

      <PaletteSection />

      <input type="file" accept="image/*" className="hidden" {...inputProps} />

      <AccountSection />

      <section className="clay overflow-hidden">
        <div className="relative aspect-[4/3] w-full bg-muted">
          {couplePhoto ? (
            <PixelTransition
              src={couplePhoto}
              alt="Foto pasangan"
              className="h-full w-full"
            />
          ) : (
            <div className="sky-band flex h-full w-full flex-col items-center justify-center gap-1.5">
              <RingsMark className="size-9 text-primary/25" />
              <p className="font-serif text-2xl font-semibold text-primary/60">
                {coupleInitials(wedding?.partnerOneName, wedding?.partnerTwoName)}
              </p>
              <p className="label text-muted-foreground">Belum ada foto</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 p-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 rounded-2xl"
            onClick={openPicker}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            {couplePhoto ? "Ganti foto" : "Unggah foto"}
          </Button>
          {couplePhoto && (
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              disabled={uploading}
              onClick={() => {
                void removeCouplePhoto();
                toast.success("Foto pasangan dihapus.");
              }}
            >
              <Trash2 className="size-4" /> Hapus
            </Button>
          )}
        </div>
        <p className="meta px-3 pb-3">
          Foto ini tampil di dashboard dan header aplikasi.
        </p>
      </section>

      <form className="clay space-y-3 p-4" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label htmlFor="set-p1">Nama Anda</Label>
          <Input
            id="set-p1"
            value={partnerOne}
            onChange={(e) => setPartnerOne(e.target.value)}
            placeholder="cth. Andra"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-p2">Nama pasangan</Label>
          <Input
            id="set-p2"
            value={partnerTwo}
            onChange={(e) => setPartnerTwo(e.target.value)}
            placeholder="cth. Rina"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-date">Tanggal pernikahan</Label>
          <Input
            id="set-date"
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-venue">Venue (opsional)</Label>
          <Input
            id="set-venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="cth. Gedung Kartika"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-target">Target dana (Rp)</Label>
          <Input
            id="set-target"
            type="number"
            min={0}
            step={100000}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="64000000"
          />
        </div>
        <Button type="submit" className="w-full rounded-2xl" disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Save className="size-4" /> Simpan pengaturan
            </>
          )}
        </Button>
      </form>

      <section className="clay p-4">
        <SectionHeader
          title="Jenis vendor"
          action={<span className="meta">{types.length} jenis</span>}
        />
        <p className="meta mb-2.5">
          Daftar ini yang tampil di dropdown halaman Vendor — tambah atau hapus
          jenisnya di sini.
        </p>
        <ul className="flex flex-wrap gap-2">
          {types.map((type) => {
            const used = usageOf(type);
            return (
              <li
                key={type}
                className="chip gap-1 bg-secondary text-secondary-foreground"
              >
                <span className="max-w-[14ch] truncate">{type}</span>
                {used > 0 && (
                  <span className="num text-[10px] text-muted-foreground">
                    {used}
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Hapus jenis ${type}`}
                  onClick={() => void deleteVendorType(type)}
                  className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </li>
            );
          })}
        </ul>
        <form className="mt-3 flex gap-2" onSubmit={submitVendorType}>
          <Input
            value={newVendorType}
            onChange={(event) => setNewVendorType(event.target.value)}
            placeholder="cth. Photobooth"
            aria-label="Jenis vendor baru"
            className="flex-1"
          />
          <Button
            type="submit"
            variant="secondary"
            className="shrink-0 rounded-2xl"
            disabled={typeBusy}
          >
            {typeBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Tambah
          </Button>
        </form>
      </section>
    </div>
  );
}
