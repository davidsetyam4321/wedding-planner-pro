import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import {
  ChevronLeft, ClipboardList, Clock3, Gift, Handshake, Mail,
  MoreHorizontal, Palette, Pencil, Phone, PiggyBank, ReceiptText,
  Search, Trash2, Wallet,
} from "@/lib/icons";
import type { Icon } from "@/lib/icons";

import { Children, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router";

/**
 * Animated list/grid: stable keys animate additions, removals, and position
 * changes. Wrap each direct child with <StaggerItem>; no cumulative delay
 * so large lists remain immediately usable.
 */
export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {/* Stable item keys preserve focus and let reactive updates animate out. */}
      <AnimatePresence>{Children.toArray(children)}</AnimatePresence>
    </div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const isPresent = useIsPresent();
  return (
    <motion.div
      className={className}
      inert={!isPresent}
      aria-hidden={!isPresent || undefined}
      layout={reducedMotion ? false : "position"}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: reducedMotion ? 0 : 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export type RowMenuExtra = {
  label: string;
  icon?: Icon;
  onSelect: () => void;
};

/**
 * Compact "•••" row menu so edit/delete actions stop cluttering every card.
 * Delete opens a themed AlertDialog instead of the browser's confirm().
 */
export function RowMenu({
  onEdit,
  onDelete,
  deleteTitle,
  deleteDescription,
  extra,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  deleteTitle?: string;
  deleteDescription?: string;
  extra?: RowMenuExtra[];
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Menu aksi"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-2xl">
          {onEdit && (
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil className="size-3.5" /> Ubah
            </DropdownMenuItem>
          )}
          {extra?.map((item) => (
            <DropdownMenuItem key={item.label} onSelect={item.onSelect}>
              {item.icon ? <item.icon className="size-3.5" /> : null}
              {item.label}
            </DropdownMenuItem>
          ))}
          {onDelete && (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setConfirming(true)}
            >
              <Trash2 className="size-3.5" /> Hapus
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTitle ?? "Hapus item ini?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDescription ??
                "Tindakan ini tidak bisa dibatalkan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                onDelete?.();
                setConfirming(false);
              }}
            >
              Ya, hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Keep existing call sites compatible while rendering consistent Phosphor icons.
const EMPTY_ICONS: Record<string, Icon> = {
  "🎁": Gift, "🤝": Handshake, "🔍": Search, "💸": Wallet,
  "🧾": ReceiptText, "📝": ClipboardList, "🎨": Palette,
  "📞": Phone, "🐷": PiggyBank, "⏰": Clock3, "💌": Mail,
};

/** Helpful, accessible empty state with a themed SVG and optional action. */
export function EmptyState({
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  emoji: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  const Icon = EMPTY_ICONS[emoji] ?? ClipboardList;
  return (
    <div
      className={`flex flex-col items-start gap-3 border-t border-[var(--line)] px-1 py-8 text-left ${
        className ?? ""
      }`}
    >
      <Icon aria-hidden="true" className="size-5 text-[var(--ink-soft)]" weight="light" />
      <p className="text-base font-medium text-[var(--ink)]">{title}</p>
      {description && (
        <p className="max-w-[52ch] text-sm leading-relaxed text-[var(--ink-soft)]">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" className="mt-1 rounded-lg" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * Chip tenggat (due date): “H-3”, “Hari ini”, atau “Terlambat 2 hari”.
 * Merah bila lewat, amber bila ≤ 3 hari, netral selebihnya.
 */
export function DueChip({ dueDate }: { dueDate: number }) {
  const DAY = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((dueDate - today.getTime()) / DAY);

  const tone =
    days < 0
      ? "bg-destructive/10 text-destructive"
      : days <= 3
        ? "bg-sky-tint text-midnight-navy"
        : "bg-secondary text-secondary-foreground";
  const text =
    days < 0
      ? `Terlambat ${Math.abs(days)} hr`
      : days === 0
        ? "Hari ini"
        : days === 1
          ? "Besok"
          : `H-${days}`;

  return (
    <span
      className={`num shrink-0 rounded-md px-1.5 py-1 text-[0.8125rem] ${tone}`}
      title={new Date(dueDate).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    >
      {text}
    </span>
  );
}

/**
 * Judul seksi bergaya undangan: huruf kapital kecil berjarak lebar di kiri,
 * aksi/meta di kanan, lalu garis rambut tipis di bawahnya seperti kertas
 * undangan cetak. Dipakai di seluruh halaman agar struktur judul seragam.
 * Ikonnya silih berganti antar section supaya penempatan tidak monoton.
 */
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-serif text-xl leading-snug text-[var(--ink)] lg:text-2xl">
          {title}
        </h2>
        {action}
      </div>
      <span
        aria-hidden="true"
        className="mt-2 block w-full border-b border-[var(--line)]"
      />
    </div>
  );
}

/**
 * Tombol "Kembali" bersama untuk semua halaman: kembali ke riwayat
 * navigasi, atau ke `fallback` bila halaman dibuka langsung (deep link).
 */
export function BackLink({
  label = "Kembali",
  fallback = "/app",
}: {
  label?: string;
  fallback?: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => {
        if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
        else navigate(fallback);
      }}
      className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
    >
      <ChevronLeft className="size-3.5" /> {label}
    </button>
  );
}

/**
 * Placeholder yang ditampilkan selama query Convex pertama masih dimuat,
 * supaya halaman tidak berkedip menampilkan empty-state dulu.
 */
type LocalizedInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
};

function parseGroupedDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatGroupedDigits(value: string): string {
  const digits = parseGroupedDigits(value);
  let formatted = "";
  for (let index = 0; index < digits.length; index += 1) {
    if (index > 0 && (digits.length - index) % 3 === 0) formatted += ".";
    formatted += digits[index];
  }
  return formatted;
}

/** Nominal berkelompok ribuan, tetap mengirim digit polos ke form/API. */
export function MoneyInput({
  id,
  value,
  onChange,
  className,
  placeholder = "500.000",
  ariaLabel,
}: LocalizedInputProps) {
  const [display, setDisplay] = useState(() => formatGroupedDigits(value));
  const [syncedValue, setSyncedValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Nilai dari form/API bisa berubah (mis. setelah reset); sinkronkan tanpa
  // efek supaya tidak ada render berantai.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDisplay(formatGroupedDigits(value));
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const digitsBeforeCaret = parseGroupedDigits(input.value.slice(0, input.selectionStart ?? input.value.length)).length;
    const digits = parseGroupedDigits(input.value);
    const formatted = formatGroupedDigits(digits);
    setDisplay(formatted);
    onChange(digits);
    requestAnimationFrame(() => {
      if (document.activeElement !== inputRef.current) return;
      let caret = 0;
      let seen = 0;
      while (caret < formatted.length && seen < digitsBeforeCaret) {
        if (formatted[caret] >= "0" && formatted[caret] <= "9") seen += 1;
        caret += 1;
      }
      inputRef.current?.setSelectionRange(caret, caret);
    });
  };

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
    />
  );
}

function dateInputDisplay(isoValue: string): string {
  const [year, month, day] = isoValue.split("-");
  return year?.length === 4 && month?.length === 2 && day?.length === 2
    ? `${day}/${month}/${year}`
    : "";
}

/** Date picker teks dd/mm/yyyy; hanya menyimpan ISO setelah tanggal valid. */
export function DateInputID({
  id,
  value,
  onChange,
  className,
  placeholder = "dd/mm/yyyy",
  ariaLabel,
}: LocalizedInputProps) {
  const [display, setDisplay] = useState(() => dateInputDisplay(value));
  const [syncedValue, setSyncedValue] = useState(value);

  if (value !== syncedValue) {
    setSyncedValue(value);
    setDisplay(dateInputDisplay(value));
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = parseGroupedDigits(event.currentTarget.value).slice(0, 8);
    const formatted = digits.length <= 2
      ? digits
      : digits.length <= 4
        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
        : `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    setDisplay(formatted);
    if (digits.length === 0) {
      onChange("");
      return;
    }
    if (digits.length !== 8) {
      onChange("");
      return;
    }
    const day = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4));
    const year = Number(digits.slice(4));
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      onChange("");
      return;
    }
    onChange(`${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-busy="true" aria-label="Memuat data perencanaan">
      <span className="sr-only">Memuat data perencanaan…</span>
      <Skeleton className="h-36 w-full rounded-3xl" />
      <Skeleton className="h-28 w-full rounded-3xl" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-3xl" />
    </div>
  );
}
