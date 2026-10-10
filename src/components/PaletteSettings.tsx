import { api } from "@/convex/_generated/api";
import {
  CUSTOM_PALETTE_ID,
  DEFAULT_PALETTE_ID,
  PALETTES,
  SLOT_LABELS,
  SLOT_ORDER,
  SWATCHES,
  applyPalette,
  resolvePalette,
  type Palette,
  type PaletteRoleKey,
  type PaletteRoles,
} from "@/lib/palettes";
import { bloom } from "@/lib/bloom";
import { Button } from "@/components/ui/button";
import { Check, Palette as PaletteIcon, Plus } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Pengaturan → "Tema & Warna".
 *
 * Pilih salah satu dari enam kartu palet preset, atau bangun palet sendiri
 * lewat grid swatch bernama — TIDAK PERNAH ada input kode hex. Setiap pilihan
 * langsung diterapkan lewat `applyPalette` dan disimpan ke Convex (sinkron ke
 * perangkat pasangan).
 */
export function PaletteSection() {
  const wedding = useQuery(api.wedding.get);
  const updatePalette = useMutation(api.wedding.updatePalette);
  const [saving, setSaving] = useState(false);

  const savedId = wedding?.paletteId ?? DEFAULT_PALETTE_ID;
  const savedCustom = wedding?.paletteCustom;
  const savedRoles = resolvePalette(savedId, savedCustom);
  const isCustom = savedId === CUSTOM_PALETTE_ID;

  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<PaletteRoles>(savedRoles);
  const [seeded, setSeeded] = useState(false);

  // Seed draft sekali saat dokumen workspace tiba (tanpa effect di render).
  if (wedding && !seeded) {
    setSeeded(true);
    const roles = resolvePalette(wedding.paletteId, wedding.paletteCustom);
    setDraft(roles);
    setDrafting(wedding.paletteId === CUSTOM_PALETTE_ID);
  }

  // Referensi terbaru untuk rollback dan pembersihan saat unmount.
  const savedRef = useRef(savedRoles);
  useEffect(() => {
    savedRef.current = savedRoles;
  }, [savedId, savedCustom]);

  // Batal/ditinggal tanpa simpan → kembali ke palet tersimpan.
  useEffect(() => {
    if (drafting || !wedding) return;
    applyPalette(savedRoles);
  }, [drafting, savedRoles, wedding]);

  useEffect(() => () => applyPalette(savedRef.current), []);

  const pickPreset = async (preset: Palette) => {
    setDrafting(false);
    setDraft({ ...preset.roles });
    applyPalette(preset.roles); // optimistis — langsung terlihat
    setSaving(true);
    try {
      await updatePalette({ paletteId: preset.id });
      bloom();
      toast.success(`Palet "${preset.name}" diterapkan.`);
    } catch {
      applyPalette(savedRef.current);
      toast.error("Gagal menyimpan palet.");
    } finally {
      setSaving(false);
    }
  };

  const pickSwatch = (slot: PaletteRoleKey, hex: string) => {
    const next = { ...draft, [slot]: hex };
    setDraft(next);
    applyPalette(next); // pratinjau langsung sebelum disimpan
  };

  const saveCustom = async () => {
    setSaving(true);
    try {
      await updatePalette({ paletteId: CUSTOM_PALETTE_ID, paletteCustom: draft });
      savedRef.current = draft;
      bloom();
      toast.success("Palet kustom disimpan — diterapkan di kedua perangkat.");
    } catch {
      applyPalette(savedRoles);
      toast.error("Gagal menyimpan palet kustom.");
    } finally {
      setSaving(false);
    }
  };

  const cancelDraft = () => {
    setDraft({ ...savedRef.current });
    applyPalette(savedRef.current);
    setDrafting(false);
  };

  const effective = drafting ? draft : savedRoles;

  return (
    <section className="clay space-y-4 p-5">
      <div className="flex items-center gap-3">
        <div className="clay-sm flex size-11 items-center justify-center rounded-2xl bg-tint-lavender text-lg text-tint-lavender-foreground">
          <PaletteIcon className="size-5" />
        </div>
        <div>
          <p className="label text-muted-foreground">Tema &amp; Warna</p>
          <p className="meta mt-1">
            Ganti palet — warna seluruh aplikasi ikut berubah, langsung
            tersimpan untuk berdua
          </p>
        </div>
      </div>

      {/* Strip pratinjau lima peran warna */}
      <div
        className="flex h-10 overflow-hidden rounded-xl border border-border shadow-sm"
        aria-hidden="true"
      >
        {SLOT_ORDER.map((slot) => (
          <span
            key={slot}
            className="flex-1"
            style={{ backgroundColor: effective[slot] }}
            title={SLOT_LABELS[slot]}
          />
        ))}
      </div>

      {/* Kartu palet preset */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PALETTES.map((preset) => {
          const active = !isCustom && savedId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={saving}
              onClick={() => void pickPreset(preset)}
              className={`group relative rounded-xl border p-3 text-left transition hover:-translate-y-0.5 ${
                active
                  ? "border-primary ring-2 ring-primary/25"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <span className="flex h-6 overflow-hidden rounded-lg border border-border/60">
                {SLOT_ORDER.map((slot) => (
                  <span
                    key={slot}
                    className="flex-1"
                    style={{ backgroundColor: preset.roles[slot] }}
                  />
                ))}
              </span>
              <span className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {preset.name}
                {active && <Check className="size-3.5 text-primary" />}
              </span>
              <span className="meta mt-0.5 block">{preset.hint}</span>
            </button>
          );
        })}

        {/* Kartu palet kustom */}
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            setDraft({ ...savedRoles });
            setDrafting(true);
          }}
          className={`group relative rounded-xl border p-3 text-left transition hover:-translate-y-0.5 ${
            isCustom
              ? "border-primary ring-2 ring-primary/25"
              : "border-border hover:border-primary/40"
          }`}
        >
          <span className="flex h-6 overflow-hidden rounded-lg border border-border/60">
            {SLOT_ORDER.map((slot) => (
              <span
                key={slot}
                className="flex-1"
                style={{ backgroundColor: effective[slot] }}
              />
            ))}
          </span>
          <span className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            Palet Kustom
            {isCustom && <Check className="size-3.5 text-primary" />}
            {!isCustom && (
              <Plus className="size-3.5 text-muted-foreground" />
            )}
          </span>
          <span className="meta mt-0.5 block">Pilih warna sendiri per peran</span>
        </button>
      </div>

      {/* Editor kustom — grid swatch bernama, tanpa input hex */}
      {drafting && (
        <div className="space-y-4 rounded-xl border border-border bg-muted/60 p-4">
          <p className="label text-muted-foreground">
            Palet kustom — klik warna untuk tiap peran
          </p>

          {SLOT_ORDER.map((slot) => (
            <div key={slot}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {SLOT_LABELS[slot]}
                </span>
                <span className="flex items-center gap-2">
                  <span className="meta">
                    {SWATCHES.find((s) => s.hex === draft[slot])?.name ??
                      "Pilihan Anda"}
                  </span>
                  <span
                    className="size-5 rounded-full border border-border"
                    style={{ backgroundColor: draft[slot] }}
                  />
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SWATCHES.map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    title={swatch.name}
                    aria-label={`${SLOT_LABELS[slot]}: ${swatch.name}`}
                    onClick={() => pickSwatch(slot, swatch.hex)}
                    className={`size-7 rounded-full border transition hover:scale-110 ${
                      draft[slot] === swatch.hex
                        ? "border-transparent ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "border-black/10"
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={saving}
              onClick={() => void saveCustom()}
            >
              Simpan palet kustom
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={cancelDraft}
            >
              Batal
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
