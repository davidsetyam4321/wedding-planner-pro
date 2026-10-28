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
import { printDocument } from "@/lib/printDoc";
import { undoableDelete } from "@/lib/undo";
import { Loader2, Plus, Printer, Search, X } from "@/lib/icons";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

/** Tambah menit ke "HH:MM" dan kembalikan "HH:MM". */
function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map((value) => Number(value) || 0);
  const total = (hours * 60 + mins + minutes) % (24 * 60);
  const nextHours = Math.floor(total / 60);
  const nextMins = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMins).padStart(2, "0")}`;
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} m`;
  if (mins === 0) return `${hours} j`;
  return `${hours} j ${mins} m`;
}

type RundownForm = {
  id: Id<"rundownItem"> | null;
  startTime: string;
  title: string;
  duration: string;
  note: string;
  pic: string;
};

const EMPTY_FORM: RundownForm = {
  id: null,
  startTime: "08:00",
  title: "",
  duration: "",
  note: "",
  pic: "",
};

/** Tanggal hari-H dalam format panjang, untuk subtitle dokumen cetak. */
function formatWeddingDate(ms: number): string {
  return new Date(ms).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Rundown acara: susunan agenda hari-H urut jam. */
export function RundownPage() {
  const items = useQuery(api.rundown.list);
  const wedding = useQuery(api.wedding.get);
  const createItem = useMutation(api.rundown.create);
  const updateItem = useMutation(api.rundown.update);
  const removeItem = useMutation(api.rundown.remove);

  const [form, setForm] = useState<RundownForm>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const list = items ?? [];
  const term = query.trim().toLowerCase();
  // Pencarian menyaring daftar yang tampil; ringkasan tetap dihitung dari
  // seluruh agenda supaya jam mulai/selesai tidak berubah saat mencari.
  const visible =
    term === ""
      ? list
      : list.filter(
          (item) =>
            item.title.toLowerCase().includes(term) ||
            (item.note ?? "").toLowerCase().includes(term) ||
            (item.pic ?? "").toLowerCase().includes(term),
        );
  const firstTime = list[0]?.startTime;
  const endMinutes = list.reduce((latest, item) => {
    const [hours, minutes] = item.startTime.split(":").map(Number);
    const end = (hours * 60 + minutes) + (item.durationMinutes ?? 0);
    return Math.max(latest, end);
  }, firstTime ? (() => { const [hours, minutes] = firstTime.split(":").map(Number); return hours * 60 + minutes; })() : 0);
  const lastTime = list.length > 0
    ? `${String(Math.floor((endMinutes % 1440) / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`
    : undefined;
  // Agenda yang tumpang tindih dihitung sebagai satu rentang keseluruhan, bukan
  // dijumlahkan berulang kali seperti durasi setiap item.
  const totalMinutes = list.length > 0
    ? Math.max(0, endMinutes - (() => { const [hours, minutes] = firstTime!.split(":").map(Number); return hours * 60 + minutes; })())
    : 0;

  const openNew = () => {
    const previous = list[list.length - 1];
    setForm({
      ...EMPTY_FORM,
      startTime: previous
        ? addMinutes(previous.startTime, previous.durationMinutes ?? 0)
        : "08:00",
    });
    setFormOpen(true);
  };

  const openEdit = (item: (typeof list)[number]) => {
    setForm({
      id: item._id,
      startTime: item.startTime,
      title: item.title,
      duration:
        item.durationMinutes === undefined ? "" : String(item.durationMinutes),
      note: item.note ?? "",
      pic: item.pic ?? "",
    });
    setFormOpen(true);
  };

  /** Cetak / simpan PDF rundown supaya bisa dibagikan ke WO dan keluarga. */
  const printRundown = () => {
    if (list.length === 0) {
      toast.error("Belum ada agenda untuk dicetak.");
      return;
    }
    const couple = wedding
      ? `${wedding.partnerOneName} & ${wedding.partnerTwoName}`
      : "Rundown acara";
    const subtitle = wedding
      ? `${couple} · ${formatWeddingDate(wedding.weddingDate)}${wedding.venueName ? ` · ${wedding.venueName}` : ""}`
      : couple;
    printDocument("Rundown Acara", subtitle, [
      {
        title: "Susunan acara",
        headers: ["Jam", "Acara", "Durasi", "PIC", "Catatan"],
        rows: list.map((item) => [
          item.startTime,
          item.title,
          item.durationMinutes ? formatDuration(item.durationMinutes) : "—",
          item.pic ?? "—",
          item.note ?? "—",
        ]),
      },
      {
        title: "Ringkasan",
        lines: [
          `Jumlah agenda: ${list.length}`,
          `Mulai: ${firstTime ?? "—"}${lastTime ? ` · Selesai: ${lastTime}` : ""}`,
          `Total durasi: ${formatDuration(totalMinutes)}`,
        ],
      },
    ]);
  };

  /** Hapus dengan jendela pembatalan (Undo) — agenda dipulihkan utuh. */
  const deleteItem = (item: (typeof list)[number]) => {
    void removeItem({ itemId: item._id });
    undoableDelete(`Agenda "${item.title}" dihapus.`, async () => {
      await createItem({
        startTime: item.startTime,
        title: item.title,
        durationMinutes: item.durationMinutes,
        note: item.note,
        pic: item.pic,
      });
    });
  };

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error("Nama acara wajib diisi.");
      return;
    }
    const durationMinutes = form.duration === "" ? undefined : Number(form.duration) || 0;
    setBusy(true);
    try {
      if (form.id) {
        await updateItem({
          itemId: form.id,
          startTime: form.startTime,
          title: form.title,
          note: form.note,
          durationMinutes,
          pic: form.pic,
        });
        toast.success("Agenda diperbarui.");
      } else {
        await createItem({
          startTime: form.startTime,
          title: form.title,
          note: form.note,
          durationMinutes,
          pic: form.pic,
        });
        bloom();
        toast.success("Agenda ditambahkan.");
      }
      setFormOpen(false);
      setForm(EMPTY_FORM);
    } catch {
      toast.error("Gagal menyimpan agenda.");
    } finally {
      setBusy(false);
    }
  };

  if (items === undefined) return <PageSkeleton />;

  return (
    <div className="sj-document-page sj-rundown-page space-y-4">
      <BackLink />
      <header className="sj-page-heading border-b border-[var(--line)] pb-4">
        <p className="text-sm text-[var(--ink-soft)]">Susunan acara tercetak</p>
        <h1 className="mt-1 font-serif text-[clamp(2.25rem,4vw,3.5rem)] leading-tight text-[var(--ink)]">Rundown acara</h1>
        <p className="mt-2 text-base leading-relaxed text-[var(--ink-soft)]">{list.length ? <>Acara berlangsung dari <strong className="num text-[var(--ink)]">{firstTime}</strong> hingga <strong className="num text-[var(--ink)]">{lastTime}</strong>.</> : "Susun jalannya acara, dari akad hingga walimah."}</p>
      </header>
      <section className="sj-paper-sheet p-5">
        <p className="max-w-[58ch] font-serif text-[1.375rem] leading-snug text-[var(--ink)] sm:text-2xl">
          {list.length === 0
            ? "Belum ada agenda. Susunan acara akan tercetak rapi di sini setelah agenda pertama ditambahkan."
            : `${list.length} agenda tersusun dari pukul ${firstTime} sampai ${lastTime}, membentang ${formatDuration(totalMinutes)}.`}
        </p>
        <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-[var(--ink-soft)]">
          Total durasi mengikuti rentang dari agenda pertama sampai agenda yang paling akhir selesai, jadi agenda yang tumpang tindih tidak dihitung dua kali.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Button className="rounded-lg" onClick={openNew}>
          <Plus className="size-4" /> Tambah agenda
        </Button>
        <Button
          variant="outline"
          className="rounded-lg"
          onClick={printRundown}
          disabled={list.length === 0}
        >
          <Printer className="size-4" /> Cetak / PDF
        </Button>
      </div>

      {list.length > 3 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari acara, PIC, atau catatan"
            className="pl-9 pr-12"
            aria-label="Cari agenda"
          />
          {query !== "" && (
            <button
              type="button"
              aria-label="Bersihkan pencarian"
              onClick={() => setQuery("")}
              className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--ink-soft)] hover:text-[var(--ink)]"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      <section className="relative">
        <Stagger className="divide-y divide-[var(--line)]">
          {visible.map((item) => {
            const duration = item.durationMinutes ?? 0;
            return (
              <StaggerItem key={item._id}>
                <div className="flex items-start gap-3 py-4 sm:gap-5">
                  <div className="w-14 shrink-0 text-right sm:w-20">
                    <p className="num font-serif text-[1.5rem] leading-none text-[var(--ink)] sm:text-[1.75rem]">
                      {item.startTime}
                    </p>
                    <p className="num mt-1.5 text-[0.8125rem] text-[var(--ink-soft)]">
                      {duration > 0 ? formatDuration(duration) : "tanpa durasi"}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1 border-l border-[var(--line)] pl-4 sm:pl-5">
                    <p className="text-base font-semibold leading-snug text-[var(--ink)]">
                      {item.title}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--ink-soft)]">
                      {duration > 0 && (
                        <span className="num">
                          selesai {addMinutes(item.startTime, duration)}
                        </span>
                      )}
                      {item.pic && <span>PIC {item.pic}</span>}
                    </p>
                    {item.note && (
                      <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-[var(--ink-soft)]">
                        {item.note}
                      </p>
                    )}
                  </div>

                  <RowMenu
                    onEdit={() => openEdit(item)}
                    onDelete={() => deleteItem(item)}
                    deleteTitle={`Hapus "${item.title}"?`}
                  />
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        {items !== undefined && list.length === 0 && (
          <EmptyState
            emoji="⏰"
            title="Belum ada agenda"
            description="Susun acara hari-H dari persiapan pagi sampai ramah tamah malam."
            actionLabel="Tambah agenda"
            onAction={openNew}
          />
        )}

        {list.length > 0 && visible.length === 0 && (
          <EmptyState
            emoji="🔍"
            title="Tidak ada agenda yang cocok"
            description={`Tidak ada acara yang mengandung “${query}”. Coba kata kunci lain.`}
            actionLabel="Reset pencarian"
            onAction={() => setQuery("")}
          />
        )}
      </section>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{form.id ? "Ubah agenda" : "Agenda baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="rundown-title">Acara</Label>
              <Input
                id="rundown-title"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="cth. Prosesi akad"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rundown-time">Jam mulai</Label>
                <Input
                  id="rundown-time"
                  type="time"
                  value={form.startTime}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, startTime: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rundown-duration">Durasi (menit)</Label>
                <Input
                  id="rundown-duration"
                  type="number"
                  min={0}
                  step={15}
                  value={form.duration}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, duration: event.target.value }))
                  }
                  placeholder="45"
                />
              </div>
            </div>
            {form.duration !== "" && Number(form.duration) > 0 && (
              <p className="meta">
                Selesai sekitar {addMinutes(form.startTime, Number(form.duration))}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="rundown-pic">Penanggung jawab (opsional)</Label>
              <Input
                id="rundown-pic"
                value={form.pic}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, pic: event.target.value }))
                }
                placeholder="cth. MC, keluarga, WO"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rundown-note">Catatan (opsional)</Label>
              <Input
                id="rundown-note"
                value={form.note}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, note: event.target.value }))
                }
                placeholder="cth. koordinasi dengan MC"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={busy} className="w-full rounded-lg">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Simpan agenda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
