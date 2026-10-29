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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import {
  ChevronLeft, ClipboardList, Clock3, Gift, Handshake, Mail,
  MoreHorizontal, Palette, Pencil, Phone, PiggyBank, ReceiptText,
  Search, Trash2, Wallet,
} from "@/lib/icons";
import type { Icon } from "@/lib/icons";

import { Children, useId, useRef, useState, type ChangeEvent, type ReactNode } from "react";
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
      className={`surface-sunk flex flex-col items-start gap-2.5 px-4 py-7 text-left ${className ?? ""}`}
    >
      <Icon aria-hidden="true" className="size-5 text-[var(--ink-soft)]" weight="light" />
      <p className="display-serif text-xl leading-snug text-[var(--ink)]">{title}</p>
      {description && (
        <p className="max-w-[52ch] text-sm leading-relaxed text-[var(--ink-soft)]">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3.5 text-sm font-medium text-[var(--ink)] transition-transform duration-200 hover:border-[var(--brand)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Judul halaman bergaya dokumen: kicker kecil, judul display besar, satu
 * kalimat ringkasan berangka, lalu garis rambut — bukan kartu statistik.
 */
export function PageHeading({
  kicker,
  title,
  summary,
  action,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  summary?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="sj-page-heading relative border-b border-[var(--line)] pb-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          {kicker && (
            <p className="text-sm font-medium text-[var(--ink-soft)]">{kicker}</p>
          )}
          <h1 className="mt-1 display-serif text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.02] text-[var(--ink)]">
            {title}
          </h1>
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>
      {summary && (
        <p className="mt-3 max-w-[64ch] text-base leading-relaxed text-[var(--ink-soft)]">
          {summary}
        </p>
      )}
    </header>
  );
}

/** Satu baris ledger: label, dot leader, lalu nominal tabular. */
export function LedgerFigure({
  label,
  value,
  hint,
  strong,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline gap-2">
        <span className="shrink-0 text-sm text-[var(--ink-soft)]">{label}</span>
        <span aria-hidden="true" className="sj-dot-leader" />
        <span
          className={cn(
            "num shrink-0 text-right text-sm text-[var(--ink)]",
            strong ? "font-semibold" : "font-medium",
          )}
        >
          {value}
        </span>
      </div>
      {hint && (
        <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-[var(--ink-soft)]">{hint}</p>
      )}
    </div>
  );
}

export type StackSegment = {
  label: string;
  value: number;
  tone?: "brand" | "accent" | "positive" | "warning" | "danger" | "sunk";
  /** Judul lengkap untuk tooltip (nilai penuh). */
  title?: string;
};

const SEGMENT_COLOR: Record<NonNullable<StackSegment["tone"]>, string> = {
  brand: "var(--brand, #1a3424)",
  accent: "var(--accent, #a06f30)",
  positive: "var(--positive, #3c5a44)",
  warning: "var(--warning, #a06f30)",
  danger: "var(--danger, #8f2f27)",
  sunk: "color-mix(in srgb, var(--ink-soft, #6b6257) 22%, transparent)",
};

/**
 * Satu bar bertumpuk untuk komposisi uang/RSVP. Segmen tumbuh lewat
 * transform (bukan width) supaya tidak memicu layout saat nilai berubah.
 */
export function StackBar({
  segments,
  label,
  className,
}: {
  segments: StackSegment[];
  label: string;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0);
  const shares = segments.map((segment) =>
    total > 0 ? (Math.max(0, segment.value) / total) * 100 : 0,
  );
  const offsets = shares.reduce<number[]>((acc, share, index) => {
    acc.push(index === 0 ? 0 : acc[index - 1] + shares[index - 1]);
    return acc;
  }, []);

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--paper-sunk)] shadow-[var(--elev-sunk)]",
        className,
      )}
    >
      {segments.map((segment, index) => {
        const share = shares[index];
        const left = offsets[index];
        if (share <= 0) return null;
        return (
          <motion.span
            key={`${segment.label}-${index}`}
            className="absolute inset-y-0 origin-left"
            title={segment.title ?? `${segment.label}: ${segment.value}`}
            style={{
              left: `${left}%`,
              width: "100%",
              backgroundColor: SEGMENT_COLOR[segment.tone ?? "brand"],
            }}
            initial={false}
            animate={{ scaleX: share / 100 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 420, damping: 34 }
            }
          />
        );
      })}
      <span aria-hidden="true" className="shimmer-track pointer-events-none absolute inset-0" />
    </div>
  );
}

/**
 * Segmented control dua/tiga posisi dengan thumb yang meluncur (shared layout).
 * Nilai yang tersimpan tidak berubah — hanya label tampilannya.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const reducedMotion = useReducedMotion();
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("sj-seg inline-flex w-full max-w-full gap-0.5 p-0.5", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-md px-2.5 py-1.5 text-[0.8125rem] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--brand)] disabled:opacity-60",
              active ? "text-[var(--ink)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]",
            )}
          >
            {active && (
              <motion.span
                aria-hidden="true"
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-md border border-[var(--line)] bg-[var(--paper)] shadow-[var(--specular-top)]"
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 34 }
                }
              />
            )}
            <span className="relative z-10 truncate">{option.label}</span>
          </button>
        );
      })}
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
