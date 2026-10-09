import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Heart } from "lucide-react";
import { useMemo } from "react";
import { countdownLabel, formatDateID } from "@/lib/format";

type WorkspaceStatus = {
  isAnonymous: boolean;
  email: string | null;
  connectedEmail: string | null;
  inviteCode: string | null;
};

/**
 * Bell notifikasi — dipakai baik di SideNav (pengganti header) maupun
 * BottomNav-lain bila diperlukan. Seluruh konten popover tetap sama
 * seperti versi lama di header.
 */
export function NotificationBell({
  wedding,
  openTasks,
  workspace,
  savingsNote,
  reminders,
  align = "end",
}: {
  wedding:
    | (Partial<{ weddingDate: number; venueName: string; partnerOneName: string; partnerTwoName: string }>
      & { weddingDate: number })
    | null
    | undefined;
  openTasks: number;
  workspace: WorkspaceStatus | null | undefined;
  savingsNote: string | null;
  reminders: {
    id: string;
    label: string;
    dueDate: number;
    overdue: boolean;
    daysLeft: number;
  }[];
  align?: "start" | "center" | "end";
}) {
  const notes = useMemo(() => {
    const list: { id: string; label: string; tone?: "mint" | "amber" }[] = [];

    // Pengingat tenggat — yang terlambat didahulukan.
    for (const reminder of [...reminders]
      .sort(
        (a, b) =>
          Number(b.overdue) - Number(a.overdue) || a.dueDate - b.dueDate,
      )
      .slice(0, 5)) {
      list.push({
        id: `due-${reminder.id}`,
        tone: reminder.overdue ? "amber" : "mint",
        label: reminder.overdue
          ? `Terlambat: ${reminder.label} (tenggat lewat ${Math.abs(reminder.daysLeft)} hari)`
          : reminder.daysLeft === 0
            ? `Hari ini: ${reminder.label}`
            : `${reminder.label} — ${reminder.daysLeft} hari lagi`,
      });
    }

    // Sync status first — ini yang membuat bell mencerminkan keadaan
    // workspace bersama secara realtime di kedua perangkat.
    if (workspace) {
      if (workspace.connectedEmail) {
        list.push({
          id: "sync",
          tone: "mint",
          label: `Tersinkron dengan ${workspace.connectedEmail} — setiap perubahan langsung tersaji di kedua perangkat.`,
        });
      } else if (workspace.isAnonymous) {
        list.push({
          id: "sync",
          tone: "amber",
          label:
            "Ruang kerja masih lokal — masuk dengan email melalui Pengaturan agar data tersimpan dan dapat dibagikan.",
        });
      } else if (workspace.inviteCode) {
        list.push({
          id: "sync",
          tone: "amber",
          label: `Menunggu pasangan bergabung · kode undangan ${workspace.inviteCode}.`,
        });
      } else {
        list.push({
          id: "sync",
          tone: "amber",
          label:
            "Kode undangan belum dibuat — buat di Pengaturan untuk mengundang pasangan.",
        });
      }
    }

    if (savingsNote) {
      list.push({ id: "savings", tone: "mint", label: savingsNote });
    }

    if (wedding) {
      list.push({
        id: "countdown",
        label: `${countdownLabel(wedding.weddingDate)} menuju hari pernikahan · ${formatDateID(wedding.weddingDate)}`,
      });
      list.push({
        id: "checklist",
        label:
          openTasks === 0
            ? "Seluruh tugas telah diselesaikan."
            : `Terdapat ${openTasks} tugas yang belum diselesaikan.`,
      });
      if (wedding.venueName) {
        list.push({ id: "venue", label: `Lokasi acara: ${wedding.venueName}` });
      }
    }
    return list;
  }, [workspace, wedding, openTasks, savingsNote, reminders]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative size-9 rounded-full"
          aria-label="Notifikasi"
        >
          <Bell className="size-4" />
          {openTasks > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {openTasks > 9 ? "9+" : openTasks}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-72 p-2">
        <p className="label px-2 pb-1 pt-1 text-muted-foreground">Notifikasi</p>
        {wedding && (
          <p className="flex items-center gap-1.5 px-2 pb-1.5 text-[11px] font-medium text-foreground">
            <Heart
              className="size-3 shrink-0 text-berry-red"
              fill="currentColor"
            />
            {wedding.partnerOneName ?? ""} &amp; {wedding.partnerTwoName ?? ""}
          </p>
        )}
        <ul className="space-y-1">
          {notes.map((note) => (
            <li
              key={note.id}
              className="clay-inset flex items-start gap-2 px-3 py-2 text-xs leading-relaxed text-foreground"
            >
              {note.tone && (
                <span
                  className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                    note.tone === "mint" ? "bg-tint-mint-foreground" : "bg-amber-500"
                  }`}
                />
              )}
              <span>{note.label}</span>
            </li>
          ))}
          {notes.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              Memuat notifikasi…
            </li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
