import { DoodleStar, PengantinPria, PengantinWanita, Semar } from "@/components/Doodles";
import type { ComponentType } from "react";

type CharacterComponent = ComponentType<{ className?: string }>;

/**
 * Satu karakter Jawa berbeda untuk tiap rute — pengantin pria/wanita dan
 * Semar sebagai pepunden. Kehutan kecil yang membuat tiap halaman terasa
 * punya "penghuni" sendiri. Selalu ada fallback.
 */
const CREW: Record<string, CharacterComponent> = {
  "/app": Semar,
  "/app/budget": PengantinPria,
  "/app/tabungan": PengantinWanita,
  "/app/checklist": Semar,
  "/app/moodboard": PengantinWanita,
  "/app/tamu": PengantinPria,
  "/app/vendor": PengantinWanita,
  "/app/rundown": Semar,
  "/app/seserahan": PengantinPria,
  "/app/pengaturan": PengantinWanita,
};

/**
 * Maskot halaman: karakter doodle mengambang di sudut kanan bawah dengan
 * stiker hitung mundur ("H-123"). pointer-events-none + aria-hidden —
 * murni dekoratif, tidak pernah menghalangi klik atau pembaca layar.
 */
export function PageMascot({
  pathname,
  daysLabel,
}: {
  pathname: string;
  daysLabel?: string;
}) {
  const Character = CREW[pathname] ?? Semar;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-24 right-3 z-20 flex items-end gap-1.5 lg:bottom-6 lg:right-6"
    >
      {daysLabel && (
        <span className="relative mb-8 rounded-2xl border border-border bg-paper-white px-2.5 py-1 text-[11px] font-extrabold tracking-tight text-teak-ink shadow-sm">
          {daysLabel}
          <span className="absolute -bottom-1 -right-1 size-2 rotate-45 border-b border-r border-border bg-paper-white" />
        </span>
      )}
      <span className="relative block">
        <DoodleStar className="absolute -left-3 -top-3 size-3.5 text-brass-gold" />
        <Character className="bobbing block size-16 drop-shadow-[0_4px_6px_rgba(58,35,23,0.2)] lg:size-20" />
      </span>
    </div>
  );
}
