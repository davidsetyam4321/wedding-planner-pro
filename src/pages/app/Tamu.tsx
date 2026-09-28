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
import { Check, ChevronLeft, Loader2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

/** Daftar tamu: undangan, jumlah orang, dan status RSVP. */
export function TamuPage() {
  const guests = useQuery(api.guests.list);
  const createGuest = useMutation(api.guests.create);
  const setInvited = useMutation(api.guests.setInvited);
  const setRsvp = useMutation(api.guests.setRsvp);
  const removeGuest = useMutation(api.guests.remove);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [pax, setPax] = useState("2");
  const [saving, setSaving] = useState(false);

  const list = guests ?? [];
  const totalPax = list.reduce((sum, g) => sum + g.pax, 0);
  const hadir = list.filter((g) => g.rsvp === "hadir");
  const invited = list.filter((g) => g.invited).length;

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Nama tamu wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await createGuest({ name, group, pax: Number(pax) || 1 });
      toast.success("Tamu ditambahkan.");
      setOpen(false);
      setName("");
      setGroup("");
      setPax("2");
    } catch {
      toast.error("Gagal menambah tamu.");
    } finally {
      setSaving(false);
    }
  };

  const cycleRsvp = async (
    guestId: Id<"guest">,
    current: "pending" | "hadir" | "tidak",
  ) => {
    const next = current === "pending" ? "hadir" : current === "hadir" ? "tidak" : "pending";
    await setRsvp({ guestId, rsvp: next });
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
            💌
          </div>
          <div>
            <h1 className="text-lg font-extrabold leading-tight">Daftar Tamu</h1>
            <p className="text-[11px] text-muted-foreground">
              {list.length} tamu · {totalPax} orang
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="clay-inset rounded-2xl px-3 py-2">
            <p className="text-[10px] font-medium text-muted-foreground">Diundang</p>
            <p className="text-sm font-bold">{invited}</p>
          </div>
          <div className="clay-inset rounded-2xl px-3 py-2">
            <p className="text-[10px] font-medium text-muted-foreground">Hadir</p>
            <p className="text-sm font-bold text-primary">
              {hadir.reduce((sum, g) => sum + g.pax, 0)} orang
            </p>
          </div>
          <div className="clay-inset rounded-2xl px-3 py-2">
            <p className="text-[10px] font-medium text-muted-foreground">Belum pasti</p>
            <p className="text-sm font-bold">
              {list.filter((g) => g.rsvp === "pending").length}
            </p>
          </div>
        </div>
      </section>

      <Button className="w-full rounded-2xl" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Tambah tamu
      </Button>

      <section className="space-y-3">
        {list.map((guest) => (
          <div key={guest._id} className="clay p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{guest.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {guest.group} · {guest.pax} orang
                </p>
              </div>
              <button
                type="button"
                aria-label="Hapus tamu"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  removeGuest({ guestId: guest._id });
                  toast.success("Tamu dihapus.");
                }}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setInvited({ guestId: guest._id, invited: !guest.invited })
                }
                className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all clay-sm ${
                  guest.invited
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {guest.invited ? "Undangan terkirim" : "Belum diundang"}
              </button>

              <button
                type="button"
                onClick={() => cycleRsvp(guest._id, guest.rsvp)}
                className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all clay-sm ${
                  guest.rsvp === "hadir"
                    ? "bg-primary text-primary-foreground"
                    : guest.rsvp === "tidak"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-accent text-accent-foreground"
                }`}
              >
                {guest.rsvp === "hadir" ? (
                  <>
                    <Check className="size-3" /> Hadir
                  </>
                ) : guest.rsvp === "tidak" ? (
                  <>
                    <X className="size-3" /> Tidak hadir
                  </>
                ) : (
                  "RSVP belum"
                )}
              </button>
            </div>
          </div>
        ))}

        {guests !== undefined && list.length === 0 && (
          <div className="clay-inset flex h-24 items-center justify-center rounded-3xl text-xs text-muted-foreground">
            Belum ada tamu. Tambahkan yang pertama!
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tamu baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="guest-name">Nama</Label>
              <Input
                id="guest-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Keluarga Budi"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest-group">Grup</Label>
              <Input
                id="guest-group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="cth. Keluarga mempelai wanita"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest-pax">Jumlah orang</Label>
              <Input
                id="guest-pax"
                type="number"
                min={1}
                value={pax}
                onChange={(e) => setPax(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={saving} className="w-full rounded-2xl">
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Simpan tamu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
