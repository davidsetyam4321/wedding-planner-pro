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
import {
  BranchMark,
  BouquetMark,
  FlowerMark,
  SprigMark,
  WreathMark,
} from "@/components/Decor";
import FadeContent from "@/components/FadeContent";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import {
  ChevronLeft, ClipboardList, Clock3, Gift, Handshake, Mail,
  MoreHorizontal, Palette, Pencil, Phone, PiggyBank, ReceiptText,
  Search, Trash2, Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Children, useState, type ReactNode } from "react";
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
  icon?: LucideIcon;
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

// Keep existing call sites compatible while rendering consistent Lucide SVGs.
const EMPTY_ICONS: Record<string, LucideIcon> = {
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
      className={`stationery flex flex-col items-center justify-center gap-3 rounded-3xl px-6 py-10 text-center ${
        className ?? ""
      }`}
    >
      <div className="relative">
        <div className="flex size-14 items-center justify-center rounded-full border border-gold/40 bg-secondary text-primary">
          <Icon aria-hidden="true" className="size-6" strokeWidth={1.5} />
        </div>
        <SprigMark className="absolute -right-2 -top-2 size-5 text-bloom" />
      </div>
      <p className="relative text-sm font-semibold">{title}</p>
      {description && (
        <p className="max-w-[36ch] text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button size="sm" className="mt-1 rounded-xl" onClick={onAction}>
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
      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${tone}`}
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
const SECTION_MARKS = [
  FlowerMark,
  SprigMark,
  BouquetMark,
  BranchMark,
  WreathMark,
];
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  // Ikon section beragam — dipilih deterministik dari judul, tidak monoton.
  const Mark = SECTION_MARKS[[...title].length % SECTION_MARKS.length];
  return (
    <FadeContent duration={550} className="mb-2.5">
      <div className="flex items-end justify-between gap-2">
        <h2 className="flex items-center gap-1.5 font-serif text-[15px] font-normal uppercase leading-tight tracking-[0.14em] text-midnight-navy">
          <Mark className="size-4 shrink-0 text-bloom" />
          {title}
        </h2>
        {action}
      </div>
      {/* garis rambut khas kertas undangan di bawah judul seksi */}
      <span
        aria-hidden="true"
        className="mt-2 block h-px w-full bg-gradient-to-r from-gold/70 via-gold/25 to-transparent"
      />
    </FadeContent>
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
