import { ChartTip } from "@/components/Charts";
import {
  DateInputID,
  EmptyState,
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { bloom } from "@/lib/bloom";
import { formatDateID, fromDateInputValue, toDateInputValue } from "@/lib/format";
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
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

type Filter = "semua" | "belum" | "selesai";
type ScheduleView = "fase" | "kalender";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Fase mundur dari hari-H, diturunkan dari tenggat masing-masing tugas. */
const PHASES: { key: string; label: string }[] = [
  { key: "m4", label: "4 bulan lagi" },
  { key: "m3", label: "3 bulan lagi" },
  { key: "m2", label: "2 bulan lagi" },
  { key: "m1", label: "1 bulan lagi" },
  { key: "h7", label: "Minggu terakhir" },
  { key: "tanpa", label: "Tanpa tenggat" },
];

function phaseKeyFor(dueDate: number | undefined, today: number): string {
  if (!dueDate) return "tanpa";
  const days = Math.ceil((dueDate - today) / DAY_MS);
  if (days <= 7) return "h7";
  if (days <= 31) return "m1";
  if (days <= 61) return "m2";
  if (days <= 92) return "m3";
  return "m4";
}

/** “H-12”, “Hari ini”, atau “Terlambat 3 hari”. */
function dueLabel(dueDate: number, today: number): string {
  const days = Math.ceil((dueDate - today) / DAY_MS);
  if (days < 0) return `Terlambat ${Math.abs(days)} hari`;
  if (days === 0) return "Hari ini";
  if (days === 1) return "Besok";
  return `H-${days}`;
}

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
  const [scheduleView, setScheduleView] = useState<ScheduleView>("fase");

  const all = items ?? [];
  const open = all.filter((item) => !item.done);
  const done = all.filter((item) => item.done);
  const pct = all.length > 0 ? Math.round((done.length / all.length) * 100) : 0;
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const overdueCount = open.filter(
    (item) => item.dueDate !== undefined && item.dueDate < todayStart,
  ).length;

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

  // Tampilan fase mengabaikan batas bulan: seluruh tugas dikelompokkan mundur
  // dari hari-H, tetap mengikuti filter status, prioritas, dan pencarian.
  const phaseTasks = all
    .filter((item) => {
      if (filter === "belum" && item.done) return false;
      if (filter === "selesai" && !item.done) return false;
      if (priorityFilter && normalizePriority(item.priority) !== priorityFilter)
        return false;
      return matches(item.label);
    })
    .sort(
      (a, b) =>
        (a.dueDate ?? Number.POSITIVE_INFINITY) -
          (b.dueDate ?? Number.POSITIVE_INFINITY) ||
        a.sortOrder - b.sortOrder,
    );
  const phaseGroups = PHASES.map((phase) => {
    const rows = phaseTasks.filter(
      (item) => phaseKeyFor(item.dueDate, todayStart) === phase.key,
    );
    return {
      ...phase,
      items: rows,
      total: rows.length,
      done: rows.filter((item) => item.done).length,
    };
  });
  const phaseCount = phaseGroups.reduce((sum, group) => sum + group.total, 0);

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
      className="sj-ledger-row interactive-row flex min-h-[3.5rem] flex-wrap items-center gap-x-3 gap-y-1 px-1 py-2"
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
        className={`flex size-11 shrink-0 items-center justify-center transition-transform active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
          item.done ? "text-[var(--brand)]" : "text-[var(--ink-soft)]"
        }`}
      >
        <span
          aria-hidden="true"
          className="grid size-5 place-items-center rounded-[6px] border border-[var(--line)] bg-[var(--paper)]"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3.5"
          >
            <path
              d="M4 12.5 9.5 18 20 6"
              style={{
                strokeDasharray: 26,
                strokeDashoffset: item.done ? 0 : 26,
                transition: reducedMotion
                  ? "none"
                  : "stroke-dashoffset 320ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </svg>
        </span>
      </button>
      <span
        className={`min-w-[8rem] flex-1 break-words text-[0.9375rem] leading-relaxed ${
          item.done ? "text-[var(--ink-soft)] line-through decoration-[var(--line)]" : "text-[var(--ink)]"
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
          className="shrink-0 border-b border-dotted border-current px-1 py-1 text-[0.8125rem] text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
        >
          {PRIORITY_LABEL[normalizePriority(item.priority)]}
        </button>
      )}
      {item.pic && (
        <span className="flex shrink-0 items-center gap-1 text-[0.8125rem] text-[var(--ink-soft)]">
          <UserRound className="size-3" /> {item.pic}
        </span>
      )}
      {item.dueDate && (
        <span className="flex shrink-0 flex-col items-end text-[0.8125rem] leading-tight">
          <span className="num text-[var(--ink-soft)]">{formatDateID(item.dueDate)}</span>
          <span
            className={`num ${
              item.done
                ? "text-[var(--ink-soft)]"
                : item.dueDate < todayStart
                  ? "text-[var(--danger)]"
                  : "text-[var(--warning)]"
            }`}
          >
            {dueLabel(item.dueDate, todayStart)}
          </span>
        </span>
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

  /** Bersihkan tugas selesai, tetap bisa diurungkan dari toast. */
  const clearCompleted = () => {
    if (done.length === 0) return;
    const removed = done;
    void clearDone();
    undoableDelete(
      `${removed.length} tugas selesai dibersihkan.`,
      async () => {
        for (const item of removed) await restoreItem(item);
      },
      { successMessage: "Tugas selesai dipulihkan." },
    );
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
    <div className="sj-document-page sj-checklist-page space-y-4">
      <PageHeading
        kicker="Persiapan menuju hari-H"
        title="Checklist"
        summary={
          all.length === 0 ? (
            "Belum ada tugas. Mulai dari satu langkah kecil yang paling dekat."
          ) : (
            <>
              <strong className="num font-semibold text-[var(--ink)]">{open.length} tugas lagi</strong>{" "}
              dari {all.length}; {done.length} sudah selesai
              {overdueCount > 0 && (
                <>
                  ,{" "}
                  <strong className="num font-semibold text-[var(--danger)]">
                    {overdueCount} lewat tenggat
                  </strong>
                </>
              )}
              .
            </>
          )
        }
        action={
          <>
            <button
              type="button"
              onClick={() => document.getElementById("new-task-label")?.focus()}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3.5 text-sm font-medium text-[var(--ink)] transition-transform duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            >
              <Plus className="size-4" /> Tambah tugas
            </button>
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--line)] px-3.5 text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            >
              <Sparkles className="size-4" /> Tempel banyak
            </button>
            {done.length > 0 && (
              <button
                type="button"
                onClick={() => clearCompleted()}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--line)] px-3.5 text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
              >
                <Trash2 className="size-4" /> Bersihkan selesai
              </button>
            )}
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Tampilan checklist"
          value={scheduleView}
          onChange={setScheduleView}
          options={[
            { value: "fase", label: "Fase" },
            { value: "kalender", label: "Kalender" },
          ]}
          className="max-w-[15rem]"
        />
        <p className="text-[0.8125rem] text-[var(--ink-soft)]">
          {scheduleView === "fase"
            ? "Dikelompokkan mundur dari hari-H."
            : "Pilih tanggal untuk melihat tenggatnya."}
        </p>
      </div>

      {scheduleView === "kalender" && (
      <section className="sj-paper-sheet space-y-4 p-4 sm:p-5" aria-label="Kalender tenggat checklist">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.8125rem] text-[var(--ink-soft)]">Jadwal checklist</p>
            <p className="mt-1 display-serif text-xl capitalize text-[var(--ink)]">{calendarHeading}</p>
          </div>
          <Segmented
            label="Tampilan kalender"
            value={calendarView}
            onChange={setCalendarView}
            options={CALENDAR_VIEWS.map(({ key, label }) => ({ value: key, label }))}
            className="max-w-[13rem]"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-11 rounded-lg" aria-label="Periode sebelumnya" onClick={() => moveCalendar(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" className="h-11 rounded-lg px-3 text-[0.8125rem]" onClick={() => {
              const today = new Date();
              setCalendarDate(today);
              setSelectedDay(dayKey(today));
            }}>Hari ini</Button>
            <Button variant="outline" size="icon" className="size-11 rounded-lg" aria-label="Periode berikutnya" onClick={() => moveCalendar(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <label className="flex items-center gap-2 text-[0.8125rem] font-medium text-[var(--ink-soft)]">
            Filter bulan
            <Input
              type="month"
              aria-label="Pilih bulan checklist"
              className="h-11 w-40 rounded-lg"
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
              <span key={weekday} className="py-1 text-[0.8125rem] font-medium text-[var(--ink-soft)]">{weekday}</span>
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
                className={`min-h-16 rounded-lg border p-1.5 text-left transition-colors sm:min-h-24 sm:p-2 ${
                  isSelected
                    ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_8%,transparent)]"
                    : "border-[var(--line)] bg-[color-mix(in_srgb,var(--paper)_55%,transparent)] hover:border-[var(--ink-soft)]"
                } ${calendarView === "bulan" && !inMonth ? "opacity-45" : ""}`}
              >
                <span className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${isToday ? "bg-[var(--brand)] text-[var(--paper)]" : "text-[var(--ink)]"}`}>
                  {date.getDate()}
                </span>
                {dayTasks.length > 0 && (
                  <span className="mt-1 block space-y-0.5">
                    {dayTasks.slice(0, calendarView === "bulan" ? 1 : 3).map((task) => (
                      <span key={task._id} className={`block truncate rounded px-1 py-0.5 text-[0.75rem] leading-tight ${task.done ? "text-[var(--ink-soft)] line-through" : "text-[var(--ink)]"}`}>
                        {task.label}
                      </span>
                    ))}
                    {dayTasks.length > (calendarView === "bulan" ? 1 : 3) && (
                      <span className="block px-1 text-[0.75rem] text-[var(--ink-soft)]">+{dayTasks.length - (calendarView === "bulan" ? 1 : 3)} tugas</span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="surface-sunk p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="display-serif text-base capitalize text-[var(--ink)]">
              Tenggat {new Date(`${selectedDay}T12:00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <span className="num shrink-0 text-[0.8125rem] text-[var(--ink-soft)]">{selectedDayTasks.length} tugas</span>
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
                    className={`flex size-9 shrink-0 items-center justify-center rounded-[6px] border border-[var(--line)] ${task.done ? "bg-[var(--brand)] text-[var(--paper)]" : "text-[var(--ink-soft)]"}`}
                  ><Check className="size-3" /></button>
                  <span className={`min-w-0 flex-1 truncate text-sm ${task.done ? "text-[var(--ink-soft)] line-through" : "text-[var(--ink)]"}`}>{task.label}</span>
                  <span className="shrink-0 text-[0.8125rem] text-[var(--ink-soft)]">{PRIORITY_LABEL[normalizePriority(task.priority)]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Belum ada tugas dengan tenggat pada tanggal ini.</p>
          )}
        </div>
        <p className="text-sm text-[var(--ink-soft)]">
          {monthTasks.length} tugas bertenggat pada {monthLabel}. Daftar di bawah mengikuti tenggat terdekat.
        </p>
      </section>
      )}

      <section className="sj-paper-sheet p-4 sm:p-5" aria-label="Progres persiapan">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="display-serif max-w-[38ch] text-[1.375rem] leading-snug text-[var(--ink)] sm:text-2xl">
            {open.length > 0
              ? `${open.length} tugas lagi menunggu, ${done.length} sudah selesai.`
              : done.length > 0
                ? `Semua ${done.length} tugas sudah selesai.`
                : "Belum ada tugas. Mulai dari yang paling dekat tenggatnya."}
          </p>
          <p className="shrink-0 text-[var(--ink)]">
            <span className="figure-xl">{pct}</span>
            <span className="ml-0.5 text-base font-medium text-[var(--ink-soft)]">%</span>
          </p>
        </div>
        <StackBar
          className="mt-4"
          label={`${pct}% tugas selesai dari ${all.length} tugas`}
          segments={[
            { label: "Selesai", value: done.length, tone: "brand", title: `${done.length} selesai` },
            { label: "Belum", value: open.length, tone: "sunk", title: `${open.length} belum selesai` },
          ]}
        />
        <div className="mt-2 flex items-center justify-between text-[0.8125rem] text-[var(--ink-soft)]">
          <span className="num">{done.length} selesai</span>
          <span className="num">{open.length} lagi</span>
        </div>
        {priorityBarData.length > 0 && (
          <div className="mt-4 divide-y divide-[var(--line)] border-t border-[var(--line)]" role="group" aria-label="Saring menurut prioritas">
            {priorityBarData.map((row) => {
              const active = priorityFilter === row.key;
              const jumlah = row.selesai + row.sisa;
              return (
                <button
                  key={row.key}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Prioritas ${row.name}: ${row.sisa} dari ${jumlah} tugas belum selesai`}
                  onClick={() => setPriorityFilter(active ? null : row.key)}
                  className={`interactive-row flex min-h-11 w-full items-center gap-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
                    active ? "text-[var(--brand)]" : "text-[var(--ink)]"
                  }`}
                >
                  <span className="w-14 shrink-0 text-sm font-medium">{row.name}</span>
                  <span className="min-w-0 flex-1">
                    <StackBar
                      className="h-1.5"
                      label={`${row.name}: ${row.selesai} selesai dari ${jumlah}`}
                      segments={[
                        { label: "Selesai", value: row.selesai, tone: "brand" },
                        { label: "Sisa", value: row.sisa, tone: "sunk" },
                      ]}
                    />
                  </span>
                  <span className="num shrink-0 text-[0.8125rem] text-[var(--ink-soft)]">
                    {row.sisa}/{jumlah}
                  </span>
                  <Check
                    className={`size-3.5 shrink-0 ${active ? "opacity-100" : "opacity-0"}`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        )}
      </section>

      {burndownData.length > 2 && (
        <section className="sj-paper-sheet p-4 sm:p-5" aria-label="Burndown tugas">
          <div className="flex items-end justify-between gap-3 border-b border-[var(--line)] pb-3">
            <div>
              <h2 className="display-serif text-xl text-[var(--ink)]">Burndown tugas</h2>
              <p className="mt-0.5 text-[0.8125rem] text-[var(--ink-soft)]">
                Sisa tugas terbuka di akhir setiap pekan.
              </p>
            </div>
            <span className="num shrink-0 text-[0.8125rem] text-[var(--ink-soft)]">
              {burndownData.length} pekan
            </span>
          </div>
          <div className="mt-3 h-40">
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
                  stroke="var(--brand)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--brand)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="sj-paper-sheet space-y-2 p-3 sm:p-4">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Input
            id="new-task-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Tambah tugas, tekan Enter"
            className="min-h-11 flex-1"
          />
          <DateInputID
            id="new-task-due"
            value={newDue}
            onChange={setNewDue}
            ariaLabel="Tenggat tugas (format hari/bulan/tahun, opsional)"
            className="min-h-11 sm:w-44"
          />
          <Button
            type="submit"
            className="min-h-11 rounded-lg px-4"
            disabled={adding || !label.trim()}
          >
            {adding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Plus className="size-4" /> Tambah
              </>
            )}
          </Button>
        </form>
        <p className="text-[0.8125rem] text-[var(--ink-soft)]">
          Tekan Enter untuk menambah. Tanggal ditulis hari/bulan/tahun, boleh dikosongkan.
        </p>
      </section>

      <section className="space-y-3 pb-20 lg:pb-0" aria-label="Daftar tugas">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            label="Saring tugas"
            value={filter}
            onChange={setFilter}
            options={FILTERS.map((option) => ({
              value: option.key,
              label: option.label,
            }))}
            className="w-full max-w-[17rem]"
          />
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-soft)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari tugas"
              aria-label="Cari tugas persiapan"
              className="min-h-11 pl-9"
            />
          </div>
        </div>

        {priorityFilter && (
          <button
            type="button"
            onClick={() => setPriorityFilter(null)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 text-sm text-[var(--ink)]"
          >
            Prioritas: {PRIORITY_LABEL[priorityFilter]} <X className="size-3.5" />
          </button>
        )}

        {scheduleView === "fase" ? (
          <div className="space-y-5">
            {phaseCount === 0 ? (
              <EmptyState
                emoji={filtered ? "🔍" : "📝"}
                title={filtered ? "Tidak ada tugas yang cocok" : "Belum ada tugas"}
                description={
                  filtered
                    ? "Coba kata kunci lain atau ganti filter."
                    : "Tuliskan satu per satu, atau tempel daftar tugas sekaligus."
                }
                actionLabel={filtered ? undefined : "Tempel banyak tugas"}
                onAction={filtered ? undefined : () => setBulkOpen(true)}
              />
            ) : (
              phaseGroups.map((group) =>
                group.total === 0 ? null : (
                  <section key={group.key} aria-label={`Fase ${group.label}`}>
                    <div className="sticky top-0 z-10 flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--paper)_94%,transparent)] px-3 py-2 backdrop-blur-sm">
                      <p className="display-serif text-lg leading-none text-[var(--ink)]">
                        {group.label}
                      </p>
                      <span className="num ml-auto shrink-0 text-[0.8125rem] text-[var(--ink-soft)]">
                        {group.done}/{group.total}
                      </span>
                      <StackBar
                        className="h-1.5 w-16 shrink-0"
                        label={`${group.label}: ${group.done} dari ${group.total} selesai`}
                        segments={[
                          { label: "Selesai", value: group.done, tone: "brand" },
                          { label: "Sisa", value: group.total - group.done, tone: "sunk" },
                        ]}
                      />
                    </div>
                    <ul className="space-y-0.5 pt-1">
                      <AnimatePresence>
                        {group.items.map((item) => renderItem(item))}
                      </AnimatePresence>
                    </ul>
                  </section>
                ),
              )
            )}
            {done.length > 0 && filter === "belum" && (
              <p className="text-[0.8125rem] text-[var(--ink-soft)]">
                {done.length} tugas selesai disembunyikan oleh filter.
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="text-[0.8125rem] text-[var(--ink-soft)]">
              <span className="capitalize">{listMonthLabel}</span>{" "}
              {all.filter((item) => item.dueDate && new Date(item.dueDate) >= listMonthStart && new Date(item.dueDate) < listMonthEnd).length}{" "}
              tugas terjadwal
              {undatedTasks.length > 0 &&
                `, ${undatedTasks.length} tanpa tenggat`}
              . Daftar mengikuti tenggat terdekat.
            </p>

        <Stagger className="space-y-4">
          {(filter === "semua" || filter === "belum") && visibleOpen.length > 0 && (
            <StaggerItem key="open-tasks">
              <section className="space-y-2">
                <p className="display-serif px-1 text-lg text-[var(--ink)]">
                  Belum, {visibleOpen.length} tugas
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
                  <p className="display-serif text-lg text-[var(--ink)]">Selesai, {visibleDone.length} tugas</p>
                  {filter === "semua" && (
                    <button
                      type="button"
                      onClick={() => setShowDone(false)}
                      className="text-[0.8125rem] font-medium text-[var(--ink-soft)] hover:text-[var(--ink)]"
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
            className="text-[0.8125rem] font-medium text-[var(--ink-soft)] underline underline-offset-4 hover:text-[var(--ink)]"
          >
            Tampilkan {done.length} yang selesai
          </button>
        )}

        {visibleUndated.length > 0 && (
          <section className="space-y-2" aria-label="Tugas tanpa tenggat">
            <p className="display-serif px-1 text-lg text-[var(--ink)]">
              Belum dijadwalkan, {visibleUndated.length} tugas
            </p>
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
          </>
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
            <DateInputID
              id="edit-due"
              value={editing?.due ?? ""}
              onChange={(due) => setEditing((previous) => previous ? { ...previous, due } : previous)}
              ariaLabel="Tenggat tugas, format hari/bulan/tahun"
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
