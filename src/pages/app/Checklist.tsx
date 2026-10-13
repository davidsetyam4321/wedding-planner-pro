import { CHART_COLORS, ChartCard, ChartTip } from "@/components/Charts";
import { EmptyState, PageSkeleton, RowMenu, Stagger, StaggerItem, DueChip } from "@/components/Shared";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { bloom } from "@/lib/bloom";
import { fromDateInputValue, toDateInputValue } from "@/lib/format";
import { undoableDelete } from "@/lib/undo";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  PRIORITY_BADGE,
  PRIORITY_LABEL,
  nextPriority,
  normalizePriority,
} from "@/lib/priority";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "@/lib/icons";
import { useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

type Filter = "semua" | "belum" | "selesai";

/**
 * Baris tugas yang bisa diseret. Handle-nya terpisah dari tombol lain supaya
 * menyeret tidak pernah bentrok dengan mencentang atau mengubah prioritas.
 */
function SortableTask({
  id,
  children,
}: {
  id: string;
  children: (
    handle: ReactNode,
    ref: (node: HTMLLIElement | null) => void,
    style: CSSProperties,
  ) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };
  const handle = (
    <button
      type="button"
      aria-label="Geser untuk mengubah urutan"
      title="Tahan lalu geser untuk mengubah urutan"
      className="flex size-6 shrink-0 touch-none items-center justify-center rounded-lg text-muted-foreground/70 hover:text-primary active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );
  return <>{children(handle, setNodeRef, style)}</>;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "belum", label: "Belum" },
  { key: "selesai", label: "Selesai" },
];

const CALENDAR_VIEWS: { key: CalendarView; label: string }[] = [
  { key: "bulan", label: "Bulan" },
  { key: "minggu", label: "Minggu" },
  { key: "hari", label: "Hari" },
];

type CalendarView = "bulan" | "minggu" | "hari";

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function dayKey(date: Date): string {
  return toDateInputValue(date.getTime());
}

function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function shiftDate(date: Date, days: number): Date {
  const shifted = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

export function ChecklistPage() {
  const reducedMotion = useReducedMotion();
  const items = useQuery(api.checklist.list);
  const createItem = useMutation(api.checklist.create);
  const createMany = useMutation(api.checklist.createMany);
  const updateItem = useMutation(api.checklist.update);
  const toggleItem = useMutation(api.checklist.toggle);
  const setPriority = useMutation(api.checklist.setPriority);
  const removeItem = useMutation(api.checklist.remove);
  const clearDone = useMutation(api.checklist.clearDone);
  const reorderItems = useMutation(api.checklist.reorder);
  // Jarak 6px sebelum drag dianggap mulai, supaya klik biasa tidak pernah
  // berubah jadi seretan; di perangkat sentuh pakai tahan lama 160ms.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 160, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>("semua");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{
    id: Id<"checklistItem">;
    label: string;
    /** nilai input type=date ("" = tanpa tenggat) */
    due: string;
    /** penanggung jawab ("" = belum ditentukan) */
    pic: string;
  } | null>(null);
  const [newDue, setNewDue] = useState("");
  const [editingBusy, setEditingBusy] = useState(false);
  const [showDone, setShowDone] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<
    "tinggi" | "sedang" | "rendah" | null
  >(null);
  const [calendarView, setCalendarView] = useState<CalendarView>("bulan");
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => dayKey(new Date()));

  const all = items ?? [];
  const open = all.filter((item) => !item.done);
  const done = all.filter((item) => item.done);
  const pct = all.length > 0 ? Math.round((done.length / all.length) * 100) : 0;

  const monthStart = new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth(),
    1,
  );
  const monthEnd = new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth() + 1,
    1,
  );
  const monthTasks = all
    .filter((item) => {
      if (!item.dueDate) return false;
      const due = new Date(item.dueDate);
      return due >= monthStart && due < monthEnd;
    })
    .sort((a, b) =>
      (a.dueDate ?? 0) - (b.dueDate ?? 0) || a.sortOrder - b.sortOrder,
    );
  const selectedDayTasks = all
    .filter((item) => item.dueDate && dayKey(new Date(item.dueDate)) === selectedDay)
    .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));
  const undatedTasks = all.filter((item) => !item.dueDate);
  const filtered =
    Boolean(query) || filter !== "semua" || priorityFilter !== null;
  const listMonthDate =
    calendarView === "bulan" ? calendarDate : new Date(`${selectedDay}T12:00:00`);
  const listMonthStart = new Date(
    listMonthDate.getFullYear(),
    listMonthDate.getMonth(),
    1,
  );
  const listMonthEnd = new Date(
    listMonthDate.getFullYear(),
    listMonthDate.getMonth() + 1,
    1,
  );
  const listMonthLabel = listMonthDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const calendarDays = (() => {
    if (calendarView === "hari") return [new Date(`${selectedDay}T12:00:00`)];
    if (calendarView === "minggu") {
      const selected = new Date(`${selectedDay}T12:00:00`);
      return Array.from({ length: 7 }, (_, index) =>
        shiftDate(startOfWeek(selected), index),
      );
    }
    const first = startOfWeek(monthStart);
    const weekCount = Math.ceil(
      (new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate() +
        monthStart.getDay()) /
        7,
    );
    return Array.from({ length: weekCount * 7 }, (_, index) => shiftDate(first, index));
  })();
  const monthLabel = calendarDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
  const calendarHeading =
    calendarView === "hari"
      ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : calendarView === "minggu"
        ? `${calendarDays[0]?.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} – ${calendarDays[6]?.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
        : monthLabel;

  const moveCalendar = (direction: -1 | 1) => {
    if (calendarView === "hari") {
      const next = shiftDate(new Date(`${selectedDay}T12:00:00`), direction);
      setSelectedDay(dayKey(next));
      setCalendarDate(next);
    } else if (calendarView === "minggu") {
      const next = shiftDate(new Date(`${selectedDay}T12:00:00`), direction * 7);
      setSelectedDay(dayKey(next));
      setCalendarDate(next);
    } else {
      const next = new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth() + direction,
        1,
      );
      setCalendarDate(next);
      setSelectedDay(dayKey(next));
    }
  };

  const matches = (text: string) =>
    query.trim() === "" || text.toLowerCase().includes(query.trim().toLowerCase());

  const visible = all
    .filter((item) => {
      if (filter === "belum" && item.done) return false;
      if (filter === "selesai" && !item.done) return false;
      if (priorityFilter && normalizePriority(item.priority) !== priorityFilter)
        return false;
      if (
        item.dueDate &&
        (new Date(item.dueDate) < listMonthStart || new Date(item.dueDate) >= listMonthEnd)
      )
        return false;
      return matches(item.label);
    })
    .sort(
      (a, b) =>
        (a.dueDate ?? Number.POSITIVE_INFINITY) -
          (b.dueDate ?? Number.POSITIVE_INFINITY) ||
        a.sortOrder - b.sortOrder,
    );
  const visibleDated = visible.filter((item) => item.dueDate !== undefined);
  const visibleOpen = visibleDated.filter((item) => !item.done);
  const visibleDone = visibleDated.filter((item) => item.done);
  const visibleUndated = visible.filter((item) => item.dueDate === undefined);

  // Daftar kalender selalu diurutkan berdasarkan tenggat; urutan manual tidak
  // diaktifkan di tampilan ini agar drag tidak melawan urutan tanggal tersebut.
  const dragEnabled = false;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = visibleOpen.map((item) => item._id);
    const from = ids.indexOf(active.id as Id<"checklistItem">);
    const to = ids.indexOf(over.id as Id<"checklistItem">);
    if (from < 0 || to < 0) return;
    void reorderItems({ itemIds: arrayMove(ids, from, to) });
  };

  // Bar progres per prioritas — klik batang → filter daftar tugas.
  type PriorityKey = keyof typeof PRIORITY_LABEL;
  const priorityBarData = (Object.keys(PRIORITY_LABEL) as PriorityKey[])
    .map((key) => {
      const rows = all.filter(
        (item) => normalizePriority(item.priority) === key,
      );
      return {
        key,
        name: PRIORITY_LABEL[key],
        selesai: rows.filter((row) => row.done).length,
        sisa: rows.filter((row) => !row.done).length,
        total: rows.length,
      };
    })
    .filter((row) => row.total > 0);

  // Burndown: sisa tugas terbuka di akhir tiap pekan (createdAt + doneAt).
  // Jendela pekan diturunkan murni dari data (tanpa Date.now() saat render).
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const activityBounds = all
    .flatMap((item) => [item.createdAt ?? 0, item.doneAt ?? 0])
    .filter((value) => value > 0);
  const earliest = activityBounds.length > 0 ? Math.min(...activityBounds) : 0;
  const latest = activityBounds.length > 0 ? Math.max(...activityBounds) : 0;
  const weekEnds =
    earliest > 0 && latest >= earliest
      ? Array.from(
          {
            length: Math.min(
              26,
              Math.max(2, Math.ceil((latest - earliest) / weekMs) + 1),
            ),
          },
          (_, index) => earliest + (index + 1) * weekMs,
        )
      : [];
  const burndownData = weekEnds.map((weekEnd) => {
    const created = all.filter(
      (item) => (item.createdAt ?? 0) <= weekEnd,
    ).length;
    const finished = all.filter(
      (item) =>
        item.done && (item.doneAt ?? item.createdAt ?? 0) <= weekEnd,
    ).length;
    return {
      label: new Date(weekEnd).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      }),
      sisa: Math.max(0, created - finished),
    };
  });

  const renderItem = (
    item: (typeof all)[number],
    sortable?: {
      handle: ReactNode;
      ref: (node: HTMLLIElement | null) => void;
      style: CSSProperties;
    },
  ) => (
    <motion.li
      layout={!sortable && !reducedMotion ? "position" : false}
      initial={reducedMotion || sortable ? false : { opacity: 0 }}
      animate={{ opacity: sortable?.style.opacity ?? 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion || sortable ? 0 : 0.2 }}
      key={item._id}
      ref={sortable?.ref}
      style={sortable?.style}
      className="clay flex flex-wrap items-center gap-2 p-3 sm:gap-3"
    >
      {sortable?.handle}
      <button
        type="button"
        aria-label={item.done ? "Tandai belum selesai" : "Tandai selesai"}
        aria-pressed={item.done}
        data-celebrate={!item.done ? "true" : undefined}
        onClick={() => {
          toggleItem({ itemId: item._id, done: !item.done });
          if (!item.done) bloom();
        }}
        className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-colors ${
          item.done
            ? "bg-primary text-primary-foreground"
            : "clay-inset text-muted-foreground hover:text-primary"
        }`}
      >
        <Check className="size-3.5" />
      </button>
      <span
        className={`min-w-[8rem] flex-1 break-words text-sm leading-relaxed ${
          item.done ? "text-muted-foreground line-through" : ""
        }`}
      >
        {item.label}
      </span>
      {!item.done && (
        <button
          type="button"
          title="Ubah prioritas tugas"
          onClick={() =>
            setPriority({
              itemId: item._id,
              priority: nextPriority(item.priority),
            })
          }
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider transition-transform active:scale-95 ${
            PRIORITY_BADGE[normalizePriority(item.priority)]
          }`}
        >
          {PRIORITY_LABEL[normalizePriority(item.priority)]}
        </button>
      )}
      {item.pic && (
        <span className="chip shrink-0 bg-tint-sky text-tint-sky-foreground">
          <UserRound className="size-3" /> {item.pic}
        </span>
      )}
      {item.dueDate && !item.done && (
        <DueChip dueDate={item.dueDate} />
      )}
      <RowMenu
        onEdit={() =>
          setEditing({
            id: item._id,
            label: item.label,
            due: item.dueDate ? toDateInputValue(item.dueDate) : "",
            pic: item.pic ?? "",
          })
        }
        onDelete={() => deleteItem(item)}
        deleteTitle={`Hapus tugas ini?`}
        deleteDescription={item.label}
      />
    </motion.li>
  );

  /** Pulihkan satu tugas yang dihapus, termasuk status selesainya. */
  const restoreItem = async (item: (typeof all)[number]) => {
    const id = await createItem({
      label: item.label,
      dueDate: item.dueDate,
      priority: item.priority,
      pic: item.pic,
    });
    if (item.done) await toggleItem({ itemId: id, done: true });
  };

  const deleteItem = (item: (typeof all)[number]) => {
    void removeItem({ itemId: item._id });
    undoableDelete(`Tugas "${item.label}" dihapus.`, () => restoreItem(item));
  };

  const submit = async () => {
    if (!label.trim()) return;
    setAdding(true);
    try {
      await createItem({
        label,
        dueDate: newDue ? fromDateInputValue(newDue) : undefined,
      });
      bloom();
      setLabel("");
      setNewDue("");
    } catch {
      toast.error("Gagal menambah tugas.");
    } finally {
      setAdding(false);
    }
  };

  const submitBulk = async () => {
    const labels = bulkText
      .split("\n")
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);
    if (labels.length === 0) {
      toast.error("Belum ada tugas yang diisi.");
      return;
    }
    setBulkBusy(true);
    try {
      const count = await createMany({ labels });
      bloom();
      toast.success(`${count} tugas ditambahkan.`);
      setBulkText("");
      setBulkOpen(false);
    } catch {
      toast.error("Gagal menambah tugas.");
    } finally {
      setBulkBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setEditingBusy(true);
    try {
      await updateItem({
        itemId: editing.id,
        label: editing.label,
        dueDate: editing.due ? fromDateInputValue(editing.due) : null,
        pic: editing.pic,
      });
      setEditing(null);
      toast.success("Tugas diperbarui.");
    } catch {
      toast.error("Gagal menyimpan tugas.");
    } finally {
      setEditingBusy(false);
    }
  };

  if (items === undefined) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <section className="clay space-y-4 p-4 sm:p-5" aria-label="Kalender tenggat checklist">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label text-muted-foreground">Jadwal checklist</p>
            <p className="mt-1 font-serif text-xl font-semibold capitalize">{calendarHeading}</p>
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-secondary p-1" aria-label="Tampilan kalender">
            {CALENDAR_VIEWS.map(({ key: view, label: viewLabel }) => (
              <button
                key={view}
                type="button"
                aria-pressed={calendarView === view}
                onClick={() => setCalendarView(view)}
                className={`min-h-10 rounded-lg px-3 text-xs font-bold capitalize transition-colors ${
                  calendarView === view
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {viewLabel}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-10 rounded-xl" aria-label="Periode sebelumnya" onClick={() => moveCalendar(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" className="h-10 rounded-xl px-3 text-xs" onClick={() => {
              const today = new Date();
              setCalendarDate(today);
              setSelectedDay(dayKey(today));
            }}>Hari ini</Button>
            <Button variant="outline" size="icon" className="size-10 rounded-xl" aria-label="Periode berikutnya" onClick={() => moveCalendar(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            Filter bulan
            <Input
              type="month"
              aria-label="Pilih bulan checklist"
              className="h-10 w-40 rounded-xl"
              value={`${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}`}
              onChange={(event) => {
                if (!event.target.value) return;
                const [year, month] = event.target.value.split("-").map(Number);
                const next = new Date(year, month - 1, 1);
                setCalendarDate(next);
                setSelectedDay(dayKey(next));
              }}
            />
          </label>
        </div>
        {calendarView !== "hari" && (
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className="py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{weekday}</span>
            ))}
          </div>
        )}
        <div className={`grid gap-1 ${calendarView === "hari" ? "grid-cols-1" : "grid-cols-7"}`}>
          {calendarDays.map((date) => {
            const key = dayKey(date);
            const dayTasks = all
              .filter((item) => item.dueDate && dayKey(new Date(item.dueDate)) === key)
              .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));
            const inMonth = date.getMonth() === calendarDate.getMonth();
            const isSelected = selectedDay === key;
            const isToday = dayKey(new Date()) === key;
            return (
              <button
                key={key}
                type="button"
                aria-label={`${date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}, ${dayTasks.length} tugas`}
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedDay(key);
                  setCalendarDate(date);
                }}
                className={`min-h-16 rounded-xl border p-1.5 text-left transition-colors sm:min-h-24 sm:p-2 ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                    : "border-transparent bg-background/60 hover:border-border hover:bg-secondary/70"
                } ${calendarView === "bulan" && !inMonth ? "opacity-45" : ""}`}
              >
                <span className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${isToday ? "bg-primary text-primary-foreground" : ""}`}>
                  {date.getDate()}
                </span>
                {dayTasks.length > 0 && (
                  <span className="mt-1 block space-y-0.5">
                    {dayTasks.slice(0, calendarView === "bulan" ? 1 : 3).map((task) => (
                      <span key={task._id} className={`block truncate rounded-md px-1 py-0.5 text-[9px] font-semibold sm:text-[10px] ${task.done ? "bg-tint-sage/60 text-muted-foreground line-through" : "bg-tint-butter text-tint-butter-foreground"}`}>
                        {task.label}
                      </span>
                    ))}
                    {dayTasks.length > (calendarView === "bulan" ? 1 : 3) && (
                      <span className="block px-1 text-[9px] font-bold text-muted-foreground">+{dayTasks.length - (calendarView === "bulan" ? 1 : 3)} tugas</span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="rounded-2xl bg-secondary/60 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="label capitalize">Tenggat {new Date(`${selectedDay}T12:00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</p>
            <span className="chip bg-background text-muted-foreground">{selectedDayTasks.length} tugas</span>
          </div>
          {selectedDayTasks.length ? (
            <ul className="space-y-1.5">
              {selectedDayTasks.map((task) => (
                <li key={task._id} className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    aria-label={task.done ? "Tandai belum selesai" : "Tandai selesai"}
                    aria-pressed={Boolean(task.done)}
                    onClick={() => void toggleItem({ itemId: task._id, done: !task.done })}
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full ${task.done ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}
                  ><Check className="size-3" /></button>
                  <span className={`min-w-0 flex-1 truncate ${task.done ? "text-muted-foreground line-through" : ""}`}>{task.label}</span>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">{PRIORITY_LABEL[normalizePriority(task.priority)]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Belum ada tugas dengan tenggat pada tanggal ini.</p>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{monthTasks.length} tugas bertenggat pada {monthLabel} · daftar di bawah mengikuti tenggat terdekat</p>
      </section>

      <section className="clay p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="label text-muted-foreground">Progres tugas</p>
            <p className="meta mt-1">
              {open.length} tugas menunggu · {done.length} selesai
            </p>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-tint-sage text-xl text-tint-sage-foreground shadow-sm">
            📝
          </div>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-mist-gray">
          <div
            className="fill-botanical h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="num meta mt-1.5">{pct}% selesai</p>
      </section>

      {priorityBarData.length > 0 && (
        <ChartCard title="Progres per prioritas" meta="Klik batang untuk filter">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priorityBarData}
                layout="vertical"
                margin={{ top: 4, right: 8, bottom: 0, left: 4 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="var(--color-fog)"
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={58}
                />
                <Tooltip content={<ChartTip />} cursor={{ fill: "var(--color-mist-gray)" }} />
                <Bar
                  dataKey="selesai"
                  name="Selesai"
                  stackId="progres"
                  fill="var(--chart-1)"
                  barSize={16}
                >
                  {priorityBarData.map((row) => (
                    <Cell
                      key={row.key}
                      className="cursor-pointer"
                      onClick={() =>
                        setPriorityFilter((previous) =>
                          previous === row.key ? null : row.key,
                        )
                      }
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="sisa"
                  name="Sisa"
                  stackId="progres"
                  fill="var(--color-mist-gray)"
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                >
                  {priorityBarData.map((row) => (
                    <Cell
                      key={row.key}
                      className="cursor-pointer"
                      onClick={() =>
                        setPriorityFilter((previous) =>
                          previous === row.key ? null : row.key,
                        )
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-chart-1" /> Selesai
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-mist-gray" /> Sisa
            </span>
          </div>
        </ChartCard>
      )}

      {burndownData.length > 1 && (
        <ChartCard title="Burndown tugas" meta={`${burndownData.length} pekan`}>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={burndownData}
                margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-fog)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTip />} />
                <Line
                  type="monotone"
                  dataKey="sisa"
                  name="Sisa tugas"
                  stroke={CHART_COLORS[1]}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: CHART_COLORS[1] }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <section className="clay space-y-3 p-4">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Tambah tugas, tekan Enter"
          />
          <Input
            type="date"
            value={newDue}
            onChange={(event) => setNewDue(event.target.value)}
            aria-label="Tenggat tugas (opsional)"
            className="w-40 shrink-0"
          />
          <Button type="submit" size="icon" className="rounded-xl" disabled={adding || !label.trim()}>
            {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            className="chip bg-tint-butter text-tint-butter-foreground"
          >
            <Sparkles className="size-3.5" /> Tempel banyak tugas
          </button>
          {done.length > 0 && showDone && (
            <button
              type="button"
              onClick={() => {
                // Tanpa dialog konfirmasi: kekeliruan bisa dibatalkan
                // langsung dari tombol "Urungkan" pada toast.
                const removed = done;
                void clearDone();
                undoableDelete(
                  `${removed.length} tugas selesai dibersihkan.`,
                  async () => {
                    for (const item of removed) await restoreItem(item);
                  },
                  { successMessage: "Tugas selesai dipulihkan." },
                );
              }}
              className="chip bg-tint-sage text-tint-sage-foreground"
            >
              <Trash2 className="size-3.5" /> Bersihkan selesai
            </button>
          )}
        </div>
      </section>

      <section className="space-y-3" aria-label={`Daftar tugas bulan ${listMonthLabel}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div>
            <p className="label text-muted-foreground">Daftar tenggat</p>
            <p className="text-sm font-semibold capitalize">{listMonthLabel} · {all.filter((item) => item.dueDate && new Date(item.dueDate) >= listMonthStart && new Date(item.dueDate) < listMonthEnd).length} tugas terjadwal</p>
          </div>
          {undatedTasks.length > 0 && (
            <span className="chip bg-secondary text-secondary-foreground">{undatedTasks.length} tanpa tenggat</span>
          )}
        </div>
        <div className="clay-inset flex gap-1.5 p-1.5">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              className={`chip flex-1 justify-center ${
                filter === option.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {priorityFilter && (
          <button
            type="button"
            onClick={() => setPriorityFilter(null)}
            className="chip self-start bg-tint-butter text-tint-butter-foreground"
          >
            Prioritas: {PRIORITY_LABEL[priorityFilter]} <X className="size-3" />
          </button>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari tugas…"
            aria-label="Cari tugas persiapan"
            className="pl-9"
          />
        </div>

        <Stagger className="space-y-4">
          {(filter === "semua" || filter === "belum") && visibleOpen.length > 0 && (
            <StaggerItem key="open-tasks">
              <section className="space-y-2">
                <p className="label px-1 text-muted-foreground">
                  Belum · {visibleOpen.length}
                  {dragEnabled && (
                    <span className="ml-2 font-normal normal-case opacity-70">
                      (tahan untuk geser)
                    </span>
                  )}
                </p>
                <ul className="space-y-2">
                  {dragEnabled ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={visibleOpen.map((item) => item._id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {visibleOpen.map((item) => (
                          <SortableTask key={item._id} id={item._id}>
                            {(handle, ref, style) =>
                              renderItem(item, { handle, ref, style })
                            }
                          </SortableTask>
                        ))}
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <AnimatePresence>{visibleOpen.map((item) => renderItem(item))}</AnimatePresence>
                  )}
                </ul>
              </section>
            </StaggerItem>
          )}

          {(filter === "semua" || filter === "selesai") && visibleDone.length > 0 && showDone && (
            <StaggerItem key="done-tasks">
              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="label text-muted-foreground">Selesai · {visibleDone.length}</p>
                  {filter === "semua" && (
                    <button
                      type="button"
                      onClick={() => setShowDone(false)}
                      className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
                    >
                      Sembunyikan
                    </button>
                  )}
                </div>
                <ul className="space-y-2">
                  <AnimatePresence>{visibleDone.map((item) => renderItem(item))}</AnimatePresence>
                </ul>
              </section>
            </StaggerItem>
          )}
        </Stagger>

        {filter === "semua" && done.length > 0 && !showDone && (
          <button
            type="button"
            onClick={() => setShowDone(true)}
            className="text-[11px] font-bold text-muted-foreground"
          >
            Tampilkan {done.length} yang selesai
          </button>
        )}

        {visibleUndated.length > 0 && (
          <section className="space-y-2" aria-label="Tugas tanpa tenggat">
            <p className="label px-1 text-muted-foreground">Belum dijadwalkan · {visibleUndated.length}</p>
            <ul className="space-y-2">
              <AnimatePresence>
                {visibleUndated.map((item) => renderItem(item))}
              </AnimatePresence>
            </ul>
          </section>
        )}

        {visible.length === 0 && items !== undefined && (
          <EmptyState
            emoji={filtered ? "🔍" : "📝"}
            title={
              filtered
                ? "Tidak ada tugas yang cocok"
                : all.length > 0
                  ? `Tidak ada tugas pada ${listMonthLabel}`
                  : "Belum ada tugas"
            }
            description={
              filtered
                ? "Coba kata kunci lain atau ganti filter."
                : all.length > 0
                  ? "Pilih bulan lain di kalender atau lihat tugas tanpa tenggat di bagian ini."
                  : "Tuliskan satu per satu, atau tempel daftar tugas sekaligus."
            }
            actionLabel={filtered ? undefined : "Tempel banyak tugas"}
            onAction={filtered ? undefined : () => setBulkOpen(true)}
          />
        )}
      </section>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tempel banyak tugas</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="bulk">Satu tugas per baris</Label>
            <Textarea
              id="bulk"
              rows={6}
              value={bulkText}
              onChange={(event) => setBulkText(event.target.value)}
              placeholder={"Booking MUA\nSurvey gaun\nAtur transportasi"}
            />
          </div>
          <DialogFooter>
            <Button onClick={submitBulk} disabled={bulkBusy} className="w-full rounded-2xl">
              {bulkBusy ? <Loader2 className="size-4 animate-spin" /> : "Tambah semua"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ubah tugas</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="edit-label">Tugas</Label>
            <Input
              id="edit-label"
              value={editing?.label ?? ""}
              onChange={(event) =>
                setEditing((previous) =>
                  previous ? { ...previous, label: event.target.value } : previous,
                )
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-due">Tenggat (opsional)</Label>
            <Input
              id="edit-due"
              type="date"
              value={editing?.due ?? ""}
              onChange={(event) =>
                setEditing((previous) =>
                  previous ? { ...previous, due: event.target.value } : previous,
                )
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-pic">Penanggung jawab (opsional)</Label>
            <Input
              id="edit-pic"
              value={editing?.pic ?? ""}
              onChange={(event) =>
                setEditing((previous) =>
                  previous ? { ...previous, pic: event.target.value } : previous,
                )
              }
              placeholder="cth. Rina, WO, keluarga"
            />
          </div>
          <DialogFooter>
            <Button onClick={saveEdit} disabled={editingBusy} className="w-full rounded-2xl">
              {editingBusy ? <Loader2 className="size-4 animate-spin" /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
