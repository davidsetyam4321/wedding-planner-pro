import {
  BackLink,
  EmptyState,
  PageHeading,
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
import { useEffect, useRef, useState } from "react";
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
  const listRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLSpanElement>(null);

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

  // Spine tinta terisi mengikuti posisi gulir daftar, ditulis langsung ke
  // style supaya tidak memicu render React tiap frame.
  useEffect(() => {
    const node = listRef.current;
    const fill = spineRef.current;
    if (!node || !fill) return;
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.effects === "off";
    if (reduced) {
      fill.style.transform = "scaleY(1)";
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const progress =
        (window.innerHeight * 0.65 - rect.top) / Math.max(1, rect.height);
      fill.style.transform = `scaleY(${Math.max(0, Math.min(1, progress))})`;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [visible.length, list.length]);

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
    <div className="sj-document-page sj-rundown-page rundown-print space-y-4">
      <style>{`
        @media print {
          body:has(.rundown-print) nav,
          body:has(.rundown-print) .ambient { display: none !important; }
          body:has(.rundown-print) { background: #fff !important; }
          .rundown-print { max-width: none !important; color: #000 !important; }
          .rundown-print .rundown-noprint { display: none !important; }
          .rundown-print .sj-paper-sheet {
            background: #fff !important;
            border: 0 !important;
            box-shadow: none !important;
            -webkit-backdrop-filter: none !important;
            backdrop-filter: none !important;
          }
          .rundown-print .rundown-spine { background: #000 !important; }
          .rundown-print li { break-inside: avoid; page-break-inside: avoid; }
          .rundown-print .rundown-rule { border-color: #bbb !important; }
        }
      `}</style>
      <div className="rundown-noprint">
        <BackLink />
      </div>
      <PageHeading
        kicker="Susunan acara"
        title="Rundown acara"
        summary={
          list.length ? (
            <>
              {list.length} agenda dari pukul{" "}
              <strong className="num text-[var(--ink)]">{firstTime}</strong> sampai{" "}
              <strong className="num text-[var(--ink)]">{lastTime}</strong>, membentang{" "}
              <strong className="num text-[var(--ink)]">{formatDuration(totalMinutes)}</strong>.
            </>
          ) : (
            "Susun jalannya acara, dari akad hingga walimah."
          )
        }
        action={
          <>
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
          </>
        }
      />

      {list.length > 3 && (
        <div className="rundown-noprint relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-soft)]" />
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

      <section ref={listRef} className="relative" aria-label="Susunan acara">
        {list.length > 0 && (
          <>
            <span
              aria-hidden="true"
              className="rundown-spine absolute bottom-0 left-[3.1rem] top-0 w-px bg-[var(--line)] sm:left-[5.6rem]"
            />
            <span
              ref={spineRef}
              aria-hidden="true"
              className="rundown-spine absolute bottom-0 left-[3.1rem] top-0 w-px origin-top bg-[var(--brand)] sm:left-[5.6rem]"
              style={{ transform: "scaleY(0)" }}
            />
          </>
        )}
        <Stagger className="">
          {visible.map((item, index) => {
            const duration = item.durationMinutes ?? 0;
            const endTime = duration > 0 ? addMinutes(item.startTime, duration) : undefined;
            return (
              <StaggerItem key={item._id}>
                <div className="rundown-rule group grid grid-cols-[3.1rem_minmax(0,1fr)] items-start gap-x-4 border-b border-[var(--line)] py-5 sm:grid-cols-[5.6rem_minmax(0,1fr)] sm:gap-x-6">
                  <div className="min-w-0 pr-1 text-right">
                    <p className="display-serif num text-[1.4rem] leading-none text-[var(--ink)] sm:text-[2rem]">
                      {item.startTime}
                    </p>
                    {endTime && (
                      <p className="num mt-1.5 text-[0.8125rem] leading-tight text-[var(--ink-soft)]">
                        sampai {endTime}
                      </p>
                    )}
                    <p className="num mt-1 text-[0.8125rem] leading-tight text-[var(--ink-soft)]">
                      {duration > 0 ? formatDuration(duration) : "tanpa durasi"}
                    </p>
                  </div>

                  <div className="relative min-w-0">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[1.15rem] top-[0.55rem] size-1.5 rounded-full bg-[var(--paper)] ring-1 ring-[var(--brand)] sm:-left-[1.4rem]"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="num text-[0.8125rem] text-[var(--accent)]">
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        <h2 className="display-serif mt-0.5 text-[1.35rem] leading-snug text-[var(--ink)] sm:text-[1.6rem]">
                          {item.title}
                        </h2>
                      </div>
                      <div className="rundown-noprint shrink-0">
                        <RowMenu
                          onEdit={() => openEdit(item)}
                          onDelete={() => deleteItem(item)}
                          deleteTitle={`Hapus "${item.title}"?`}
                        />
                      </div>
                    </div>
                    {item.pic && (
                      <p className="mt-1.5 text-sm text-[var(--ink-soft)]">
                        Penanggung jawab <span className="text-[var(--ink)]">{item.pic}</span>
                      </p>
                    )}
                    {item.note && (
                      <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-[var(--ink-soft)]">
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        {items !== undefined && list.length === 0 && (
          <div className="rundown-noprint pt-2">
            <EmptyState
              emoji="⏰"
              title="Belum ada agenda"
              description="Susun acara hari-H dari persiapan pagi sampai ramah tamah malam."
              actionLabel="Tambah agenda"
              onAction={openNew}
            />
          </div>
        )}

        {list.length > 0 && visible.length === 0 && (
          <div className="rundown-noprint pt-2">
            <EmptyState
              emoji="🔍"
              title="Tidak ada agenda yang cocok"
              description={`Tidak ada acara yang mengandung “${query}”. Coba kata kunci lain.`}
              actionLabel="Reset pencarian"
              onAction={() => setQuery("")}
            />
          </div>
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
