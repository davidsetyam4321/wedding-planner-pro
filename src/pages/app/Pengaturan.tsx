import { AccountSection } from "@/components/AccountSection";
import { BackLink, PageHeading } from "@/components/Shared";
import { coupleInitials, useCouplePhotoUpload } from "@/components/CouplePhoto";
import { RingsMark } from "@/components/Decor";
import { PaletteSection } from "@/components/PaletteSettings";
import { useVisualStyle } from "@/components/VisualStyleProvider";
import { Switch } from "@/components/ui/switch";
import { Label as UiLabel } from "@/components/ui/label";
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
import { Camera, Check, Loader2, Plus, Save, Trash2, X } from "@/lib/icons";
import { useEffect, useState } from "react";
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
  const [justSaved, setJustSaved] = useState(false);
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

  useEffect(() => {
    if (!justSaved) return;
    const timeout = window.setTimeout(() => setJustSaved(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [justSaved]);

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
      setJustSaved(true);
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

      <PageHeading
        kicker="Ruang kerja berdua"
        title="Pengaturan"
        summary="Identitas, tema, akun, dan jenis vendor yang dipakai berdua. Semua perubahan langsung terlihat di halaman lain."
      />

      <input type="file" accept="image/*" className="hidden" {...inputProps} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <nav
          aria-label="Isi halaman pengaturan"
          className="lg:sticky lg:top-6 lg:self-start"
        >
          <p className="hidden text-sm text-[var(--ink-soft)] lg:block">Isi halaman</p>
          {/* HP: daftar teks yang bisa digeser; desktop: daftar vertikal. */}
          <ul className="-mx-1 flex gap-5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:mt-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
            {SECTIONS.map((section) => (
              <li key={section.id} className="shrink-0">
                <a
                  href={`#${section.id}`}
                  className="flex min-h-11 items-center whitespace-nowrap border-b border-transparent text-sm text-[var(--ink-soft)] transition-colors hover:border-[var(--line)] hover:text-[var(--ink)] lg:w-full lg:whitespace-normal lg:border-[var(--line)]"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">
          <section id="identitas" className="sj-paper-sheet scroll-mt-24 p-5 sm:p-6">
            <h2 className="display-serif text-2xl leading-snug text-[var(--ink)]">
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
              <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                <Button
                  type="submit"
                  className="min-h-11 rounded-lg transition-transform active:scale-[0.97] sm:w-auto"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : justSaved ? (
                    <>
                      <Check className="size-4" /> Tersimpan
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> Simpan
                    </>
                  )}
                </Button>
                <p
                  role="status"
                  className="text-[0.8125rem] text-[var(--ink-soft)]"
                >
                  {justSaved
                    ? "Perubahan tersimpan di kedua perangkat."
                    : "Berlaku untuk seluruh halaman."}
                </p>
              </div>
            </form>
          </section>

          <section
            id="foto-hero"
            className="sj-paper-sheet scroll-mt-24 overflow-hidden"
          >
            <div className="p-5 pb-4 sm:p-6 sm:pb-4">
              <h2 className="display-serif text-2xl leading-snug text-[var(--ink)]">
                Foto hero
              </h2>
              <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-[var(--ink-soft)]">
                Pratinjau di bawah memakai rasio dan titik fokus yang sama dengan
                hero di Beranda. Foto tajam, tanpa blur.
              </p>
            </div>
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--paper-sunk)] sm:aspect-[16/9]">
              {couplePhoto ? (
                <img
                  src={couplePhoto}
                  alt="Pratinjau foto hero"
                  className="h-full w-full object-cover object-center"
                  style={{ objectPosition: "center" }}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
                  <RingsMark className="size-9 text-[var(--ink-soft)]/40" />
                  <p className="display-serif text-2xl text-[var(--ink-soft)]">
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
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 border border-white/25"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 p-4 sm:px-6">
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 rounded-lg transition-transform active:scale-[0.97]"
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
                  className="min-h-11 rounded-lg transition-transform active:scale-[0.97]"
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
            className="sj-paper-sheet scroll-mt-24 p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <UiLabel
                  htmlFor="visual-style"
                  className="display-serif text-xl text-[var(--ink)]"
                >
                  Efek visual dan animasi
                </UiLabel>
                <p className="mt-1.5 max-w-[56ch] text-sm leading-relaxed text-[var(--ink-soft)]">
                  Saat aktif, latar bergerak halus, permukaan berlapis, dan
                  transisi terasa hidup. Saat dimatikan, semua permukaan solid
                  dan gerak dipangkas jadi crossfade singkat.
                </p>
                <p className="mt-2 text-[0.8125rem] text-[var(--ink-soft)]">
                  {style === "unlumen"
                    ? "Efek visual sedang aktif di perangkat ini."
                    : "Efek visual sedang dimatikan di perangkat ini."}
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
            className="sj-paper-sheet scroll-mt-24 p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="display-serif text-2xl leading-snug text-[var(--ink)]">
                Jenis vendor
              </h2>
              <p className="num text-[0.8125rem] text-[var(--ink-soft)]">
                {types.length} jenis
              </p>
            </div>
            <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-[var(--ink-soft)]">
              Daftar ini yang tampil di pilihan jenis saat menambah vendor.
            </p>
            <ul className="mt-3 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {types.map((type) => {
                const used = usageOf(type);
                return (
                  <li
                    key={type}
                    className="interactive-row flex min-h-12 items-center gap-3 px-1 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--ink)]">
                      {type}
                    </span>
                    <span className="num shrink-0 text-[0.8125rem] text-[var(--ink-soft)]">
                      {used > 0 ? `dipakai ${used} vendor` : "belum dipakai"}
                    </span>
                    <button
                      type="button"
                      aria-label={`Hapus jenis ${type}`}
                      onClick={() => setPendingDeleteType(type)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-sunk)] hover:text-[var(--danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={submitVendorType}>
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
                className="min-h-11 shrink-0 rounded-lg transition-transform active:scale-[0.97]"
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
