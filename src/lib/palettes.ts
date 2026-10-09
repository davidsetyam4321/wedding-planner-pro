/**
 * Sistem palet warna SatuJanji.
 *
 * Satu palet = lima peran warna (utama, sekunder, lembut, hijau daun, latar).
 * `applyPalette` me-override CSS custom property di `:root` — karena utilitas
 * Tailwind v4 mengacu ke `var(--color-*)`, SELURUH aplikasi berganti warna
 * seketika tanpa reload. Pengguna memilih warna lewat kartu preset atau grid
 * swatch bernama — tidak pernah mengetik kode hex.
 */

export type PaletteRoles = {
  /** WarnaUtama — tombol utama, link, aksi terisi. */
  primary: string;
  /** WarnaSekunder — aksen, ikon, ring fokus. */
  secondary: string;
  /** AksenLembut — permukaan tint, chip, latar lembut. */
  soft: string;
  /** HijauDaun — ornamen nature, elemen hijau. */
  nature: string;
  /** Latar — background halaman. */
  background: string;
};

export type PaletteRoleKey = keyof PaletteRoles;

export type Palette = {
  id: string;
  name: string;
  hint: string;
  roles: PaletteRoles;
};

export const CUSTOM_PALETTE_ID = "custom";
export const DEFAULT_PALETTE_ID = "burgundy-garden";

export const SLOT_LABELS: Record<PaletteRoleKey, string> = {
  primary: "Warna Utama",
  secondary: "Warna Sekunder",
  soft: "Aksen Lembut",
  nature: "Hijau Daun",
  background: "Latar",
};

export const SLOT_ORDER: PaletteRoleKey[] = [
  "primary",
  "secondary",
  "soft",
  "nature",
  "background",
];

/** Enam palet colorful siap pakai — "Burgundy Garden" berasal dari referensi pengguna. */
export const PALETTES: Palette[] = [
  {
    id: "burgundy-garden",
    name: "Burgundy Garden",
    hint: "Palet resmi — dari referensi Anda",
    roles: {
      primary: "#5e1a26",
      secondary: "#b24a55",
      soft: "#f2c9ce",
      nature: "#6b7a38",
      background: "#f7e9c3",
    },
  },
  {
    id: "taman-mawar",
    name: "Taman Mawar",
    hint: "Rose merah muda & putih hangat",
    roles: {
      primary: "#8e2a4a",
      secondary: "#be4a64",
      soft: "#f7dbe0",
      nature: "#5e8c4a",
      background: "#fff6f1",
    },
  },
  {
    id: "terracotta-salvia",
    name: "Terracotta & Salvia",
    hint: "Bumi hangat & hijau lembut",
    roles: {
      primary: "#9c4426",
      secondary: "#a8613a",
      soft: "#f5decb",
      nature: "#7c8c5a",
      background: "#faf4ea",
    },
  },
  {
    id: "ladang-lavender",
    name: "Ladang Lavender",
    hint: "Ungu tenang & hijau segar",
    roles: {
      primary: "#5b3e8c",
      secondary: "#8261b0",
      soft: "#e9dff6",
      nature: "#6e8c4e",
      background: "#f9f6fd",
    },
  },
  {
    id: "padang-cerah",
    name: "Padang Cerah",
    hint: "Rumput & matahari",
    roles: {
      primary: "#41682a",
      secondary: "#a4641f",
      soft: "#fbe9b8",
      nature: "#7c9a3f",
      background: "#fbf8ec",
    },
  },
  {
    id: "ombak-bloom",
    name: "Ombak & Bloom",
    hint: "Teal laut & karang",
    roles: {
      primary: "#14657a",
      secondary: "#2e7a91",
      soft: "#f9ddd8",
      nature: "#4c8c6e",
      background: "#f0f7f6",
    },
  },
];

export type Swatch = { name: string; hex: string };

/**
 * Pilihan warna untuk mode kustom — dipilih lewat swatch bernama,
 * bukan input hex. Gelap → sedang → lembut.
 */
export const SWATCHES: Swatch[] = [
  // gelap — cocok untuk warna utama
  { name: "Anggur Tua", hex: "#5e1a26" },
  { name: "Anggur", hex: "#74243c" },
  { name: "Cokelat Bata", hex: "#8c3a2b" },
  { name: "Terakota", hex: "#a64b2a" },
  { name: "Teal Tua", hex: "#14657a" },
  { name: "Ungu Tua", hex: "#5b3e8c" },
  { name: "Hutan", hex: "#2f5d3f" },
  // sedang — cocok untuk sekunder
  { name: "Mawar Bubuk", hex: "#b24a55" },
  { name: "Mawar", hex: "#be4a64" },
  { name: "Karang", hex: "#d9735f" },
  { name: "Emas", hex: "#c08a2e" },
  { name: "Salvia", hex: "#7e9060" },
  { name: "Daun", hex: "#4e8a47" },
  { name: "Lavender", hex: "#8261b0" },
  { name: "Laut", hex: "#2e7a91" },
  { name: "Zaitun", hex: "#6b7a38" },
  // lembut — cocok untuk aksen & latar
  { name: "Merah Muda", hex: "#f2c9ce" },
  { name: "Sakura", hex: "#f7dbe0" },
  { name: "Persik", hex: "#f6d9c4" },
  { name: "Gading", hex: "#f7e9c3" },
  { name: "Krem", hex: "#faf4ea" },
  { name: "Daun Muda", hex: "#dcefe0" },
  { name: "Lilac", hex: "#e9dff6" },
  { name: "Langit Muda", hex: "#dcebf5" },
  { name: "Putih Hangat", hex: "#fbf7f0" },
  { name: "Mentega", hex: "#fbe9b8" },
];

/* ── Matematika warna (tanpa dependensi) ──────────────────────────────── */

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const int = parseInt(full.slice(0, 6), 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function rgbToHex(r: number, g: number, numberB: number): string {
  return (
    "#" +
    [r, g, numberB]
      .map((v) => clamp(v).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** campur(a, b, t) — t=0 → a, t=1 → b. */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function darken(hex: string, t: number): string {
  return mix(hex, "#150f11", t);
}

export function lighten(hex: string, t: number): string {
  return mix(hex, "#ffffff", t);
}

function channelLuma(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channelLuma(r) + 0.7152 * channelLuma(g) + 0.0722 * channelLuma(b);
}

export function contrast(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Teks di atas warna terisi: putih bila kontras cukup, gelap hangat bila tidak. */
export function readableOn(hex: string): string {
  return contrast(hex, "#ffffff") >= 4.5 ? "#ffffff" : "#241c20";
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ── Resolusi palet ───────────────────────────────────────────────────── */

/** Palet efektif dari nilai tersimpan (preset id atau slot kustom). */
export function resolvePalette(
  paletteId?: string,
  custom?: PaletteRoles,
): PaletteRoles {
  if (paletteId === CUSTOM_PALETTE_ID && custom) {
    return {
      primary: custom.primary,
      secondary: custom.secondary,
      soft: custom.soft,
      nature: custom.nature,
      background: custom.background,
    };
  }
  const preset =
    PALETTES.find((p) => p.id === (paletteId ?? DEFAULT_PALETTE_ID)) ??
    PALETTES[0];
  return { ...preset.roles };
}

/** Daftar hex dari suatu palet — kunci identitas untuk memoisasi. */
export function rolesKey(roles: PaletteRoles): string {
  return SLOT_ORDER.map((k) => roles[k]).join("|");
}

/* ── Terapkan ke runtime ──────────────────────────────────────────────── */

/**
 * Peta seluruh CSS custom property untuk sebuah palet. Sumber kebenaran
 * tunggal — dipakai `applyPalette` di runtime DAN untuk menyusun nilai statis
 * di `src/index.css`, sehingga nilai awal = nilai runtime (tanpa divergensi).
 */
export function paletteVars(roles: PaletteRoles): Record<string, string> {
  const vars: Record<string, string> = {};

  const P = roles.primary;
  const S = roles.secondary;
  const F = roles.soft;
  const L = roles.nature;
  const B = roles.background;

  const primaryHover = darken(P, 0.16);
  const primaryDeep = darken(P, 0.3);
  const onPrimary = readableOn(P);
  const secondaryDeep = darken(S, 0.24);
  const accentFg = darken(S, 0.42);

  // Netral hangat — ditarik dari latar agar tetap selaras & kontras.
  const ink = mix("#241c20", B, 0.05);
  // Netral sekunder dinaikkan kontrasnya (≥4.8:1 di atas latar terang).
  const graphite = mix("#4a4043", B, 0.14);
  const stone = mix("#97878a", B, 0.25);
  const fog = mix("#d5c9ca", B, 0.35);
  const mist = mix("#eee5e4", B, 0.45);
  const card = mix(B, "#ffffff", 0.8);
  const white = mix(B, "#ffffff", 0.93);
  const tintSoft = mix(F, B, 0.35);
  const tintRose = mix(S, "#ffffff", 0.86);
  const tintLeaf = mix(L, "#ffffff", 0.86);
  const tintWarm = mix(F, "#ffffff", 0.55);

  const set = (name: string, value: string) => {
    vars[name] = value;
  };

  /* Token brand — nama lama di-remap ke peran palet */
  set("--color-cerulean-sky", P);
  set("--color-deep-cerulean", primaryHover);
  set("--color-atmosphere-blue", S);
  set("--color-midnight-navy", primaryDeep);
  set("--color-inkwell-navy", primaryDeep);
  set("--color-teak-ink", primaryDeep);
  set("--color-berry-red", secondaryDeep);
  set("--color-brick-accent", secondaryDeep);
  set("--color-brass-gold", S);
  set("--color-butter-yellow", S);
  set("--color-janur-green", L);
  set("--color-sky-tint", tintSoft);
  set("--color-berry-tint", tintRose);
  set("--color-cloud-white", white);
  set("--color-paper-white", white);
  set("--color-mist-gray", mist);
  set("--color-ash-canvas", mist);
  set("--color-fog", fog);
  set("--color-fog-line", fog);
  set("--color-warm-stone", fog);
  set("--color-stone", stone);
  set("--color-slate", stone);
  set("--color-graphite", graphite);
  set("--color-ink", ink);
  set("--color-pure-ink", ink);
  set("--color-obsidian", darken(ink, 0.4));

  /* Token baru nature (didefinisikan statis di @theme) */
  set("--color-leaf", L);
  set("--color-leaf-deep", darken(L, 0.3));
  set("--color-soft-deep", accentFg);
  set("--color-petal", F);
  set("--color-bloom", S);
  set("--color-ivory", B);

  /* Semantic shadcn */
  set("--background", B);
  set("--foreground", ink);
  set("--card", card);
  set("--card-foreground", ink);
  set("--popover", white);
  set("--popover-foreground", ink);
  set("--primary", P);
  set("--primary-foreground", onPrimary);
  set("--secondary", tintSoft);
  set("--secondary-foreground", ink);
  set("--muted", mist);
  set("--muted-foreground", graphite);
  set("--accent", tintRose);
  set("--accent-foreground", accentFg);
  set("--destructive", secondaryDeep);
  set("--destructive-foreground", "#ffffff");
  set("--border", fog);
  set("--input", fog);
  set("--ring", S);
  set("--chart-1", P);
  set("--chart-2", S);
  set("--chart-3", L);
  set("--chart-4", primaryHover);
  set("--chart-5", secondaryDeep);

  /* Sidebar */
  set("--sidebar", white);
  set("--sidebar-foreground", ink);
  set("--sidebar-primary", P);
  set("--sidebar-primary-foreground", onPrimary);
  set("--sidebar-accent", tintSoft);
  set("--sidebar-accent-foreground", accentFg);
  set("--sidebar-border", fog);
  set("--sidebar-ring", S);

  /* Tier tint — colorful mengikuti palet */
  set("--tint-mint", tintLeaf);
  set("--tint-mint-foreground", darken(L, 0.3));
  set("--tint-lavender", tintSoft);
  set("--tint-lavender-foreground", accentFg);
  set("--tint-peach", tintWarm);
  set("--tint-peach-foreground", accentFg);
  set("--tint-rose", tintRose);
  set("--tint-rose-foreground", accentFg);
  set("--tint-sky", tintSoft);
  set("--tint-sky-foreground", accentFg);
  set("--tint-butter", tintWarm);
  set("--tint-butter-foreground", darken(S, 0.3));
  set("--tint-sage", tintLeaf);
  set("--tint-sage-foreground", darken(L, 0.3));

  set("--gold", secondaryDeep);

  /* Bayangan ber-cast warna brand (bukan abu netral) */
  const shadowSoft = `${rgba(P, 0.12)} 0px 1px 3px 0px, ${rgba(P, 0.08)} 0px 1px 2px 0px`;
  const shadowLift = `${rgba(P, 0.16)} 0px 4px 8px -2px, ${rgba(P, 0.1)} 0px 2px 4px -1px`;
  const shadowFloat = `${rgba(P, 0.22)} 4px 6px 8px -2px, ${rgba(P, 0.16)} -2px -1px 8px -2px`;
  set("--shadow-subtle", shadowSoft);
  set("--shadow-soft", shadowSoft);
  set("--shadow-sm", shadowLift);
  set("--shadow-lift", shadowLift);
  set("--shadow-sm-2", `${rgba(P, 0.1)} 0px 4px 4px 0px`);
  set("--shadow-float", shadowFloat);

  return vars;
}

/**
 * Override seluruh CSS custom property dari `:root`. Aman dipanggil berulang;
 * selalu menulis kunci yang sama sehingga hasilnya deterministik.
 */
export function applyPalette(roles: PaletteRoles): void {
  const root = document.documentElement;
  const vars = paletteVars(roles);
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
}
