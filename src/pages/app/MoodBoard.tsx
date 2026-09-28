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
import { ChevronLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

type Tab = "dekorasi" | "baju" | "makeup";

const TAB_LABELS: Record<Tab, string> = {
  dekorasi: "Dekorasi",
  baju: "Baju",
  makeup: "Makeup",
};

const MAX_PHOTOS_PER_BOX = 3;

/** Mood board: papan referensi per kategori, maksimal 3 foto per kotak. */
export function MoodBoardPage() {
  const [tab, setTab] = useState<Tab>("dekorasi");
  const boxes = useQuery(api.moodboard.listBoxes, { tab });
  const photos = useQuery(api.moodboard.listPhotos);
  const createBox = useMutation(api.moodboard.createBox);
  const renameBox = useMutation(api.moodboard.renameBox);
  const deleteBox = useMutation(api.moodboard.deleteBox);
  const addPhoto = useMutation(api.moodboard.addPhoto);
  const removePhoto = useMutation(api.moodboard.removePhoto);
  const generateUploadUrl = useAction(api.files.generateUploadUrl);

  const [newBoxOpen, setNewBoxOpen] = useState(false);
  const [newBoxTitle, setNewBoxTitle] = useState("");
  const [creatingBox, setCreatingBox] = useState(false);

  const [renaming, setRenaming] = useState<{ id: Id<"moodboardBox">; title: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamingBusy, setRenamingBusy] = useState(false);

  const [uploadingBox, setUploadingBox] = useState<Id<"moodboardBox"> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitNewBox = async () => {
    if (!newBoxTitle.trim()) {
      toast.error("Isi judul kotak dulu, ya.");
      return;
    }
    setCreatingBox(true);
    try {
      await createBox({ tab, title: newBoxTitle });
      setNewBoxOpen(false);
      setNewBoxTitle("");
      toast.success("Kotak baru ditambahkan.");
    } catch {
      toast.error("Gagal menambah kotak.");
    } finally {
      setCreatingBox(false);
    }
  };

  const submitRename = async () => {
    if (!renaming || !renameValue.trim()) return;
    setRenamingBusy(true);
    try {
      await renameBox({ boxId: renaming.id, title: renameValue });
      setRenaming(null);
      toast.success("Nama kotak diperbarui.");
    } catch {
      toast.error("Gagal mengganti nama kotak.");
    } finally {
      setRenamingBusy(false);
    }
  };

  const openFilePicker = (boxId: Id<"moodboardBox">) => {
    setUploadingBox(boxId);
    fileInputRef.current?.click();
  };

  const handleFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !uploadingBox) return;

    try {
      const uploadUrl = await generateUploadUrl({});
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("upload gagal");
      const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
      await addPhoto({ boxId: uploadingBox, storageId });
      toast.success("Foto ditambahkan.");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.includes("Maksimal")
          ? "Maksimal 3 foto per kotak."
          : "Gagal mengunggah foto.",
      );
    } finally {
      setUploadingBox(null);
    }
  };

  const photosFor = (boxId: Id<"moodboardBox">) =>
    (photos ?? []).filter((photo) => photo.boxId === boxId);

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChosen}
      />

      <Link
        to="/app/lainnya"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
      >
        <ChevronLeft className="size-3.5" /> Lainnya
      </Link>

      <section className="clay p-5">
        <div className="flex items-center gap-3">
          <div className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-accent text-lg">
            🎨
          </div>
          <div>
            <h1 className="text-lg font-extrabold leading-tight">Mood Board</h1>
            <p className="text-[11px] text-muted-foreground">
              Maksimal 3 foto per kotak
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Kumpulkan referensi dekor, baju & makeup di satu tempat supaya tidak
          menumpuk screenshot di galeri. Butuh kotak lain? Tambahkan sendiri di
          bawah.
        </p>
      </section>

      <div className="clay-inset flex gap-1 p-1.5">
        {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-2xl px-3 py-2 text-xs font-bold transition-all ${
              tab === key
                ? "clay-sm bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3">
        {(boxes ?? []).map((box) => {
          const boxPhotos = photosFor(box._id);
          const full = boxPhotos.length >= MAX_PHOTOS_PER_BOX;
          return (
            <div key={box._id} className="clay flex flex-col p-3">
              <div className="flex items-start justify-between gap-1">
                <p className="text-xs font-bold leading-snug">{box.title}</p>
                <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                  <button
                    type="button"
                    aria-label="Ganti nama kotak"
                    className="hover:text-primary"
                    onClick={() => {
                      setRenaming({ id: box._id, title: box.title });
                      setRenameValue(box.title);
                    }}
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Hapus kotak"
                    className="hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Hapus kotak "${box.title}"?`)) {
                        deleteBox({ boxId: box._id });
                        toast.success("Kotak dihapus.");
                      }
                    }}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>

              <div className="clay-inset mt-2.5 flex-1 rounded-2xl p-2">
                {boxPhotos.length === 0 ? (
                  <div className="flex h-24 items-center justify-center px-2 text-center text-[11px] text-muted-foreground">
                    {box.title}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {boxPhotos.map((photo) => (
                      <div key={photo._id} className="group relative aspect-square">
                        <img
                          src={photo.url}
                          alt={box.title}
                          className="size-full rounded-xl object-cover"
                        />
                        <button
                          type="button"
                          aria-label="Hapus foto"
                          className="absolute inset-0 hidden items-center justify-center rounded-xl bg-destructive/70 text-destructive-foreground group-hover:flex"
                          onClick={() => removePhoto({ photoId: photo._id })}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    {!full && (
                      <button
                        type="button"
                        onClick={() => openFilePicker(box._id)}
                        aria-label="Tambah foto"
                        className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground hover:text-primary"
                      >
                        {uploadingBox === box._id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Plus className="size-4" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="mt-2.5 rounded-2xl bg-secondary px-3 py-2 text-[11px] font-bold text-secondary-foreground disabled:opacity-50"
                onClick={() => openFilePicker(box._id)}
                disabled={full || uploadingBox === box._id}
              >
                {full
                  ? "Kotak penuh (3/3)"
                  : `+ Tambah foto (${boxPhotos.length}/3)`}
              </button>
            </div>
          );
        })}

        {boxes !== undefined && boxes.length === 0 && (
          <div className="clay-inset col-span-2 flex h-28 items-center justify-center rounded-3xl text-xs text-muted-foreground">
            Belum ada kotak di kategori ini.
          </div>
        )}
      </section>

      <Button
        variant="secondary"
        className="w-full rounded-2xl"
        onClick={() => setNewBoxOpen(true)}
      >
        <Plus className="size-4" /> Tambah kotak baru
      </Button>

      <Dialog open={newBoxOpen} onOpenChange={setNewBoxOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kotak baru · {TAB_LABELS[tab]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="box-title">Judul kotak</Label>
            <Input
              id="box-title"
              value={newBoxTitle}
              onChange={(e) => setNewBoxTitle(e.target.value)}
              placeholder="cth. Referensi pelaminan"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={submitNewBox}
              disabled={creatingBox}
              className="w-full rounded-2xl"
            >
              {creatingBox ? <Loader2 className="size-4 animate-spin" /> : "Simpan kotak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renaming !== null} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ganti nama kotak</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rename-title">Judul baru</Label>
            <Input
              id="rename-title"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={submitRename}
              disabled={renamingBusy}
              className="w-full rounded-2xl"
            >
              {renamingBusy ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
