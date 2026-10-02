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
import {
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Send,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

type Rsvp = "pending" | "hadir" | "tidak";

const RSVP_OPTIONS: { key: Rsvp; label: string }[] = [
  { key: "pending", label: "Belum" },
  { key: "hadir", label: "Hadir" },
  { key: "tidak", label: "Tidak" },
];

type GuestForm = {
  id: Id<"guest"> | null;
  name: string;
  group: string;
  pax: string;
  phone: string;
  note: string;
};

const EMPTY_FORM: GuestForm = {
  id: null,
  name: "",
  group: "",
  pax: "2",
  phone: "",
  note: "",
};

function waLink(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "").replace(/^0/, "62");
  return `https://wa.me/${digits}`;
}

const AVATAR_TINTS = [
  "bg-tint-rose text-tint-rose-foreground",
  "bg-tint-sky text-tint-sky-foreground",
  "bg-tint-butter text-tint-butter-foreground",
  "bg-tint-mint text-tint-mint-foreground",
  "bg-tint-sage text-tint-sage-foreground",
  "bg-tint-lavender text-tint-lavender-foreground",
];

/** Warna avatar yang konsisten untuk setiap grup tamu. */
function groupTint(group: string): string {
  let hash = 0;
  for (const char of group) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0] ?? "";
  const second = words[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

export function TamuPage() {
  const guests = useQuery(api.guests.list);
  const createGuest = useMutation(api.guests.create);
  const updateGuest = useMutation(api.guests.update);
  const inviteAll = useMutation(api.guests.inviteAll);
  const setInvited = useMutation(api.guests.setInvited);
  const setRsvp = useMutation(api.guests.setRsvp);
  const removeGuest = useMutation(api.guests.remove);

  const [form, setForm] = useState<GuestForm>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [rsvpFilter, setRsvpFilter] = useState<"semua" | Rsvp>("semua");

  const list = guests ?? [];
  const groups = Array.from(new Set(list.map((guest) => guest.group)));
  const totalPax = list.reduce((sum, guest) => sum + guest.pax, 0);
  const invited = list.filter((guest) => guest.invited).length;
  const attendingPax = list
    .filter((guest) => guest.rsvp === "hadir")
    .reduce((sum, guest) => sum + guest.pax, 0);

  const visible = list.filter((guest) => {
    if (groupFilter && guest.group !== groupFilter) return false;
    if (rsvpFilter !== "semua" && guest.rsvp !== rsvpFilter) return false;
    if (query.trim() === "") return true;
    return guest.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  const rsvpPill = (key: "semua" | Rsvp, label: string, count: number) => (
    <button
      key={key}
      type="button"
      aria-pressed={rsvpFilter === key}
      onClick={() => setRsvpFilter(key)}
      className={`chip shrink-0 ${
        rsvpFilter === key
          ? "bg-white text-tint-sky-foreground shadow-sm"
          : "bg-white/60 text-tint-sky-foreground/80"
      }`}
    >
      {label} · {count}
    </button>
  );

  const openNew = () => {
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (guest: (typeof list)[number]) => {
    setForm({
      id: guest._id,
      name: guest.name,
      group: guest.group,
      pax: String(guest.pax),
      phone: guest.phone ?? "",
      note: guest.note ?? "",
    });
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Nama tamu wajib diisi.");
      return;
    }
    setBusy(true);
    try {
      if (form.id) {
        await updateGuest({
          guestId: form.id,
          name: form.name,
          group: form.group,
          pax: Number(form.pax) || 1,
          phone: form.phone,
          note: form.note,
        });
        toast.success("Data tamu diperbarui.");
      } else {
        await createGuest({
          name: form.name,
          group: form.group,
          pax: Number(form.pax) || 1,
          phone: form.phone,
          note: form.note,
        });
        bloom();
        toast.success("Tamu ditambahkan.");
      }
      setFormOpen(false);
      setForm(EMPTY_FORM);
    } catch {
      toast.error("Gagal menyimpan tamu.");
    } finally {
      setBusy(false);
    }
  };

  const markAllSent = async () => {
    const count = await inviteAll({ group: groupFilter ?? undefined });
    if (count > 0) bloom();
    toast.success(
      count > 0 ? `${count} undangan ditandai terkirim.` : "Semua sudah terkirim.",
    );
  };

  if (guests === undefined) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <BackLink fallback="/app/lainnya" />

      <section className="clay grad-sky relative overflow-hidden p-5 text-tint-sky-foreground">
        <FlowerMark className="float-slow pointer-events-none absolute -right-3 -top-3 size-20 opacity-25" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h1 className="h-page">Daftar Tamu</h1>
            <p className="meta">
              {list.length} tamu · {totalPax} orang · {invited} terkirim
            </p>
          </div>
          <div className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-white/70 text-xl">
            💌
          </div>
        </div>
        <div className="relative mt-4 flex items-center gap-2 overflow-x-auto pb-0.5">
          {rsvpPill("semua", "Semua", list.length)}
          {rsvpPill("hadir", "Hadir", list.filter((guest) => guest.rsvp === "hadir").length)}
          {rsvpPill("pending", "Belum", list.filter((guest) => guest.rsvp === "pending").length)}
          {rsvpPill("tidak", "Tidak", list.filter((guest) => guest.rsvp === "tidak").length)}
        </div>
        <dl className="relative mt-3 grid grid-cols-3 gap-2">
          <div className="stat-tile bg-white/70">
            <dt>Total</dt>
            <dd>{totalPax} org</dd>
          </div>
          <div className="stat-tile bg-white/70">
            <dt>Hadir</dt>
            <dd>{attendingPax} org</dd>
          </div>
          <div className="stat-tile bg-white/70">
            <dt>Terikirim</dt>
            <dd>{invited}/{list.length}</dd>
          </div>
        </dl>
      </section>

      <div className="flex gap-2">
        <Button className="flex-1 rounded-2xl" onClick={openNew}>
          <Plus className="size-4" /> Tamu baru
        </Button>
        <Button
          variant="secondary"
          className="rounded-2xl"
          onClick={() => void markAllSent()}
        >
          <Send className="size-4" /> Tandai terkirim
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama tamu…"
          className="pl-9"
        />
      </div>

      {groups.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setGroupFilter(null)}
            className={`chip shrink-0 ${
              groupFilter === null
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            Semua grup
          </button>
          {groups.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setGroupFilter(group)}
              className={`chip shrink-0 ${
                groupFilter === group
                  ? "bg-primary text-primary-foreground"
                  : "bg-tint-sky text-tint-sky-foreground"
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <Stagger className="space-y-3">
          {visible.map((guest) => (
            <StaggerItem key={guest._id}>
              <article className="clay p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`clay-sm flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ${groupTint(guest.group)}`}
                  >
                    {initialsOf(guest.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">{guest.name}</p>
                    <p className="meta">
                      {guest.group} · {guest.pax} orang
                    </p>
                    {guest.note && <p className="meta mt-0.5 italic">{guest.note}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {guest.phone && (
                      <a
                        href={waLink(guest.phone)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Chat WhatsApp"
                        className="flex size-7 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-primary"
                      >
                        <MessageCircle className="size-4" />
                      </a>
                    )}
                    <RowMenu
                      onEdit={() => openEdit(guest)}
                      onDelete={() => {
                        removeGuest({ guestId: guest._id });
                        toast.success("Tamu dihapus.");
                      }}
                      deleteTitle={`Hapus ${guest.name}?`}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInvited({ guestId: guest._id, invited: !guest.invited })}
                    className={`chip ${
                      guest.invited
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <CheckIcon invited={Boolean(guest.invited)} />
                    {guest.invited ? "Undangan terkirim" : "Belum diundang"}
                  </button>

                  <div className="clay-inset flex gap-1 p-1">
                    {RSVP_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => {
                          setRsvp({ guestId: guest._id, rsvp: option.key });
                          if (option.key === "hadir") bloom();
                        }}
                        className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors ${
                          guest.rsvp === option.key
                            ? option.key === "hadir"
                              ? "bg-primary text-primary-foreground"
                              : option.key === "tidak"
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-secondary text-secondary-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>

        {visible.length === 0 && guests !== undefined && (
          <EmptyState
            emoji={query || groupFilter || rsvpFilter !== "semua" ? "🔍" : "💌"}
            title={query || groupFilter || rsvpFilter !== "semua" ? "Tidak ada tamu yang cocok" : "Belum ada tamu"}
            description={
              query || groupFilter || rsvpFilter !== "semua"
                ? "Coba ubah filter atau kata kunci pencarian."
                : "Mulai dari keluarga terdekat, lalu teman dan rekan kerja."
            }
            actionLabel={query || groupFilter || rsvpFilter !== "semua" ? undefined : "Tambah tamu"}
            onAction={query || groupFilter || rsvpFilter !== "semua" ? undefined : openNew}
          />
        )}
      </section>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{form.id ? "Ubah data tamu" : "Tamu baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="guest-name">Nama</Label>
              <Input
                id="guest-name"
                value={form.name}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, name: event.target.value }))
                }
                placeholder="cth. Keluarga Budi"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="guest-group">Grup</Label>
                <Input
                  id="guest-group"
                  list="guest-groups"
                  value={form.group}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, group: event.target.value }))
                  }
                  placeholder="cth. Keluarga"
                />
                <datalist id="guest-groups">
                  {groups.map((group) => (
                    <option key={group} value={group} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="guest-pax">Jumlah orang</Label>
                <Input
                  id="guest-pax"
                  type="number"
                  min={1}
                  value={form.pax}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, pax: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest-phone">No. WhatsApp (opsional)</Label>
              <Input
                id="guest-phone"
                value={form.phone}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, phone: event.target.value }))
                }
                placeholder="0812xxxxxxx"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest-note">Catatan (opsional)</Label>
              <Input
                id="guest-note"
                value={form.note}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, note: event.target.value }))
                }
                placeholder="cth. alergi seafood"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={busy} className="w-full rounded-2xl">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Simpan tamu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CheckIcon({ invited }: { invited: boolean }) {
  return (
    <span
      className={`flex size-3.5 items-center justify-center rounded-full border ${
        invited ? "border-white/60 bg-white/30" : "border-current opacity-50"
      }`}
    >
      {invited ? <span className="text-[8px] leading-none">✓</span> : null}
    </span>
  );
}
