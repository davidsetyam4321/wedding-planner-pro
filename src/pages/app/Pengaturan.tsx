import { AccountSection } from "@/components/AccountSection";
import { BackLink } from "@/components/Shared";
import { coupleInitials, useCouplePhotoUpload } from "@/components/CouplePhoto";
import { RingsMark } from "@/components/Decor";
import { PaletteSection } from "@/components/PaletteSettings";
import { useVisualStyle } from "@/components/VisualStyleProvider";
import { Switch } from "@/components/ui/switch";
import { Label as UiLabel } from "@/components/ui/label";
import PixelTransition from "@/components/reactbits/PixelTransition";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { fromDateInputValue, toDateInputValue } from "@/lib/format";
import { DateInputID, MoneyInput } from "@/components/Shared";
import { bloom } from "@/lib/bloom";
import { Camera, Loader2, Plus, Save, Trash2, X } from "@/lib/icons";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

/** Daftar isi halaman; jangkar biasa supaya tetap ringan di HP. */
const SECTIONS = [
  { id: "identitas", label: "Identitas pernikahan" },
  { id: "foto-hero", label: "Foto hero" },
  { id: "efek-visual", label: "Efek visual dan animasi" },
  { id: "tema", label: "Tema dan warna" },
  { id: "akun", label: "Akun dan pasangan" },
  { id: "jenis-vendor", label: "Jenis vendor" },
];

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
  const { style, setStyle } = useVisualStyle();
  const [saving, setSaving] = useState(false);
  const [newVendorType, setNewVendorType] = useState("");
  const [typeBusy, setTypeBusy] = useState(false);
  const [pendingDeleteType, setPendingDeleteType] = useState<string | null>(null);

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
      toast.success("Tersimpan.");
    } catch {
      toast.error("Pengaturan gagal disimpan. Coba lagi sebentar.");
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
      toast.error("Jenis vendor gagal ditambahkan. Coba lagi sebentar.");
    } finally {
      setTypeBusy(false);
    }
  };

  const deleteVendorType = async () => {
    if (!pendingDeleteType) return;
    const name = pendingDeleteType;
    // Recheck against current reactive data before committing the deletion.
    const used = usageOf(name);
    if (used > 0) {
      toast.error(
        `Masih dipakai ${used} vendor — ubah jenis vendor mereka dulu.`,
      );
      setPendingDeleteType(null);
      return;
    }
    if (types.length <= 1) {
      toast.error("Minimal satu jenis vendor harus tersisa.");
      setPendingDeleteType(null);
      return;
    }
    try {
      await removeVendorType({ name });
      toast.success(`Jenis "${name}" dihapus.`);
    } catch {
      toast.error("Jenis vendor gagal dihapus. Coba lagi sebentar.");
    } finally {
      setPendingDeleteType(null);
    }
  };

  return (
    <div className="sj-document-page sj-settings-page space-y-6">
      <BackLink />

      <header className="sj-page-heading border-b border-[var(--line)] pb-4">
        <p className="text-sm text-[var(--ink-soft)]">Ruang kerja berdua</p>
        <h1 className="mt-1 font-serif text-[clamp(2.25rem,4vw,3.5rem)] leading-tight text-[var(--ink)]">
          Pengaturan
        </h1>
        <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-[var(--ink-soft)]">
          Identitas, tema, akun, dan jenis vendor yang dipakai berdua.
        </p>
      </header>

      <input type="file" accept="image/*" className="hidden" {...inputProps} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <nav
          aria-label="Isi halaman pengaturan"
          className="lg:sticky lg:top-6 lg:self-start"
        >
          <p className="text-sm text-[var(--ink-soft)]">Isi halaman</p>
          <ul className="mt-1">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex min-h-11 items-center border-b border-[var(--line)] text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">
          <section id="identitas" className="sj-paper-sheet scroll-mt-24 p-5">
            <h2 className="font-serif text-xl text-[var(--ink)]">
              Identitas pernikahan
            </h2>
            <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-[var(--ink-soft)]">
              Nama, tanggal, venue, dan target dana ini yang dibaca seluruh
              halaman.
            </p>
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
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
                <DateInputID
                  id="set-date"
                  value={dateValue}
                  onChange={setDateValue}
                  ariaLabel="Tanggal pernikahan, format hari/bulan/tahun"
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
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="set-target">Target dana (Rp)</Label>
                <MoneyInput
                  id="set-target"
                  value={target}
                  onChange={setTarget}
                  placeholder="64.000.000"
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  className="w-full rounded-lg sm:w-auto"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="size-4" /> Simpan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </section>

          <section
            id="foto-hero"
            className="sj-paper-sheet scroll-mt-24 overflow-hidden"
          >
            <div className="p-5 pb-4">
              <h2 className="font-serif text-xl text-[var(--ink)]">Foto hero</h2>
              <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-[var(--ink-soft)]">
                Pratinjau ini memakai rasio dan posisi yang sama dengan hero di
                dashboard.
              </p>
            </div>
            <div className="relative aspect-[4/3] w-full bg-[var(--paper-sunk)]">
              {couplePhoto ? (
                <PixelTransition
                  src={couplePhoto}
                  alt="Foto pasangan"
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
                  <RingsMark className="size-9 text-[var(--ink-soft)]/40" />
                  <p className="font-serif text-2xl text-[var(--ink-soft)]">
                    {coupleInitials(
                      wedding?.partnerOneName,
                      wedding?.partnerTwoName,
                    )}
                  </p>
                  <p className="text-[0.8125rem] text-[var(--ink-soft)]">
                    Belum ada foto
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 p-4">
              <Button
                type="button"
                variant="secondary"
                className="rounded-lg"
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
                  className="rounded-lg"
                  disabled={uploading}
                  onClick={async () => {
                    try {
                      await removeCouplePhoto();
                      toast.success("Foto hero dihapus.");
                    } catch {
                      toast.error("Foto gagal dihapus. Coba lagi sebentar.");
                    }
                  }}
                >
                  <Trash2 className="size-4" /> Hapus
                </Button>
              )}
            </div>
          </section>

          <section
            id="efek-visual"
            className="sj-paper-sheet scroll-mt-24 p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <UiLabel
                  htmlFor="visual-style"
                  className="text-base text-[var(--ink)]"
                >
                  Efek visual dan animasi
                </UiLabel>
                <p className="mt-1 max-w-[52ch] text-sm leading-relaxed text-[var(--ink-soft)]">
                  Matikan untuk permukaan solid dan gerak minimal.
                </p>
              </div>
              <Switch
                id="visual-style"
                checked={style === "unlumen"}
                onCheckedChange={(enabled) =>
                  setStyle(enabled ? "unlumen" : "classic")
                }
                aria-label="Aktifkan efek visual dan animasi"
              />
            </div>
          </section>

          <section id="tema" className="scroll-mt-24">
            <PaletteSection />
          </section>

          <section id="akun" className="scroll-mt-24">
            <AccountSection />
          </section>

          <section
            id="jenis-vendor"
            className="sj-paper-sheet scroll-mt-24 p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="font-serif text-xl text-[var(--ink)]">
                Jenis vendor
              </h2>
              <p className="num text-[0.8125rem] text-[var(--ink-soft)]">
                {types.length} jenis
              </p>
            </div>
            <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-[var(--ink-soft)]">
              Daftar ini yang tampil di dropdown halaman Vendor.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {types.map((type) => {
                const used = usageOf(type);
                return (
                  <li
                    key={type}
                    className="chip gap-1 border-[var(--line)] bg-transparent text-[var(--ink)]"
                  >
                    <span className="max-w-[14ch] truncate">{type}</span>
                    {used > 0 && (
                      <span className="num text-[0.8125rem] text-[var(--ink-soft)]">
                        {used}
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={`Hapus jenis ${type}`}
                      onClick={() => setPendingDeleteType(type)}
                      className="flex size-6 items-center justify-center rounded-md text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-sunk)] hover:text-[var(--danger)]"
                    >
                      <X className="size-3.5" />
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
                className="shrink-0 rounded-lg"
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
      </div>

      <AlertDialog
        open={pendingDeleteType !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteType(null);
        }}
      >
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus jenis vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              Jenis “{pendingDeleteType}” akan dihapus dari daftar. Penghapusan
              hanya dapat dilakukan jika tidak ada vendor yang menggunakannya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void deleteVendorType()}
            >
              Hapus jenis
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
