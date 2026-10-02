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
import { Clock, Loader2, Plus } from "lucide-react";
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
};

const EMPTY_FORM: RundownForm = {
  id: null,
  startTime: "08:00",
  title: "",
  duration: "",
  note: "",
};

/** Rundown acara: susunan agenda hari-H urut jam. */
export function RundownPage() {
  const items = useQuery(api.rundown.list);
  const createItem = useMutation(api.rundown.create);
  const updateItem = useMutation(api.rundown.update);
  const removeItem = useMutation(api.rundown.remove);

  const [form, setForm] = useState<RundownForm>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const list = items ?? [];
  const firstTime = list[0]?.startTime;
  const lastItem = list[list.length - 1];
  const lastTime = lastItem
    ? addMinutes(lastItem.startTime, lastItem.durationMinutes ?? 0)
    : undefined;
  const totalMinutes = list.reduce(
    (sum, item) => sum + (item.durationMinutes ?? 0),
    0,
  );

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
    });
    setFormOpen(true);
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
        });
        toast.success("Agenda diperbarui.");
      } else {
        await createItem({
          startTime: form.startTime,
          title: form.title,
          note: form.note,
          durationMinutes,
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
    <div className="space-y-4">
      <BackLink fallback="/app/lainnya" />

      <section className="clay grad-sage relative overflow-hidden p-5 text-tint-sage-foreground">
        <FlowerMark className="float-slow pointer-events-none absolute -right-3 -top-3 size-20 opacity-25" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h1 className="h-page">Rundown Acara</h1>
            <p className="meta">
              {list.length} agenda
              {firstTime && lastTime ? ` · ${firstTime}–${lastTime}` : ""}
            </p>
          </div>
          <div className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-white/70 text-xl">
            ⏰
          </div>
        </div>
        <dl className="relative mt-4 grid grid-cols-3 gap-2">
          <div className="stat-tile bg-white/70">
            <dt>Agenda</dt>
            <dd>{list.length}</dd>
          </div>
          <div className="stat-tile bg-white/70">
            <dt>Mulai</dt>
            <dd>{firstTime ?? "—"}</dd>
          </div>
          <div className="stat-tile bg-white/70">
            <dt>Total durasi</dt>
            <dd>{formatDuration(totalMinutes)}</dd>
          </div>
        </dl>
      </section>

      <Button className="w-full rounded-2xl" onClick={openNew}>
        <Plus className="size-4" /> Tambah agenda
      </Button>

      <section className="relative">
        {list.length > 0 && (
          <span
            aria-hidden
            className="absolute bottom-4 left-[52px] top-4 w-0.5 rounded-full bg-gradient-to-b from-primary/40 via-primary/25 to-transparent"
          />
        )}
        <Stagger className="space-y-3">
          {list.map((item) => {
            const duration = item.durationMinutes ?? 0;
            return (
              <StaggerItem key={item._id}>
                <div className="relative flex items-start gap-3">
                  {/* Timeline dot + clock chip */}
                  <div className="relative z-10 flex w-12 shrink-0 flex-col items-center">
                    <div className="clay-sm rounded-2xl bg-primary px-1.5 py-2 text-center text-primary-foreground">
                      <p className="num text-xs font-extrabold">{item.startTime}</p>
                      {duration > 0 && (
                        <p className="num text-[10px] opacity-80">
                          {addMinutes(item.startTime, duration)}
                        </p>
                      )}
                    </div>
                    <span className="mt-1 size-2 rounded-full bg-primary/60 ring-4 ring-background/80" />
                  </div>

                  <article className="clay min-w-0 flex-1 p-3.5">
                    <p className="text-sm font-bold leading-snug">{item.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {duration > 0 ? (
                        <span className="chip bg-tint-sage text-tint-sage-foreground">
                          <Clock className="size-3" /> {formatDuration(duration)}
                        </span>
                      ) : (
                        <span className="meta">Durasi belum diisi</span>
                      )}
                    </div>
                    {item.note && <p className="meta mt-1">{item.note}</p>}
                    <div className="absolute right-2 top-2">
                      <RowMenu
                        onEdit={() => openEdit(item)}
                        onDelete={() => {
                          removeItem({ itemId: item._id });
                          toast.success("Agenda dihapus.");
                        }}
                        deleteTitle={`Hapus "${item.title}"?`}
                      />
                    </div>
                  </article>
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
            <Button onClick={submit} disabled={busy} className="w-full rounded-2xl">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Simpan agenda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
