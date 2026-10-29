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
import { Check, Palette as PaletteIcon, Plus } from "@/lib/icons";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Pengaturan → "Tema dan warna".
 *
 * Tujuh kartu palet preset dengan pratinjau mini (latar, kartu, aksen, teks),
 * plus editor palet kustom per peran. Setiap pilihan langsung diterapkan lewat
 * `applyPalette` dan disimpan ke Convex (sinkron ke perangkat pasangan).
 * Pergantian preset memakai View Transitions: lingkaran warna tumbuh dari
 * swatch yang diketuk, dengan crossfade biasa bila API tidak tersedia.
 */

type ViewTransitionHandle = { ready: Promise<void>; finished: Promise<void> };
type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionHandle;
};

/** Lingkaran tema hanya saat efek aktif dan pengguna tidak minta gerak minimal. */
function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function revealFrom(element: HTMLElement, apply: () => void) {
  const doc = document as ViewTransitionDocument;
  const effectsOff = document.documentElement.dataset.effects === "off";
  if (!doc.startViewTransition || effectsOff || prefersReducedMotion()) {
    apply();
    return;
  }

  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  // Warna diterapkan di dalam callback supaya snapshot "baru" sudah memakai
  // palet tujuan; animasi lingkaran hanya mengatur cara ia terungkap.
  const transition = doc.startViewTransition(apply);
  void transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 520,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        } as KeyframeAnimationOptions,
      );
    })
    .catch(() => {
      // Transisi dibatalkan (mis. pengguna berpindah halaman) — palet tetap.
    });
}

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

  const pickPreset = (preset: Palette, trigger?: HTMLElement) => {
    const apply = () => {
      setDrafting(false);
      setDraft({ ...preset.roles });
      applyPalette(preset.roles); // optimistis — langsung terlihat
    };
    if (trigger) revealFrom(trigger, apply);
    else apply();

    setSaving(true);
    void updatePalette({ paletteId: preset.id })
      .then(() => {
        bloom();
        toast.success(`Palet "${preset.name}" diterapkan.`);
      })
      .catch(() => {
        applyPalette(savedRef.current);
        toast.error("Gagal menyimpan palet.");
      })
      .finally(() => setSaving(false));
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
  const activeName =
    PALETTES.find((preset) => preset.id === savedId)?.name ?? "Palet kustom";

  return (
    <section className="sj-paper-sheet space-y-4 p-5 sm:p-6">
      <style>{`
        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation: none;
          mix-blend-mode: normal;
        }
      `}</style>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="display-serif text-2xl leading-snug text-[var(--ink)]">
            Tema dan warna
          </h2>
          <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-[var(--ink-soft)]">
            Pilih satu palet untuk seluruh aplikasi. Warna langsung berubah dan
            tersimpan untuk kalian berdua.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[0.8125rem] text-[var(--ink-soft)]">
          <PaletteIcon className="size-4 text-[var(--brand)]" weight="duotone" />
          <span>
            Aktif: <span className="text-[var(--ink)]">{activeName}</span>
          </span>
        </div>
      </div>

      {/* Pratinjau lima peran warna palet yang sedang tampil */}
      <div
        className="flex h-9 overflow-hidden rounded-xl border border-[var(--line)]"
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

      {/* Kartu tema: pratinjau mini halaman, bukan sekadar deretan kotak warna */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PALETTES.map((preset) => {
          const active = !isCustom && savedId === preset.id;
          const roles = preset.roles;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={saving}
              aria-pressed={active}
              onClick={(event) => pickPreset(preset, event.currentTarget)}
              className={`group relative overflow-hidden rounded-2xl border p-2.5 text-left transition-[transform,border-color,box-shadow] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] disabled:opacity-70 ${
                active
                  ? "border-[var(--brand)] shadow-[var(--specular-top),var(--elev-ambient)]"
                  : "border-[var(--line)] hover:border-[var(--brand)] hover:shadow-[var(--specular-top),var(--elev-ambient)]"
              }`}
            >
              <span
                aria-hidden="true"
                className="relative block h-16 overflow-hidden rounded-xl border border-black/10"
                style={{ backgroundColor: roles.background }}
              >
                <span
                  className="absolute inset-x-2 top-2 h-1.5 rounded-full"
                  style={{ backgroundColor: roles.primary }}
                />
                <span
                  className="absolute left-2 top-5 h-1 w-8 rounded-full"
                  style={{ backgroundColor: roles.secondary }}
                />
                <span
                  className="absolute inset-x-2 bottom-2 h-7 rounded-md"
                  style={{
                    backgroundColor: roles.soft,
                    boxShadow: `inset 0 0 0 1px ${roles.nature}55`,
                  }}
                />
                <span
                  className="absolute bottom-4 right-4 size-3 rounded-full"
                  style={{ backgroundColor: roles.secondary }}
                />
              </span>
              <span className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)]">
                <span className="truncate">{preset.name}</span>
                {active && <Check className="size-3.5 shrink-0 text-[var(--brand)]" />}
              </span>
              <span className="mt-0.5 line-clamp-2 block text-[0.8125rem] leading-snug text-[var(--ink-soft)]">
                {preset.hint}
              </span>
            </button>
          );
        })}

        {/* Kartu palet kustom */}
        <button
          type="button"
          disabled={saving}
          aria-pressed={isCustom}
          onClick={() => {
            setDraft({ ...savedRoles });
            setDrafting(true);
          }}
          className={`group relative overflow-hidden rounded-2xl border p-2.5 text-left transition-[transform,border-color,box-shadow] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] disabled:opacity-70 ${
            isCustom
              ? "border-[var(--brand)] shadow-[var(--specular-top),var(--elev-ambient)]"
              : "border-[var(--line)] hover:border-[var(--brand)] hover:shadow-[var(--specular-top),var(--elev-ambient)]"
          }`}
        >
          <span className="relative flex h-16 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper-sunk)]">
            <span className="flex items-center gap-1" aria-hidden="true">
              {SLOT_ORDER.map((slot) => (
                <span
                  key={slot}
                  className="size-4 rounded-full border border-black/10"
                  style={{ backgroundColor: effective[slot] }}
                />
              ))}
            </span>
          </span>
          <span className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)]">
            Palet kustom
            {isCustom ? (
              <Check className="size-3.5 shrink-0 text-[var(--brand)]" />
            ) : (
              <Plus className="size-3.5 shrink-0 text-[var(--ink-soft)]" />
            )}
          </span>
          <span className="mt-0.5 block text-[0.8125rem] leading-snug text-[var(--ink-soft)]">
            Susun warna sendiri per peran
          </span>
        </button>
      </div>

      {/* Editor kustom — grid swatch bernama, tanpa input hex */}
      {drafting && (
        <div className="surface-sunk space-y-4 p-4">
          <p className="text-sm font-medium text-[var(--ink)]">
            Palet kustom — ketuk warna untuk tiap peran.
          </p>

          {SLOT_ORDER.map((slot) => (
            <div key={slot} className="border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--ink)]">
                  {SLOT_LABELS[slot]}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[0.8125rem] text-[var(--ink-soft)]">
                    {SWATCHES.find((s) => s.hex === draft[slot])?.name ??
                      "Pilihan Anda"}
                  </span>
                  <span
                    aria-hidden="true"
                    className="size-5 rounded-full border border-[var(--line)]"
                    style={{ backgroundColor: draft[slot] }}
                  />
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-0.5">
                {SWATCHES.map((swatch) => {
                  const selected = draft[slot] === swatch.hex;
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      title={swatch.name}
                      aria-label={`${SLOT_LABELS[slot]}: ${swatch.name}`}
                      aria-pressed={selected}
                      onClick={() => pickSwatch(slot, swatch.hex)}
                      className="grid size-11 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                    >
                      <span
                        className={`size-7 rounded-full border transition-transform duration-150 hover:scale-110 ${
                          selected
                            ? "border-transparent ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--paper)]"
                            : "border-black/10"
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-2 border-t border-[var(--line)] pt-3 sm:flex-row">
            <Button
              type="button"
              size="sm"
              className="min-h-11 flex-1 rounded-lg transition-transform active:scale-[0.97]"
              disabled={saving}
              onClick={() => void saveCustom()}
            >
              Simpan palet kustom
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 rounded-lg transition-transform active:scale-[0.97]"
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
