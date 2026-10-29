import {
  BackLink,
  EmptyState,
  PageHeading,
  PageSkeleton,
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
import {
  ChevronLeft,
  ChevronRight,
  Images,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "@/lib/icons";
import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

type BoxId = Id<"moodboardBox">;

const MAX_PHOTOS = 12;

/** Rasio bergantian supaya papan terasa seperti kolase, bukan grid seragam. */
const TILE_RATIO = ["aspect-[4/5]", "aspect-[3/4]", "aspect-square", "aspect-[5/6]"];

export function MoodboardPage() {
  const categories = useQuery(api.moodboard.listCategories);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categoryNames = (categories ?? []).map((c) => c.name);
  const current = activeCategory ?? categoryNames[0] ?? "Dekorasi";

  const boxes = useQuery(api.moodboard.listBoxes, { category: current });
  const createCategory = useMutation(api.moodboard.createCategory);
  const renameCategory = useMutation(api.moodboard.renameCategory);
  const deleteCategory = useMutation(api.moodboard.deleteCategory);
  const createBox = useMutation(api.moodboard.createBox);
  const updateBox = useMutation(api.moodboard.updateBox);
  const deleteBox = useMutation(api.moodboard.deleteBox);
  const addPhoto = useMutation(api.moodboard.addPhoto);
  const removePhoto = useMutation(api.moodboard.removePhoto);
  const updateCaption = useMutation(api.moodboard.updatePhotoCaption);
  const generateUploadUrl = useAction(api.files.generateUploadUrl);
  const reducedMotion = useReducedMotion();

  const [categoryDialog, setCategoryDialog] = useState<"add" | "manage" | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [busy, setBusy] = useState(false);

  const [boxDialog, setBoxDialog] = useState<{ id?: BoxId; title: string } | null>(null);
  const [openBoxId, setOpenBoxId] = useState<BoxId | null>(null);
  const [uploadingBox, setUploadingBox] = useState<BoxId | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lightbox, setLightbox] = useState<{ boxId: BoxId; index: number } | null>(null);
  const [caption, setCaption] = useState("");
  const [query, setQuery] = useState("");

  const activeBox = (boxes ?? []).find((box) => box._id === openBoxId) ?? null;
  const lightboxBox = (boxes ?? []).find((box) => box._id === lightbox?.boxId) ?? null;
  const lightboxPhoto =
    lightboxBox && lightbox ? lightboxBox.photos[lightbox.index] ?? null : null;

  const totalPhotos = (boxes ?? []).reduce((sum, box) => sum + box.photos.length, 0);

  // Pencarian: judul kotak dan caption foto yang cocok, masih di kategori
  // yang sedang dibuka.
  const term = query.trim().toLowerCase();
  const visibleBoxes = (boxes ?? []).filter(
    (box) =>
      term === "" ||
      box.title.toLowerCase().includes(term) ||
      box.photos.some((photo) =>
        (photo.caption ?? "").toLowerCase().includes(term),
      ),
  );

  const submitCategory = async () => {
    if (!categoryName.trim()) return;
    setBusy(true);
    try {
      await createCategory({ name: categoryName });
      setActiveCategory(categoryName.trim());
      setCategoryName("");
      setCategoryDialog(null);
      bloom();
      toast.success("Kategori ditambahkan.");
    } catch {
      toast.error("Kategori itu sudah ada.");
    } finally {
      setBusy(false);
    }
  };

  const submitBox = async () => {
    if (!boxDialog || !boxDialog.title.trim()) {
      toast.error("Isi judul kotak dulu, ya.");
      return;
    }
    setBusy(true);
    try {
      if (boxDialog.id) {
        await updateBox({ boxId: boxDialog.id, title: boxDialog.title });
        toast.success("Kotak diperbarui.");
      } else {
        await createBox({ category: current, title: boxDialog.title });
        bloom();
        toast.success("Kotak ditambahkan.");
      }
      setBoxDialog(null);
    } catch {
      toast.error("Gagal menyimpan kotak.");
    } finally {
      setBusy(false);
    }
  };

  const moveBox = async (boxId: BoxId, category: string) => {
    try {
      await updateBox({ boxId, category });
      setOpenBoxId(null);
      toast.success(`Dipindah ke ${category}.`);
    } catch {
      toast.error("Gagal memindahkan kotak.");
    }
  };

  const openFilePicker = (boxId: BoxId) => {
    setUploadingBox(boxId);
    fileInputRef.current?.click();
  };

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    const boxId = uploadingBox;
    if (files.length === 0 || !boxId) return;

    let added = 0;
    for (const file of files.slice(0, MAX_PHOTOS)) {
      try {
        const uploadUrl = await generateUploadUrl({
          contentType: file.type,
          sizeBytes: file.size,
        });
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!response.ok) throw new Error("upload gagal");
        const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
        await addPhoto({ boxId, storageId });
        added++;
      } catch {
        break;
      }
    }

    setUploadingBox(null);
    if (added > 0) {
      bloom();
      toast.success(`${added} foto ditambahkan.`);
    } else {
      toast.error("Gagal mengunggah foto.");
    }
  };

  const saveCaption = async () => {
    if (!lightboxPhoto) return;
    await updateCaption({ photoId: lightboxPhoto._id, caption });
    toast.success("Keterangan disimpan.");
  };

  if (categories === undefined || boxes === undefined) return <PageSkeleton />;

  return (
    <div className="sj-document-page sj-moodboard-page space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      <BackLink />

      <PageHeading
        kicker="Papan foto"
        title="Moodboard"
        summary={
          <>
            <strong className="num font-semibold text-[var(--ink)]">{totalPhotos}</strong> foto
            tersimpan di {boxes?.length ?? 0} kotak kategori {current}. Kumpulkan referensi dekorasi,
            busana, dan undangan di satu papan.
          </>
        }
        action={
          <>
            <Button
              onClick={() => setBoxDialog({ title: "" })}
              className="min-h-11 rounded-lg"
            >
              <Plus className="size-4" /> Kotak baru
            </Button>
            <Button
              variant="outline"
              onClick={() => setCategoryDialog("manage")}
              className="min-h-11 rounded-lg border-[var(--line)] bg-transparent text-[var(--ink)]"
            >
              <Pencil className="size-3.5" /> Kelola kategori
            </Button>
          </>
        }
      />

      <div
        className="flex items-center gap-1 overflow-x-auto border-b border-[var(--line)]"
        role="tablist"
        aria-label="Kategori moodboard"
      >
        {categoryNames.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={name === current}
            onClick={() => setActiveCategory(name)}
            className={`relative min-h-11 shrink-0 px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
              name === current
                ? "text-[var(--ink)]"
                : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
          >
            {name}
            {name === current && (
              <motion.span
                aria-hidden="true"
                layoutId="moodboard-category-ink"
                className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-[var(--brand)]"
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 34 }
                }
              />
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setCategoryName("");
            setCategoryDialog("add");
          }}
          className="flex min-h-11 shrink-0 items-center gap-1.5 px-3 text-sm text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
        >
          <Plus className="size-3.5" /> Kategori
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-soft)]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Cari kotak atau keterangan di ${current}`}
            className="h-11 rounded-lg border-[var(--line)] bg-[color-mix(in_srgb,var(--paper)_72%,transparent)] pl-9 pr-11"
            aria-label="Cari kotak mood board"
          />
          {query !== "" && (
            <button
              type="button"
              aria-label="Bersihkan pencarian"
              onClick={() => setQuery("")}
              className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--ink-soft)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <p className="num shrink-0 text-[0.8125rem] text-[var(--ink-soft)]">
          {visibleBoxes.length} kotak ditampilkan
        </p>
      </div>

      <Stagger className="columns-2 gap-3 sm:columns-3 xl:columns-4">
        {visibleBoxes.map((box, index) => {
          const cover = box.photos[0];
          const full = box.photos.length >= MAX_PHOTOS;
          return (
            <StaggerItem
              key={box._id}
              className="mb-3 break-inside-avoid [content-visibility:auto]"
            >
              <button
                type="button"
                onClick={() => setOpenBoxId(box._id)}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]"
              >
                <div
                  className={`relative w-full overflow-hidden rounded-[10px] bg-[var(--paper-sunk)] ${
                    TILE_RATIO[index % TILE_RATIO.length]
                  }`}
                >
                  {cover ? (
                    <img
                      src={cover.url}
                      alt={box.title}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-[520ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-[var(--ink-soft)]">
                      <Images className="size-6 opacity-50" weight="light" />
                    </div>
                  )}
                  <span className="num absolute bottom-2 right-2 rounded-md bg-[rgb(18_24_20/55%)] px-1.5 py-0.5 text-[0.8125rem] leading-none text-white backdrop-blur-sm">
                    {box.photos.length}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium leading-snug text-[var(--ink)]">
                  {box.title}
                </p>
                <p className="num mt-0.5 text-[0.8125rem] leading-relaxed text-[var(--ink-soft)] sm:opacity-80 sm:transition-opacity sm:group-hover:opacity-100">
                  {box.photos.length} dari {MAX_PHOTOS} foto{full ? ", kotak penuh" : ""}
                </p>
              </button>
            </StaggerItem>
          );
        })}
      </Stagger>

      {boxes !== undefined && boxes.length === 0 && (
        <EmptyState
          emoji="🎨"
          title={`Belum ada kotak di ${current}`}
          description="Buat satu kotak untuk tiap ide: dekorasi panggung, gaun, buket…"
          actionLabel={`Kotak baru di ${current}`}
          onAction={() => setBoxDialog({ title: "" })}
        />
      )}

      {boxes !== undefined && boxes.length > 0 && visibleBoxes.length === 0 && (
        <EmptyState
          emoji="🔍"
          title="Tidak ada yang cocok"
          description={`Tidak ada kotak atau keterangan di ${current} yang mengandung “${query}”.`}
          actionLabel="Reset pencarian"
          onAction={() => setQuery("")}
        />
      )}

      <button
        type="button"
        onClick={() => setBoxDialog({ title: "" })}
        className="surface-sunk flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
      >
        <Plus className="size-4" /> Kotak baru di {current}
      </button>

      {/* gallery */}
      <Dialog open={activeBox !== null} onOpenChange={(open) => !open && setOpenBoxId(null)}>
        <DialogContent className="max-w-2xl overflow-hidden rounded-[28px] border-[var(--line)] bg-[var(--paper)] p-4 sm:p-6">
          {activeBox && (
            <>
              <DialogHeader>
                <p className="text-sm text-[var(--ink-soft)]">{activeBox.tab}</p>
                <DialogTitle className="display-serif text-2xl leading-tight text-[var(--ink)]">
                  {activeBox.title}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {activeBox.photos.map((photo, index) => (
                  <div key={photo._id} className="group/photo relative">
                    <button
                      type="button"
                      className="block w-full overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                      onClick={() => {
                        setLightbox({ boxId: activeBox._id, index });
                        setCaption(photo.caption ?? "");
                      }}
                    >
                      <motion.img
                        layoutId={`moodboard-photo-${photo._id}`}
                        src={photo.url}
                        alt={photo.caption ?? activeBox.title}
                        loading="lazy"
                        className="aspect-square w-full object-cover"
                        transition={
                          reducedMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 420, damping: 34 }
                        }
                      />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus foto ${index + 1}`}
                      className="absolute -right-1.5 -top-1.5 flex size-11 items-center justify-center rounded-full opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] sm:opacity-0 sm:group-hover/photo:opacity-100 sm:focus-visible:opacity-100"
                      onClick={() => removePhoto({ photoId: photo._id })}
                    >
                      <span className="grid size-7 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper)] shadow-[0_2px_8px_-2px_rgb(27_51_38/0.35)]">
                        <Trash2 className="size-3.5 text-[var(--danger)]" />
                      </span>
                    </button>
                  </div>
                ))}

                {activeBox.photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => openFilePicker(activeBox._id)}
                    className="flex aspect-square min-h-11 items-center justify-center rounded-lg border border-dashed border-[var(--line)] text-[var(--ink-soft)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                    aria-label="Tambah foto"
                  >
                    {uploadingBox === activeBox._id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </button>
                )}
              </div>

              <p className="num text-[0.8125rem] leading-relaxed text-[var(--ink-soft)]">
                {activeBox.photos.length} dari {MAX_PHOTOS} foto. Bisa pilih beberapa file
                sekaligus.
              </p>

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  className="min-h-11 w-full rounded-lg"
                  onClick={() => openFilePicker(activeBox._id)}
                  disabled={activeBox.photos.length >= MAX_PHOTOS}
                >
                  <Plus className="size-4" /> Tambah foto
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    className="min-h-11 rounded-lg"
                    onClick={() => setBoxDialog({ id: activeBox._id, title: activeBox.title })}
                  >
                    <Pencil className="size-3.5" /> Ubah nama
                  </Button>
                  <Button
                    variant="secondary"
                    className="min-h-11 rounded-lg"
                    onClick={() => {
                      if (confirm(`Hapus kotak "${activeBox.title}" beserta fotonya?`)) {
                        deleteBox({ boxId: activeBox._id });
                        setOpenBoxId(null);
                        toast.success("Kotak dihapus.");
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" /> Hapus
                  </Button>
                </div>
                {categoryNames.length > 1 && (
                  <div className="w-full border-t border-[var(--line)] pt-3">
                    <p className="mb-1.5 text-[0.8125rem] text-[var(--ink-soft)]">Pindah kategori</p>
                    <div className="flex flex-wrap gap-2">
                      {categoryNames
                        .filter((name) => name !== activeBox.tab)
                        .map((name) => (
                          <button
                            key={name}
                            type="button"
                            className="min-h-11 rounded-lg border border-[var(--line)] bg-transparent px-3 text-sm text-[var(--ink)] transition-colors hover:border-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                            onClick={() => moveBox(activeBox._id, name)}
                          >
                            {name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* lightbox */}
      <Dialog
        open={lightboxPhoto !== null}
        onOpenChange={(open) => !open && setLightbox(null)}
      >
        <DialogContent className="max-w-2xl overflow-hidden rounded-[28px] border-[var(--line)] bg-[var(--paper)] p-3 sm:p-4">
          {lightboxBox && lightboxPhoto && lightbox && (
            <>
              <div className="relative isolate overflow-hidden rounded-[12px] bg-[var(--paper-sunk)]">
                <img
                  aria-hidden="true"
                  src={lightboxPhoto.url}
                  alt=""
                  className="pointer-events-none absolute inset-0 size-full scale-110 object-cover opacity-40 blur-2xl"
                />
                <motion.img
                  layoutId={`moodboard-photo-${lightboxPhoto._id}`}
                  src={lightboxPhoto.url}
                  alt={lightboxPhoto.caption ?? lightboxBox.title}
                  className="relative mx-auto max-h-[52vh] w-full object-contain"
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 34 }
                  }
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {lightboxBox.photos.map((photo, index) => (
                  <button
                    key={photo._id}
                    type="button"
                    onClick={() => {
                      setLightbox({ boxId: lightboxBox._id, index });
                      setCaption(photo.caption ?? "");
                    }}
                    aria-label={`Foto ${index + 1} dari ${lightboxBox.photos.length}`}
                    aria-current={index === lightbox.index}
                    className={`size-12 shrink-0 overflow-hidden rounded-lg outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
                      index === lightbox.index
                        ? "ring-2 ring-[var(--brand)]"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={photo.url} alt="" loading="lazy" className="size-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="space-y-1.5 border-t border-[var(--line)] pt-3">
                <Label htmlFor="caption" className="text-[0.8125rem] text-[var(--ink-soft)]">
                  Keterangan
                </Label>
                <Input
                  id="caption"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  onBlur={saveCaption}
                  placeholder="cth. dekor pelaminan warna sage"
                  className="h-11 rounded-lg border-[var(--line)]"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="secondary"
                  className="min-h-11 rounded-lg"
                  onClick={() =>
                    setLightbox({
                      boxId: lightbox.boxId,
                      index:
                        (lightbox.index - 1 + lightboxBox.photos.length) %
                        lightboxBox.photos.length,
                    })
                  }
                >
                  <ChevronLeft className="size-4" /> Sebelumnya
                </Button>
                <Button
                  variant="secondary"
                  className="min-h-11 rounded-lg"
                  onClick={() =>
                    setLightbox({
                      boxId: lightbox.boxId,
                      index: (lightbox.index + 1) % lightboxBox.photos.length,
                    })
                  }
                >
                  Berikutnya <ChevronRight className="size-4" />
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* create / rename box */}
      <Dialog open={boxDialog !== null} onOpenChange={(open) => !open && setBoxDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{boxDialog?.id ? "Ubah nama kotak" : `Kotak baru di ${current}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="box-title">Judul kotak</Label>
            <Input
              id="box-title"
              value={boxDialog?.title ?? ""}
              onChange={(event) =>
                setBoxDialog((previous) =>
                  previous ? { ...previous, title: event.target.value } : previous,
                )
              }
              placeholder="cth. Referensi pelaminan"
            />
          </div>
          <DialogFooter>
            <Button onClick={submitBox} disabled={busy} className="w-full rounded-2xl">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* add category */}
      <Dialog
        open={categoryDialog === "add"}
        onOpenChange={(open) => !open && setCategoryDialog(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kategori baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="category-name">Nama kategori</Label>
            <Input
              id="category-name"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="cth. Souvenir, Undangan, Gaun"
            />
          </div>
          <DialogFooter>
            <Button onClick={submitCategory} disabled={busy} className="w-full rounded-2xl">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Simpan kategori"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* manage categories */}
      <Dialog
        open={categoryDialog === "manage"}
        onOpenChange={(open) => !open && setCategoryDialog(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kelola kategori</DialogTitle>
          </DialogHeader>
          <ul className="space-y-2">
            {(categories ?? []).map((category) => (
              <li key={category._id} className="surface-sunk flex items-center gap-1 rounded-lg p-1">
                <Input
                  defaultValue={category.name}
                  onBlur={(event) => {
                    const next = event.target.value.trim();
                    if (next && next !== category.name) {
                      renameCategory({ categoryId: category._id, name: next }).then(() =>
                        setActiveCategory(next),
                      );
                    }
                  }}
                  className="h-11 border-transparent bg-transparent"
                />
                <button
                  type="button"
                  aria-label={`Hapus kategori ${category.name}`}
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg text-[var(--ink-soft)] transition-colors hover:text-[var(--danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                  onClick={() => {
                    if (
                      confirm(
                        `Hapus kategori "${category.name}" beserta kotak dan fotonya?`,
                      )
                    ) {
                      deleteCategory({ categoryId: category._id });
                      setActiveCategory(null);
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-[0.8125rem] leading-relaxed text-[var(--ink-soft)]">
            Ubah nama lewat kolomnya. Semua kotak di kategori itu ikut berpindah nama.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
