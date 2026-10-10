import { CHART_COLORS, ChartCard, ChartTip } from "@/components/Charts";
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
import { WA_TEMPLATES, waLink, type WaContext } from "@/lib/contact";
import { downloadCsv } from "@/lib/exportCsv";
import { formatDateLongID } from "@/lib/format";
import {
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  // Bar 3 segmen gaya SatuJanji: hadir / menunggu / berhalangan (berdasar pax).
  const paxBase = Math.max(1, totalPax);
  const hadirSeg = Math.round((attendingPax / paxBase) * 100);
  const tidakSeg = Math.round((declinedPax / paxBase) * 100);
  const pendingSeg = Math.max(0, 100 - hadirSeg - tidakSeg);

  // Donut komposisi RSVP (berdasar pax) — klik irisan/legenda → filter daftar.
  const pendingPax = Math.max(0, totalPax - attendingPax - declinedPax);
  const rsvpDonut: {
    key: Rsvp;
    name: string;
    value: number;
    color: string;
  }[] = [
    { key: "hadir" as const, name: "Hadir", value: attendingPax, color: "var(--chart-1)" },
    { key: "pending" as const, name: "Menunggu", value: pendingPax, color: "var(--chart-3)" },
    { key: "tidak" as const, name: "Berhalangan", value: declinedPax, color: "var(--color-stone)" },
  ].filter((row) => row.value > 0);

  // Sebaran pax per grup (maks 6 teratas) — klik batang → filter grup.
  const groupBarData = groups
    .map((group) => ({
      group,
      name: group,
      orang: list
        .filter((guest) => guest.group === group)
        .reduce((sum, guest) => sum + guest.pax, 0),
    }))
    .sort((a, b) => b.orang - a.orang)
    .slice(0, 6);

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
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-secondary text-secondary-foreground"
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
    <div className="space-y-4">
      <BackLink />

      <section className="clay p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label text-muted-foreground">Respons undangan</p>
            <p className="meta mt-1">
              {list.length} tamu · {totalPax} orang · {invited} terkirim
            </p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-tint-sky text-xl text-tint-sky-foreground shadow-sm">
            💌
          </div>
        </div>
        <div className="relative mt-4 flex h-2 w-full overflow-hidden rounded-full bg-mist-gray">
          <div
            className="h-full bg-primary transition-all duration-700"
            style={{ width: `${hadirSeg}%` }}
            title="Hadir"
          />
          <div
            className="h-full bg-gold transition-all duration-700"
            style={{ width: `${pendingSeg}%` }}
            title="Menunggu"
          />
          <div
            className="h-full bg-border transition-all duration-700"
            style={{ width: `${tidakSeg}%` }}
            title="Berhalangan"
          />
        </div>
        <div className="relative mt-4 flex items-center gap-2 overflow-x-auto pb-0.5">
          {rsvpPill("semua", "Semua", list.length)}
          {rsvpPill("hadir", "Hadir", list.filter((guest) => guest.rsvp === "hadir").length)}
          {rsvpPill("pending", "Belum", list.filter((guest) => guest.rsvp === "pending").length)}
          {rsvpPill("tidak", "Tidak", list.filter((guest) => guest.rsvp === "tidak").length)}
        </div>
        <dl className="relative mt-3 grid grid-cols-3 gap-2">
          <div className="stat-tile bg-secondary">
            <dt>Total</dt>
            <dd>{totalPax} org</dd>
          </div>
          <div className="stat-tile bg-secondary">
            <dt>Hadir</dt>
            <dd>{attendingPax} org</dd>
          </div>
          <div className="stat-tile bg-secondary">
            <dt>Terikirim</dt>
            <dd>{invited}/{list.length}</dd>
          </div>
        </dl>
      </section>

      {rsvpDonut.length > 0 && (
        <ChartCard title="Komposisi RSVP" meta="Klik irisan untuk filter">
          <div className="flex items-center gap-4">
            <div className="relative size-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rsvpDonut}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={58}
                    paddingAngle={3}
                    cornerRadius={6}
                    strokeWidth={0}
                  >
                    {rsvpDonut.map((row) => (
                      <Cell
                        key={row.key}
                        fill={row.color}
                        className="cursor-pointer"
                        onClick={() =>
                          setRsvpFilter((previous) =>
                            previous === row.key ? "semua" : row.key,
                          )
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<ChartTip format={(value) => `${value} orang`} />}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="num text-sm font-extrabold">{totalPax}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  orang
                </span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-1.5">
              {rsvpDonut.map((row) => (
                <li key={row.key}>
                  <button
                    type="button"
                    onClick={() =>
                      setRsvpFilter((previous) =>
                        previous === row.key ? "semua" : row.key,
                      )
                    }
                    className="flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-xs transition-colors hover:bg-secondary"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-left font-semibold">
                      {row.name}
                    </span>
                    <span className="num font-bold">{row.value}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>
      )}

      {groupBarData.length > 1 && (
        <ChartCard title="Sebaran per grup" meta="Klik batang untuk filter">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={groupBarData}
                layout="vertical"
                margin={{ top: 4, right: 8, bottom: 0, left: 4 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="var(--color-fog)"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={94}
                />
                <Tooltip
                  content={<ChartTip format={(value) => `${value} orang`} />}
                  cursor={{ fill: "var(--color-mist-gray)" }}
                />
                <Bar
                  dataKey="orang"
                  name="Orang"
                  radius={[0, 4, 4, 0]}
                  barSize={12}
                >
                  {groupBarData.map((row, index) => (
                    <Cell
                      key={row.group}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      className="cursor-pointer"
                      onClick={() =>
                        setGroupFilter((previous) =>
                          previous === row.group ? null : row.group,
                        )
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <div className="flex flex-wrap gap-2">
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
        <Button
          variant="outline"
          className="rounded-2xl"
          onClick={exportCsv}
        >
          <FileDown className="size-4" /> CSV
        </Button>
        <Button
          variant="outline"
          className="rounded-2xl"
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
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama tamu…"
          aria-label="Cari nama tamu"
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
                      <button
                        type="button"
                        aria-label="Kirim pesan WhatsApp"
                        title="Kirim pesan WhatsApp"
                        onClick={() =>
                          setWaTarget({ name: guest.name, phone: guest.phone })
                        }
                        className="flex size-7 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-primary"
                      >
                        <MessageCircle className="size-4" />
                      </button>
                    )}
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
                className="clay-inset w-full rounded-2xl px-3.5 py-3 text-left transition-colors hover:bg-secondary disabled:opacity-60"
              >
                <span className="block text-sm font-bold">{template.label}</span>
                <span className="meta mt-0.5 block line-clamp-2">
                  {waTarget
                    ? template.build(waContext(waTarget)).replace(/\n+/g, " ")
                    : ""}
                </span>
              </button>
            ))}
          </div>
          {!waTarget?.phone && (
            <p className="text-xs font-semibold text-destructive">
              Tamu ini belum punya nomor WhatsApp.
            </p>
          )}
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
