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
import { useAuth } from "@/hooks/use-auth";
import { formatRupiah, fromDateInputValue, toDateInputValue } from "@/lib/format";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

type Tab = "dekorasi" | "baju" | "makeup";

const TAB_LABELS: Record<Tab, string> = {
  dekorasi: "Dekorasi",
  baju: "Baju",
  makeup: "Makeup",
};

const MAX_PHOTOS_PER_BOX = 3;

/** Lainnya page: mood board + pengaturan pernikahan. */
export function LainnyaPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const wedding = useQuery(api.wedding.get);
  const updateSettings = useMutation(api.wedding.updateSettings);

  // mood board state
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

  // settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const openSettings = () => {
    if (wedding) {
      setP1(wedding.partnerOneName);
      setP2(wedding.partnerTwoName);
      setDateValue(toDateInputValue(wedding.weddingDate));
      setTargetValue(String(wedding.fundTarget));
    }
    setSettingsOpen(true);
  };

  const submitSettings = async () => {
    if (!p1.trim() || !p2.trim() || !dateValue) {
      toast.error("Nama dan tanggal wajib diisi.");
      return;
    }
    setSavingSettings(true);
    try {
      await updateSettings({
        partnerOneName: p1,
        partnerTwoName: p2,
        weddingDate: fromDateInputValue(dateValue),
        fundTarget: Number(targetValue) || 0,
      });
      toast.success("Pengaturan tersimpan.");
      setSettingsOpen(false);
    } catch {
      toast.error("Gagal menyimpan pengaturan.");
    } finally {
      setSavingSettings(false);
    }
  };

  const submitNewBox = async () => {
    if (!newBoxTitle.trim()) {
      toast.error("Isi judul kotak.");
      return;
    }
    setCreatingBox(true);
    try {
      await createBox({ tab, title: newBoxTitle });
      setNewBoxOpen(false);
      setNewBoxTitle("");
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
    } catch {
      toast.error("Gagal mengubah nama kotak.");
    } finally {
      setRenamingBusy(false);
    }
  };

  const openFilePicker = (boxId: Id<"moodboardBox">) => {
    setUploadingBox(boxId);
    fileInputRef.current?.click();
  };

  const handleFileChosen = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
      if (!response.ok) throw new Error("upload failed");
      const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
      await addPhoto({ boxId: uploadingBox, storageId });
      toast.success("Foto ditambahkan.");
    } catch (error) {
      if (error instanceof Error && error.message.includes("Maksimal")) {
        toast.error("Maksimal 3 foto per kotak.");
      } else {
        toast.error("Gagal mengunggah foto.");
      }
    } finally {
      setUploadingBox(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const photosFor = (boxId: Id<"moodboardBox">) =>
    (photos ?? []).filter((photo) => photo.boxId === boxId);

  return (
    <div className="space-y-4 pt-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChosen}
      />

      <section>
        <p className="prompt-label text-xs text-muted-foreground">lainnya</p>
        <h1 className="mt-0.5 text-lg font-semibold">Mood Board</h1>
        <p className="text-xs text-muted-foreground">
          Kumpulkan referensi dekor, baju &amp; makeup di satu tempat — tak perlu
          numpuk screenshot di galeri. Maksimal 3 foto per kotak.
        </p>
      </section>

      <section>
        <div className="flex gap-1 border border-border bg-muted p-1">
          {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                tab === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {(boxes ?? []).map((box) => {
          const boxPhotos = photosFor(box._id);
          const full = boxPhotos.length >= MAX_PHOTOS_PER_BOX;
          return (
            <div key={box._id} className="panel flex flex-col">
              <div className="panel-header justify-between">
                <span className="truncate normal-case tracking-normal">{box.title}</span>
                <span className="flex items-center gap-1">
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
                      }
                    }}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              </div>
              <div className="dotted-frame flex-1 p-1.5">
                {boxPhotos.length === 0 ? (
                  <div className="flex h-full min-h-24 items-center justify-center px-2 text-center text-[11px] text-muted-foreground">
                    {box.title}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    {boxPhotos.map((photo) => (
                      <div key={photo._id} className="group relative aspect-square">
                        <img
                          src={photo.url}
                          alt={box.title}
                          className="size-full object-cover"
                        />
                        <button
                          type="button"
                          aria-label="Hapus foto"
                          className="absolute inset-0 hidden items-center justify-center bg-destructive/70 text-primary-foreground group-hover:flex"
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
                        className="flex aspect-square items-center justify-center border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
                        aria-label="Tambah foto"
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
                className="border-t border-border py-1.5 text-[11px] text-muted-foreground hover:text-primary disabled:opacity-50"
                onClick={() => openFilePicker(box._id)}
                disabled={full || uploadingBox === box._id}
              >
                {full ? "Kotak penuh (3/3)" : `+ Tambah foto (${boxPhotos.length}/3)`}
              </button>
            </div>
          );
        })}

        {boxes !== undefined && boxes.length === 0 && (
          <div className="col-span-2">
            <div className="panel dotted-frame flex h-28 items-center justify-center text-xs text-muted-foreground">
              Belum ada kotak di tab ini.
            </div>
          </div>
        )}
      </section>

      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={() => setNewBoxOpen(true)}
      >
        <Plus className="size-4" /> Tambah kotak baru
      </Button>

      <section className="panel">
        <div className="panel-header">Pengaturan</div>
        <div className="divide-y divide-border">
          <button
            type="button"
            onClick={openSettings}
            className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/60"
          >
            <span>Data pernikahan</span>
            <span className="text-xs text-muted-foreground">nama, tanggal, target</span>
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/60"
          >
            <span>Keluar akun</span>
            <span className="text-xs text-muted-foreground">sampai jumpa!</span>
          </button>
        </div>
        {wedding && (
          <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            <span className="prompt-label">info</span> target dana saat ini{" "}
            {formatRupiah(wedding.fundTarget)}
          </div>
        )}
      </section>

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
            <Button onClick={submitNewBox} disabled={creatingBox} className="w-full">
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
            <Button onClick={submitRename} disabled={renamingBusy} className="w-full">
              {renamingBusy ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Data pernikahan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="set-p1">Nama kamu</Label>
              <Input id="set-p1" value={p1} onChange={(e) => setP1(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-p2">Nama pasangan</Label>
              <Input id="set-p2" value={p2} onChange={(e) => setP2(e.target.value)} />
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
              <Label htmlFor="set-target">Target dana (Rp)</Label>
              <Input
                id="set-target"
                type="number"
                min={0}
                step={100000}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitSettings} disabled={savingSettings} className="w-full">
              {savingSettings ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Simpan pengaturan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
