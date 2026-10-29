import {
  BackLink,
  EmptyState,
  LedgerFigure,
  PageHeading,
  PageSkeleton,
  RowMenu,
  Segmented,
  StackBar,
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
import { WA_TEMPLATES, waLink, type WaContext } from "@/lib/contact";
import { downloadCsv } from "@/lib/exportCsv";
import { formatDateLongID } from "@/lib/format";
import {
  Check,
  FileDown,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Send,
  Upload,
} from "@/lib/icons";
import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { undoableDelete } from "@/lib/undo";

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

export function TamuPage() {
  const guests = useQuery(api.guests.list);
  const createGuest = useMutation(api.guests.create);
  const updateGuest = useMutation(api.guests.update);
  const inviteAll = useMutation(api.guests.inviteAll);
  const setInvited = useMutation(api.guests.setInvited);
  const setRsvp = useMutation(api.guests.setRsvp);
  const removeGuest = useMutation(api.guests.remove);
  const importGuests = useMutation(api.guests.createMany);
  const wedding = useQuery(api.wedding.get);

  const [form, setForm] = useState<GuestForm>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [rsvpFilter, setRsvpFilter] = useState<"semua" | Rsvp>("semua");
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  /** Tamu yang sedang dipilih untuk dikirimi pesan WA dari template. */
  const [waTarget, setWaTarget] = useState<{
    name: string;
    phone?: string;
  } | null>(null);

  const list = guests ?? [];
  const groups = Array.from(new Set(list.map((guest) => guest.group)));
  const totalPax = list.reduce((sum, guest) => sum + guest.pax, 0);
  const invited = list.filter((guest) => guest.invited).length;
  const attendingPax = list
    .filter((guest) => guest.rsvp === "hadir")
    .reduce((sum, guest) => sum + guest.pax, 0);
  const declinedPax = list
    .filter((guest) => guest.rsvp === "tidak")
    .reduce((sum, guest) => sum + guest.pax, 0);
  const pendingPax = Math.max(0, totalPax - attendingPax - declinedPax);
  const answered = list.filter((guest) => guest.rsvp !== "pending").length;

  // Sebaran pax per grup — dipakai sebagai daftar filter dengan hitungan.
  const groupRows = groups
    .map((group) => ({
      group,
      orang: list
        .filter((guest) => guest.group === group)
        .reduce((sum, guest) => sum + guest.pax, 0),
    }))
    .sort((a, b) => b.orang - a.orang);
  const visible = list.filter((guest) => {
    if (groupFilter && guest.group !== groupFilter) return false;
    if (rsvpFilter !== "semua" && guest.rsvp !== rsvpFilter) return false;
    if (query.trim() === "") return true;
    return guest.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  const hasFilter = query.trim() !== "" || groupFilter !== null || rsvpFilter !== "semua";
  const resetFilters = () => {
    setQuery("");
    setGroupFilter(null);
    setRsvpFilter("semua");
  };

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

  /** Unduh daftar tamu (terfilter) sebagai CSV. */
  const exportCsv = () => {
    downloadCsv(
      "tamu-satujanji",
      ["Nama", "Grup", "Pax", "Telepon", "RSVP", "Terkirim", "Catatan"],
      visible.map((guest) => [
        guest.name,
        guest.group,
        guest.pax,
        guest.phone ?? "",
        guest.rsvp === "hadir" ? "Hadir" : guest.rsvp === "tidak" ? "Tidak" : "Belum",
        guest.invited ? "Ya" : "Belum",
        guest.note ?? "",
      ]),
    );
    toast.success("CSV tamu diunduh.");
  };

  /**
   * Impor CSV: header wajib punya kolom “Nama” (lainnya opsional):
   * Nama;Grup;Pax;Telepon;Catatan
   */
  const importCsv = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .filter((line) => line.trim());
      if (lines.length < 2) {
        toast.error("File kosong atau tidak punya baris data.");
        return;
      }
      const split = (line: string) => {
        const cells: string[] = [];
        let current = "";
        let quoted = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (quoted) {
            if (char === '"' && line[i + 1] === '"') {
              current += '"';
              i++;
            } else if (char === '"') {
              quoted = false;
            } else {
              current += char;
            }
          } else if (char === '"') {
            quoted = true;
          } else if (char === ";" || char === ",") {
            cells.push(current);
            current = "";
          } else {
            current += char;
          }
        }
        cells.push(current);
        return cells.map((cell) => cell.trim());
      };

      const header = split(lines[0]).map((cell) => cell.toLowerCase());
      const nameIdx = header.findIndex((cell) => cell.includes("nama") || cell === "name");
      if (nameIdx === -1) {
        toast.error('CSV harus punya kolom “Nama”. Lihat format: Nama;Grup;Pax;Telepon');
        return;
      }
      const groupIdx = header.findIndex((cell) => cell.includes("grup") || cell.includes("group") || cell.includes("keluarga"));
      const paxIdx = header.findIndex((cell) => cell.includes("pax") || cell.includes("orang"));
      const phoneIdx = header.findIndex((cell) => cell.includes("telepon") || cell.includes("phone") || cell.includes("wa"));
      const noteIdx = header.findIndex((cell) => cell.includes("catatan") || cell.includes("note"));

      const rows = lines.slice(1).map((line) => {
        const cells = split(line);
        return {
          name: cells[nameIdx] ?? "",
          group: groupIdx >= 0 ? cells[groupIdx] : undefined,
          pax: paxIdx >= 0 ? Number(cells[paxIdx]) || 1 : undefined,
          phone: phoneIdx >= 0 ? cells[phoneIdx] : undefined,
          note: noteIdx >= 0 ? cells[noteIdx] : undefined,
        };
      });

      const count = await importGuests({ rows });
      if (count > 0) bloom();
      toast.success(
        count > 0 ? `${count} tamu diimpor.` : "Tidak ada baris valid untuk diimpor.",
      );
    } catch {
      toast.error("Gagal membaca file CSV.");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  /** Konteks personalisasi template pesan dari data pernikahan. */
  const waContext = (guest: { name: string }): WaContext => ({
    namaTamu: guest.name,
    pasangan: wedding
      ? `${wedding.partnerOneName} & ${wedding.partnerTwoName}`
      : "pengantin",
    tanggal: wedding ? formatDateLongID(wedding.weddingDate) : "",
    venue: wedding?.venueName,
  });

  const sendTemplate = (templateKey: string) => {
    if (!waTarget?.phone) return;
    const template = WA_TEMPLATES.find((item) => item.key === templateKey);
    if (!template) return;
    const link = waLink(waTarget.phone, template.build(waContext(waTarget)));
    if (link) window.open(link, "_blank", "noopener,noreferrer");
    setWaTarget(null);
  };

  if (guests === undefined) return <PageSkeleton />;

  return (
    <div className="sj-document-page sj-guestbook-page space-y-4">
      <BackLink />

      <PageHeading
        kicker="Buku tamu"
        title="Daftar tamu"
        summary={
          list.length === 0
            ? "Belum ada nama di buku tamu. Mulai dari keluarga terdekat."
            : <>
                {totalPax} orang dari {list.length} undangan; {answered} sudah menjawab dan{" "}
                {attendingPax} orang diperkirakan hadir.
              </>
        }
        action={
          <>
            <Button className="min-h-11 rounded-lg" onClick={openNew}>
              <Plus className="size-4" /> Tamu baru
            </Button>
            <Button
              variant="secondary"
              className="min-h-11 rounded-lg"
              onClick={() => void markAllSent()}
            >
              <Send className="size-4" /> Tandai terkirim
            </Button>
            <Button variant="outline" className="min-h-11 rounded-lg" onClick={exportCsv}>
              <FileDown className="size-4" /> CSV
            </Button>
            <Button
              variant="outline"
              className="min-h-11 rounded-lg"
              disabled={importing}
              onClick={() => fileRef.current?.click()}
            >
              {importing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Impor
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importCsv(file);
              }}
            />
          </>
        }
      />

      <section className="sj-paper-sheet p-5" aria-label="Jawaban tamu">
        <p className="max-w-[64ch] text-base leading-relaxed text-[var(--ink)]">
          {list.length === 0
            ? "Begitu tamu ditambahkan, jawaban hadir dan berhalangan akan tampil di sini."
            : <>
                {invited} dari {list.length} undangan sudah dikirim; {answered} sudah menjawab.{" "}
                <strong className="num font-semibold">{attendingPax}</strong> orang hadir,{" "}
                <strong className="num font-semibold">{pendingPax}</strong> belum pasti, dan{" "}
                <strong className="num font-semibold">{declinedPax}</strong> berhalangan.
              </>}
        </p>

        <StackBar
          className="mt-4 h-2.5"
          label={`Hadir ${attendingPax} orang, menunggu ${pendingPax} orang, berhalangan ${declinedPax} orang`}
          segments={[
            { label: "Hadir", value: attendingPax, tone: "brand" },
            { label: "Belum menjawab", value: pendingPax, tone: "accent" },
            { label: "Berhalangan", value: declinedPax, tone: "sunk" },
          ]}
        />

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          <LedgerFigure
            label="Hadir"
            value={`${attendingPax} orang`}
            hint={`${list.filter((guest) => guest.rsvp === "hadir").length} undangan`}
          />
          <LedgerFigure
            label="Belum menjawab"
            value={`${pendingPax} orang`}
            hint={`${list.filter((guest) => guest.rsvp === "pending").length} undangan`}
          />
          <LedgerFigure
            label="Berhalangan"
            value={`${declinedPax} orang`}
            hint={`${list.filter((guest) => guest.rsvp === "tidak").length} undangan`}
          />
        </div>
      </section>

      {/* Satu baris saring: cari nama, status jawaban, sebaran grup. */}
      <div className="surface-sunk flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-soft)]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama tamu…"
            aria-label="Cari nama tamu"
            className="min-h-11 border-transparent bg-[var(--paper)] pl-9"
          />
        </div>
        <Segmented
          label="Saring status jawaban"
          value={rsvpFilter}
          onChange={setRsvpFilter}
          className="sm:w-auto"
          options={[
            { value: "semua", label: `Semua ${list.length}` },
            { value: "hadir", label: `Hadir ${list.filter((guest) => guest.rsvp === "hadir").length}` },
            { value: "pending", label: `Belum ${list.filter((guest) => guest.rsvp === "pending").length}` },
            { value: "tidak", label: `Tidak ${list.filter((guest) => guest.rsvp === "tidak").length}` },
          ]}
        />
      </div>

      <section className="space-y-4">
        {groupRows.length > 1 && (
          <div className="surface-sunk p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="text-sm text-[var(--ink-soft)]">Sebaran per grup</p>
              {groupFilter && (
                <button
                  type="button"
                  onClick={() => setGroupFilter(null)}
                  className="min-h-11 text-sm font-medium text-[var(--brand)] underline underline-offset-4"
                >
                  Tampilkan semua grup
                </button>
              )}
            </div>
            <ul className="mt-1 grid gap-1 sm:grid-cols-2">
              {groupRows.map((row) => {
                const active = groupFilter === row.group;
                return (
                  <li key={row.group}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setGroupFilter(active ? null : row.group)}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-lg border px-2.5 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
                        active
                          ? "border-[var(--brand)] bg-[var(--paper)]"
                          : "border-transparent hover:bg-[var(--paper)]"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--ink)]">
                        {row.group || "Tanpa grup"}
                      </span>
                      <span className="num shrink-0 text-[0.8125rem] text-[var(--ink-soft)]">
                        {row.orang} orang
                      </span>
                      <span
                        aria-hidden="true"
                        className="relative h-1 w-14 shrink-0 overflow-hidden rounded-full bg-[var(--paper-sunk)]"
                      >
                        <span
                          className="block h-full origin-left rounded-full bg-[var(--brand)] transition-transform duration-500 ease-out motion-reduce:transition-none"
                          style={{
                            transform: `scaleX(${totalPax ? row.orang / totalPax : 0})`,
                          }}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="sj-paper-sheet overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-2.5">
            <p className="text-sm text-[var(--ink-soft)]">
              {visible.length} dari {list.length} undangan tampil
            </p>
            {hasFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-11 text-sm font-medium text-[var(--brand)] underline underline-offset-4"
              >
                Hapus filter
              </button>
            )}
          </div>
          <Stagger>
          {visible.map((guest) => (
            <StaggerItem key={guest._id}>
              <article className="sj-ledger-row interactive-row px-3 py-3 sm:px-4">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="display-serif mt-0.5 grid size-10 shrink-0 place-items-center rounded-md border border-[var(--line)] bg-[var(--paper)] text-lg leading-none text-[var(--ink-soft)]"
                  >
                    {guest.name.trim().charAt(0).toUpperCase() || "?"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <p className="min-w-0 truncate text-base font-medium leading-snug text-[var(--ink)]">
                        {guest.name}
                      </p>
                      <p className="text-[0.8125rem] text-[var(--ink-soft)]">
                        {guest.group || "Tanpa grup"}
                      </p>
                      <span aria-hidden="true" className="sj-dot-leader hidden sm:block" />
                      <span className="num shrink-0 text-sm font-semibold text-[var(--ink)]">
                        {guest.pax} orang
                      </span>
                    </div>

                    {guest.note && (
                      <p className="mt-0.5 line-clamp-2 max-w-[60ch] text-[0.8125rem] leading-relaxed text-[var(--ink-soft)]">
                        {guest.note}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <GuestStatusChip
                        guest={guest}
                        onInvite={(next) => setInvited({ guestId: guest._id, invited: next })}
                        onRsvp={(next) => {
                          setRsvp({ guestId: guest._id, rsvp: next });
                          if (next === "hadir") bloom();
                        }}
                      />
                      {guest.phone && (
                        <>
                          <span className="num text-[0.8125rem] text-[var(--ink-soft)]">
                            {guest.phone}
                          </span>
                          <button
                            type="button"
                            aria-label={`Kirim pesan WhatsApp ke ${guest.name}`}
                            title="Kirim pesan WhatsApp"
                            onClick={() => setWaTarget({ name: guest.name, phone: guest.phone })}
                            className="flex size-11 items-center justify-center rounded-lg text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-sunk)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                          >
                            <MessageCircle className="size-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <RowMenu
                    onEdit={() => openEdit(guest)}
                    onDelete={() => {
                      removeGuest({ guestId: guest._id });
                      undoableDelete(
                        `Tamu "${guest.name}" dihapus.`,
                        async () => {
                          const newId = await createGuest({
                            name: guest.name,
                            group: guest.group,
                            pax: guest.pax,
                            phone: guest.phone,
                            note: guest.note,
                          });
                          // Pulihkan juga status undangan & RSVP-nya.
                          if (guest.invited) {
                            await setInvited({ guestId: newId, invited: true });
                          }
                          if (guest.rsvp !== "pending") {
                            await setRsvp({ guestId: newId, rsvp: guest.rsvp });
                          }
                        },
                        { successMessage: `Tamu "${guest.name}" kembali.` },
                      );
                    }}
                    deleteTitle={`Hapus ${guest.name}?`}
                  />
                </div>
              </article>
            </StaggerItem>
          ))}
          </Stagger>

          {visible.length === 0 && guests !== undefined && (
            <div className="p-3">
              <EmptyState
                emoji={hasFilter ? "🔍" : "💌"}
                title={hasFilter ? "Tidak ada tamu yang cocok" : "Belum ada tamu"}
                description={
                  hasFilter
                    ? "Ubah kata kunci atau tampilkan semua grup untuk melihat tamu lainnya."
                    : "Mulai dari keluarga terdekat, lalu teman dan rekan kerja."
                }
                actionLabel={hasFilter ? "Hapus filter" : "Tambah tamu"}
                onAction={hasFilter ? resetFilters : openNew}
              />
            </div>
          )}
        </div>
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

      {/* Template pesan WhatsApp */}
      <Dialog open={waTarget !== null} onOpenChange={(open) => !open && setWaTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kirim pesan WhatsApp</DialogTitle>
          </DialogHeader>
          <p className="meta">
            Untuk {waTarget?.name} — pilih template, pesan terisi otomatis lalu
            terbuka di WhatsApp.
          </p>
          <div className="space-y-2">
            {WA_TEMPLATES.map((template) => (
              <button
                key={template.key}
                type="button"
                onClick={() => sendTemplate(template.key)}
                disabled={!waTarget?.phone}
                className="surface-sunk w-full px-3.5 py-3 text-left transition-colors hover:bg-[var(--paper)] disabled:opacity-60"
              >
                <span className="block text-sm font-semibold text-[var(--ink)]">{template.label}</span>
                <span className="mt-0.5 block line-clamp-2 text-[0.8125rem] leading-relaxed text-[var(--ink-soft)]">
                  {waTarget
                    ? template.build(waContext(waTarget)).replace(/\n+/g, " ")
                    : ""}
                </span>
              </button>
            ))}
          </div>
          {!waTarget?.phone && (
            <p className="text-[0.8125rem] font-semibold text-destructive">
              Tamu ini belum punya nomor WhatsApp.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GuestStatusChip({
  guest,
  onInvite,
  onRsvp,
}: {
  guest: { name: string; invited?: boolean; rsvp: Rsvp };
  onInvite: (invited: boolean) => void;
  onRsvp: (rsvp: Rsvp) => void;
}) {
  const [open, setOpen] = useState(false);
  const invited = Boolean(guest.invited);
  const rsvpLabel =
    guest.rsvp === "hadir"
      ? "Hadir"
      : guest.rsvp === "tidak"
        ? "Berhalangan"
        : "Menunggu";
  const inviteLabel = invited ? "Terkirim" : "Belum dikirim";
  const label = `${inviteLabel}, ${rsvpLabel.toLowerCase()}`;
  const rsvpTone =
    guest.rsvp === "hadir"
      ? "text-[var(--positive)]"
      : guest.rsvp === "tidak"
        ? "text-[var(--danger)]"
        : "text-[var(--warning)]";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--line)] bg-transparent px-2.5 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--paper-sunk)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Status ${guest.name}: ${label}. Ubah status`}
        >
          {guest.rsvp === "hadir" && invited ? (
            <Check className="size-4 text-[var(--positive)]" />
          ) : (
            <Clock3Icon />
          )}
          <span className="flex items-baseline gap-2">
            <span className="text-[0.8125rem] text-[var(--ink-soft)]">{inviteLabel}</span>
            <span aria-hidden="true" className="h-3 w-px bg-[var(--line)]" />
            <span className={`text-[0.8125rem] font-medium ${rsvpTone}`}>{rsvpLabel}</span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 rounded-xl border-[var(--line)] bg-[var(--paper)] p-3 text-[var(--ink)] shadow-[var(--elev-lifted)]"
      >
        <p className="display-serif text-lg leading-snug text-[var(--ink)]">{guest.name}</p>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
          <Label htmlFor={`invited-${guest.name}`} className="text-sm text-[var(--ink)]">
            Undangan terkirim
          </Label>
          <Switch
            id={`invited-${guest.name}`}
            checked={invited}
            onCheckedChange={(next) => onInvite(Boolean(next))}
          />
        </div>

        <div className="mt-3 space-y-1.5">
          <p className="text-sm text-[var(--ink-soft)]">Jawaban tamu</p>
          <Segmented
            label={`Jawaban ${guest.name}`}
            value={guest.rsvp}
            onChange={(next) => {
              onRsvp(next);
              setOpen(false);
            }}
            options={RSVP_OPTIONS.map((option) => ({
              value: option.key,
              label: option.label,
            }))}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Clock3Icon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="size-4">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.75" />
    </svg>
  );
}
