/**
 * Membuat ikon PWA (192/512 + maskable) dan gambar Open Graph tanpa
 * dependensi: rasterizer sederhana + encoder PNG memakai zlib bawaan Node.
 *
 * Jalankan: `bun scripts/generate-icons.mjs`
 *
 * Gambarnya sengaja dibuat geometris (gradien hijau + dua cincin emas sebagai
 * simbol janji pernikahan) supaya bisa dirender tanpa font atau library.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

// ── Encoder PNG ────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Gambar ────────────────────────────────────────────────────────────────
// Palet sama dengan foto pelaminan: drapery hijau tua → backdrop maroon,
// dua cincin (emas + blush) sebagai simbol janji.
const FOREST = [38, 64, 47];
const MAROON = [112, 18, 32];
const GOLD = [214, 176, 106];
const GOLD_LIGHT = [240, 213, 158];
const BLUSH = [243, 196, 204];

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/**
 * Dua cincin emas bertaut (simbol janji) di atas latar gradien hijau.
 * `scale` mengatur besar cincin relatif terhadap sisi terpendek.
 */
function renderMark(width, height, scale) {
  const pixels = new Uint8Array(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const base = Math.min(width, height);
  const radius = base * scale;
  const thickness = Math.max(1.5, base * 0.055);
  const offset = radius * 0.6;
  const rings = [
    { x: cx - offset, y: cy },
    { x: cx + offset, y: cy },
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Gradien diagonal + sedikit gelap di tepi supaya tidak datar.
      const diagonal = (x / width + y / height) / 2;
      const edge = Math.min(
        Math.min(x, width - 1 - x) / width,
        Math.min(y, height - 1 - y) / height,
      );
      let color = mix(FOREST, MAROON, clamp01(diagonal - edge * 0.35));

      for (const [index, ring] of rings.entries()) {
        const distance = Math.hypot(x + 0.5 - ring.x, y + 0.5 - ring.y);
        const coverage = clamp01(
          0.5 - (Math.abs(distance - radius) - thickness / 2),
        );
        if (coverage > 0) {
          const ink =
            index === 0
              ? mix(GOLD, GOLD_LIGHT, clamp01(1 - distance / (radius * 2)))
              : BLUSH;
          color = mix(color, ink, coverage * 0.96);
        }
      }

      const index = (y * width + x) * 4;
      pixels[index] = Math.round(color[0]);
      pixels[index + 1] = Math.round(color[1]);
      pixels[index + 2] = Math.round(color[2]);
      pixels[index + 3] = 255;
    }
  }

  return encodePng(width, height, pixels);
}

// ── Keluaran ──────────────────────────────────────────────────────────────
// Ikon `any` memakai cincin lebih besar; ikon maskable wajib menyisakan ruang
// aman 20% di tepi, jadi gambarnya diperkecil (aman dari pemangkasan bentuk).
const targets = [
  { file: "public/icons/icon-192.png", width: 192, height: 192, scale: 0.2 },
  { file: "public/icons/icon-512.png", width: 512, height: 512, scale: 0.2 },
  { file: "public/icons/maskable-512.png", width: 512, height: 512, scale: 0.15 },
  { file: "public/icons/apple-touch-icon.png", width: 180, height: 180, scale: 0.2 },
  { file: "public/og-image.png", width: 1200, height: 630, scale: 0.26 },
];

mkdirSync("public/icons", { recursive: true });
for (const target of targets) {
  const png = renderMark(target.width, target.height, target.scale);
  writeFileSync(target.file, png);
  console.log(
    `${target.file} — ${target.width}x${target.height} (${Math.round(png.length / 1024)} KB)`,
  );
}
