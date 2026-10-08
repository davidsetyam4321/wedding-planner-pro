import { Bird, Bunny, DoodleStar, MelatiBuddy } from "@/components/Doodles";
import type { ComponentType } from "react";

type CharacterComponent = ComponentType<{ className?: string }>;

/**
 * Satu karakter berbeda untuk tiap rute — kejutan kecil yang membuat tiap
 * halaman terasa punya "penghuni" sendiri. Selalu ada fallback.
 */
const CREW: Record<string, CharacterComponent> = {
  "/app": Bunny,
  "/app/budget": Bird,
  "/app/tabungan": MelatiBuddy,
  "/app/checklist": Bird,
  "/app/moodboard": MelatiBuddy,
  "/app/tamu": Bird,
  "/app/vendor": MelatiBuddy,
  "/app/rundown": Bird,
  "/app/seserahan": Bunny,
  "/app/pengaturan": MelatiBuddy,
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
  const Character = CREW[pathname] ?? MelatiBuddy;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-24 right-3 z-20 flex items-end gap-1.5 lg:bottom-6 lg:right-6"
    >
      {daysLabel && (
        <span className="relative mb-8 rounded-2xl border border-border bg-paper-white px-2.5 py-1 text-[11px] font-extrabold tracking-tight text-inkwell-navy shadow-sm">
          {daysLabel}
          <span className="absolute -bottom-1 -right-1 size-2 rotate-45 border-b border-r border-border bg-paper-white" />
        </span>
      )}
      <span className="relative block">
        <DoodleStar className="absolute -left-3 -top-3 size-3.5 text-butter-yellow" />
        <Character className="bobbing block size-16 drop-shadow-[0_4px_6px_rgba(21,27,49,0.15)] lg:size-20" />
      </span>
    </div>
  );
}
