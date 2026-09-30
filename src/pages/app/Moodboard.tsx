import { FlowerMark } from "@/components/Decor";
import { EmptyState, Stagger, StaggerItem } from "@/components/Shared";
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
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

type BoxId = Id<"moodboardBox">;

const MAX_PHOTOS = 12;

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

  const [categoryDialog, setCategoryDialog] = useState<"add" | "manage" | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [busy, setBusy] = useState(false);

  const [boxDialog, setBoxDialog] = useState<{ id?: BoxId; title: string } | null>(null);
  const [openBoxId, setOpenBoxId] = useState<BoxId | null>(null);
  const [uploadingBox, setUploadingBox] = useState<BoxId | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lightbox, setLightbox] = useState<{ boxId: BoxId; index: number } | null>(null);
  const [caption, setCaption] = useState("");

  const activeBox = (boxes ?? []).find((box) => box._id === openBoxId) ?? null;
  const lightboxBox = (boxes ?? []).find((box) => box._id === lightbox?.boxId) ?? null;
  const lightboxPhoto =
    lightboxBox && lightbox ? lightboxBox.photos[lightbox.index] ?? null : null;

  const totalPhotos = (boxes ?? []).reduce((sum, box) => sum + box.photos.length, 0);

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
        const uploadUrl = await generateUploadUrl({});
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

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      <Link
        to="/app/lainnya"
        className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground"
      >
        <ChevronLeft className="size-3.5" /> Lainnya
      </Link>

      <section className="clay grad-rose relative overflow-hidden p-5 text-tint-rose-foreground">
        <FlowerMark className="float-slow pointer-events-none absolute -right-3 -top-3 size-20 opacity-25" />
        <div className="relative flex items-center gap-3">
          <div className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-white/70 text-xl">
            🎨
          </div>
          <div>
            <h1 className="h-page">Mood Board</h1>
            <p className="meta">
              {boxes?.length ?? 0} kotak · {totalPhotos} foto di {current}
            </p>
          </div>
        </div>
        <p className="meta relative mt-3 opacity-90">
          Simpan referensi per kategori sebanyak yang kalian mau. Klik kotak
          untuk melihat galeri, geser thumbnail untuk pindah foto.
        </p>
      </section>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categoryNames.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setActiveCategory(name)}
            className={`chip shrink-0 ${
              name === current
                ? "bg-primary text-primary-foreground"
                : "bg-tint-rose text-tint-rose-foreground"
            }`}
          >
            {name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setCategoryName("");
            setCategoryDialog("add");
          }}
          className="chip shrink-0 bg-secondary text-secondary-foreground"
        >
          <Plus className="size-3.5" /> Kategori
        </button>
        <button
          type="button"
          onClick={() => setCategoryDialog("manage")}
          className="chip shrink-0 bg-secondary text-secondary-foreground"
          aria-label="Kelola kategori"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>

      <Stagger className="grid grid-cols-2 gap-3">
        {(boxes ?? []).map((box) => {
          const cover = box.photos[0];
          const full = box.photos.length >= MAX_PHOTOS;
          return (
            <StaggerItem key={box._id} className="h-full">
            <button
              type="button"
              onClick={() => setOpenBoxId(box._id)}
              className="clay clay-press h-full w-full overflow-hidden p-0 text-left"
            >
              <div className="relative aspect-[4/3] w-full bg-muted">
                {cover ? (
                  <img
                    src={cover.url}
                    alt={box.title}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-tint-rose-foreground">
                    <Images className="size-6 opacity-60" />
                  </div>
                )}
                <span className="num absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white">
                  {box.photos.length}/{MAX_PHOTOS}
                </span>
              </div>
              <div className="p-3">
                <p className="text-xs font-extrabold leading-snug">{box.title}</p>
                <p className="meta">
                  {box.photos.length === 0
                    ? "Belum ada foto"
                    : full
                      ? "Penuh"
                      : "Klik untuk kelola"}
                </p>
              </div>
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

      <Button
        variant="secondary"
        className="w-full rounded-2xl"
        onClick={() => setBoxDialog({ title: "" })}
      >
        <Plus className="size-4" /> Kotak baru di {current}
      </Button>

      {/* gallery */}
      <Dialog open={activeBox !== null} onOpenChange={(open) => !open && setOpenBoxId(null)}>
        <DialogContent className="max-w-md">
          {activeBox && (
            <>
              <DialogHeader>
                <DialogTitle className="h-card">{activeBox.title}</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-2">
                {activeBox.photos.map((photo, index) => (
                  <div key={photo._id} className="relative aspect-square">
                    <button
                      type="button"
                      className="size-full"
                      onClick={() => {
                        setLightbox({ boxId: activeBox._id, index });
                        setCaption(photo.caption ?? "");
                      }}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption ?? activeBox.title}
                        className="size-full rounded-xl object-cover"
                      />
                    </button>
                    <button
                      type="button"
                      aria-label="Hapus foto"
                      className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                      onClick={() => removePhoto({ photoId: photo._id })}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}

                {activeBox.photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => openFilePicker(activeBox._id)}
                    className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-input text-muted-foreground hover:text-primary"
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

              <p className="meta">
                {activeBox.photos.length}/{MAX_PHOTOS} foto · bisa pilih beberapa
                file sekaligus
              </p>

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  className="w-full rounded-2xl"
                  onClick={() => openFilePicker(activeBox._id)}
                  disabled={activeBox.photos.length >= MAX_PHOTOS}
                >
                  <Plus className="size-4" /> Tambah foto
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    className="rounded-2xl"
                    onClick={() => setBoxDialog({ id: activeBox._id, title: activeBox.title })}
                  >
                    <Pencil className="size-3.5" /> Ubah nama
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-2xl"
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
                  <div className="w-full">
                    <p className="label mb-1.5 text-muted-foreground">Pindah kategori</p>
                    <div className="flex flex-wrap gap-2">
                      {categoryNames
                        .filter((name) => name !== activeBox.tab)
                        .map((name) => (
                          <button
                            key={name}
                            type="button"
                            className="chip bg-tint-rose text-tint-rose-foreground"
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
        <DialogContent className="max-w-md">
          {lightboxBox && lightboxPhoto && lightbox && (
            <>
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption ?? lightboxBox.title}
                className="max-h-[50vh] w-full rounded-2xl object-contain"
              />
              <div className="flex items-center gap-2 overflow-x-auto">
                {lightboxBox.photos.map((photo, index) => (
                  <button
                    key={photo._id}
                    type="button"
                    onClick={() => {
                      setLightbox({ boxId: lightboxBox._id, index });
                      setCaption(photo.caption ?? "");
                    }}
                    className={`size-12 shrink-0 overflow-hidden rounded-lg ${
                      index === lightbox.index ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <img src={photo.url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="caption">Keterangan</Label>
                <Input
                  id="caption"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  onBlur={saveCaption}
                  placeholder="cth. dekor pelaminan warna sage"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="secondary"
                  className="rounded-2xl"
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
                  className="rounded-2xl"
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
            <DialogTitle>{boxDialog?.id ? "Ubah nama kotak" : `Kotak baru · ${current}`}</DialogTitle>
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
              <li key={category._id} className="clay-inset flex items-center gap-2 rounded-2xl p-2">
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
                  className="h-8"
                />
                <button
                  type="button"
                  aria-label={`Hapus kategori ${category.name}`}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
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
          <p className="meta">
            Klik nama untuk mengubah. Semua kotak di kategori itu ikut berpindah
            nama.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
