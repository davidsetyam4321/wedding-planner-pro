import { api } from "@/convex/_generated/api";
import {
  DEFAULT_PALETTE_ID,
  applyPalette,
  resolvePalette,
  rolesKey,
} from "@/lib/palettes";
import { useQuery } from "convex/react";
import { useLayoutEffect } from "react";

/**
 * Penggunaan palet di runtime.
 *
 * Karena utilitas Tailwind v4 mengacu ke `var(--color-*)`, menulis custom
 * property di `document.documentElement` mengubah SELURUH aplikasi seketika.
 * Dua komponen kecil ini dipasang oleh `RoutePalette` di router:
 *
 * - `AppPalette`  — halaman /app: palet workspace (Convex, sinkron ke pasangan).
 * - `DefaultPalette` — halaman publik: selalu palet default Burgundy Garden.
 *
 * `useLayoutEffect` dipakai supaya warna ter-apply sebelum paint pertama
 * (tanpa kilatan warna lama).
 */

export function DefaultPalette() {
  useLayoutEffect(() => {
    applyPalette(resolvePalette(DEFAULT_PALETTE_ID));
  }, []);
  return null;
}

export function AppPalette() {
  const wedding = useQuery(api.wedding.get);
  const roles = resolvePalette(wedding?.paletteId, wedding?.paletteCustom);
  // Key berbasis nilai: efek hanya berjalan saat palet benar-benar berubah.
  const key = rolesKey(roles);

  useLayoutEffect(() => {
    applyPalette(resolvePalette(wedding?.paletteId, wedding?.paletteCustom));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}
