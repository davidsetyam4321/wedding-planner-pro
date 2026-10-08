import { useEffect, useState, type CSSProperties } from "react";

/** A small five-petal flower drawn in currentColor. */
export function FlowerMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <ellipse cx="12" cy="5.6" rx="3.1" ry="4.9" />
      <ellipse cx="12" cy="5.6" rx="3.1" ry="4.9" transform="rotate(72 12 12)" />
      <ellipse cx="12" cy="5.6" rx="3.1" ry="4.9" transform="rotate(144 12 12)" />
      <ellipse cx="12" cy="5.6" rx="3.1" ry="4.9" transform="rotate(216 12 12)" />
      <ellipse cx="12" cy="5.6" rx="3.1" ry="4.9" transform="rotate(288 12 12)" />
      <circle cx="12" cy="12" r="2.3" fill="#ffffff" fillOpacity="0.75" />
    </svg>
  );
}

/* ── Kembang gugur ala nikahan Jawa ───────────────────────────────────
   Kuncup melati, melati mekar, kelopak mawar — sekali-sekali tanda bunga
   merek — ditaburkan jatuh pelan di belakang halaman. */

type FlowerShape = "bud" | "bloom" | "petal" | "mark";

/** Kuncup melati: putih gading dengan pangkal daun hijau. */
function MelatiBud({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full">
      <path
        d="M12 2.8c2.7 2.6 4.1 5.5 4.1 8.6 0 3.6-1.9 6.2-4.1 7.8-2.2-1.6-4.1-4.2-4.1-7.8 0-3.1 1.4-6 4.1-8.6Z"
        fill={fill}
        stroke="#ddd0b8"
        strokeWidth="0.7"
      />
      <path
        d="M8.3 16.9c1.2 2.2 2.4 3.5 3.7 4.2 1.3-.7 2.5-2 3.7-4.2-2.4 1.1-5 1.1-7.4 0Z"
        fill="#a9d9bf"
      />
    </svg>
  );
}

/** Melati mekar: lima kelopak putih dengan inti emas lembut. */
function MelatiBloom({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full">
      <g fill={fill} stroke="#ddd0b8" strokeWidth="0.6">
        <ellipse cx="12" cy="6.4" rx="2.5" ry="4" />
        <ellipse cx="12" cy="6.4" rx="2.5" ry="4" transform="rotate(72 12 12)" />
        <ellipse cx="12" cy="6.4" rx="2.5" ry="4" transform="rotate(144 12 12)" />
        <ellipse cx="12" cy="6.4" rx="2.5" ry="4" transform="rotate(216 12 12)" />
        <ellipse cx="12" cy="6.4" rx="2.5" ry="4" transform="rotate(288 12 12)" />
      </g>
      <circle cx="12" cy="12" r="2.1" fill="#e9cd8f" />
    </svg>
  );
}

/** Kelopak mawar tunggal: blush melengkung dengan urat samar. */
function RosePetal({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full">
      <path
        d="M12 2.6c4.7 3.3 7.1 7.1 7.1 10.9 0 4.3-3.2 7.4-7.1 8.4-3.9-1-7.1-4.1-7.1-8.4 0-3.8 2.4-7.6 7.1-10.9Z"
        fill={fill}
        stroke="#ddd0b8"
        strokeWidth="0.7"
      />
      <path
        d="M12 5.8c2.6 2.4 3.9 5 3.9 7.7"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="1.1"
        fill="none"
      />
    </svg>
  );
}

/** Palet nikahan Jawa: putih gading, krem, blush kembang, emas, sage. */
const WEDDING_FILLS = [
  "#fffdf6", // putih gading
  "#f7efdd", // krem
  "#ffd9d2", // blush tipis
  "#ffb6ab", // blush dalam
  "#e9cd8f", // emas lembut
  "#a9d9bf", // sage daun
];

const PETAL_SHAPES: FlowerShape[] = [
  "bud",
  "petal",
  "bloom",
  "bud",
  "petal",
  "mark",
  "bud",
  "petal",
];

const PETALS = Array.from({ length: 24 }, (_, index) => ({
  left: (index * 4.3 + 2) % 100,
  delay: (index * 2.7) % 22,
  duration: 20 + (index % 6) * 4,
  size: 12 + (index % 5) * 5,
  drift: (index % 2 === 0 ? 1 : -1) * (30 + (index % 4) * 26),
  opacity: 0.38 + (index % 4) * 0.07,
  blur: index % 4 === 0 ? 1.6 : 0,
  fill: WEDDING_FILLS[index % WEDDING_FILLS.length],
  shape: PETAL_SHAPES[index % PETAL_SHAPES.length],
}));

function renderFlower(shape: FlowerShape, fill: string) {
  if (shape === "bud") return <MelatiBud fill={fill} />;
  if (shape === "bloom") return <MelatiBloom fill={fill} />;
  if (shape === "petal") return <RosePetal fill={fill} />;
  return <FlowerMark className="size-full text-primary" />;
}

/** Kembang gugur (melati & kelopak mawar) menari pelan di belakang halaman. */
export function Petals() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {PETALS.map((petal, index) => (
        <span
          key={index}
          className="petal absolute top-0"
          style={
            {
              left: `${petal.left}%`,
              width: petal.size,
              height: petal.size,
              animationDelay: `${petal.delay}s`,
              animationDuration: `${petal.duration}s`,
              filter: petal.blur ? `blur(${petal.blur}px)` : undefined,
              "--petal-drift": `${petal.drift}px`,
              "--petal-opacity": petal.opacity,
            } as CSSProperties
          }
        >
          {renderFlower(petal.shape, petal.fill)}
        </span>
      ))}
    </div>
  );
}

const FRONT_PETALS = Array.from({ length: 8 }, (_, index) => ({
  left: (index * 12.7 + 5) % 100,
  delay: -(index * 5.5),
  duration: 30 + (index % 4) * 6,
  size: 44 + (index % 4) * 14,
  drift: (index % 2 === 0 ? 1 : -1) * (54 + (index % 3) * 30),
  opacity: 0.13 + (index % 3) * 0.05,
  blur: index % 2 === 0 ? 7 : 4,
  fill: WEDDING_FILLS[(index + 2) % WEDDING_FILLS.length],
  shape: (["petal", "bud", "bloom", "petal", "bud", "petal", "bloom", "bud"] as FlowerShape[])[index],
}));

/**
 * Lapisan bokeh kembang di DEPAN konten — kembang besar yang di-blur dan
 * sangat transparan, menari lambat seperti foto latar romantis.
 * pointer-events-none: klik tetap menembus ke konten di bawahnya.
 */
export function PetalsFront() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
    >
      {FRONT_PETALS.map((petal, index) => (
        <span
          key={index}
          className="petal absolute top-0"
          style={
            {
              left: `${petal.left}%`,
              width: petal.size,
              height: petal.size,
              animationDelay: `${petal.delay}s`,
              animationDuration: `${petal.duration}s`,
              filter: `blur(${petal.blur}px)`,
              "--petal-drift": `${petal.drift}px`,
              "--petal-opacity": petal.opacity,
            } as CSSProperties
          }
        >
          {renderFlower(petal.shape, petal.fill)}
        </span>
      ))}
    </div>
  );
}

/**
 * Rangkaian melati melengkung dengan bandul di tengah — pembatas section
 * ala hiasan pelaminan. Tali melengkung: M2010 Q2009438010.
 */
export function GarlandDivider({ className }: { className?: string }) {
  const buds = Array.from({ length: 15 }, (_, index) => {
    const t = (index + 1) / 16;
    return { x: 20 + t * 360, y: 10 + 168 * t * (1 - t) };
  });
  return (
    <svg
      viewBox="0 0 400 100"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path d="M20 10 Q200 94 380 10" stroke="#cdc1a6" strokeWidth="1.3" />
      {buds.map((bud, index) => (
        <g key={index} transform={`translate(${bud.x} ${bud.y})`}>
          <ellipse
            cx="0"
            cy="5.4"
            rx="2.7"
            ry="4.3"
            fill="#fffdf6"
            stroke="#ddd0b8"
            strokeWidth="0.6"
          />
          <ellipse cx="0" cy="9.6" rx="1.7" ry="1.1" fill="#a9d9bf" />
        </g>
      ))}
      {/* bandul tengah: untaian + kuncup besar + untaian emas */}
      <path d="M200 52 v14" stroke="#cdc1a6" strokeWidth="1.3" />
      <circle cx="200" cy="69" r="2.6" fill="#e9cd8f" />
      <ellipse
        cx="200"
        cy="80"
        rx="5"
        ry="7.4"
        fill="#fffdf6"
        stroke="#ddd0b8"
        strokeWidth="0.7"
      />
      <path d="M200 87.5 v6 M196 87 v5 M204 87 v5" stroke="#cdc1a6" strokeWidth="1.1" strokeLinecap="round" />
      {/* daun sage di kedua sisi bandul */}
      <path d="M188 64 q6 4 10 2 M212 64 q-6 4 -10 2" stroke="#a9d9bf" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Bandul melati menggantung — ornamen vertikal ala pelaminan. */
export function MelatiBandul({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 100"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path d="M32 3 v14" stroke="#c9bfa8" strokeWidth="1.4" />
      <ellipse cx="28" cy="24" rx="3" ry="4.8" fill="#fffdf6" stroke="#ddd0b8" strokeWidth="0.6" />
      <ellipse cx="36" cy="34" rx="3" ry="4.8" fill="#fffdf6" stroke="#ddd0b8" strokeWidth="0.6" />
      <ellipse cx="28" cy="44" rx="3" ry="4.8" fill="#f7efdd" stroke="#ddd0b8" strokeWidth="0.6" />
      <ellipse cx="36" cy="54" rx="3" ry="4.8" fill="#ffd9d2" stroke="#ddd0b8" strokeWidth="0.6" />
      {/* janur melingkar di sisi */}
      <path d="M22 30 q-4 8 2 14" stroke="#a9d9bf" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 30 q4 8 -2 14" stroke="#a9d9bf" strokeWidth="1.5" strokeLinecap="round" />
      {/* gugusan melati bawah */}
      <ellipse cx="32" cy="68" rx="4.6" ry="6.8" fill="#fffdf6" stroke="#ddd0b8" strokeWidth="0.7" />
      <ellipse cx="23" cy="74" rx="3.4" ry="5.2" fill="#f7efdd" stroke="#ddd0b8" strokeWidth="0.6" />
      <ellipse cx="41" cy="74" rx="3.4" ry="5.2" fill="#fffdf6" stroke="#ddd0b8" strokeWidth="0.6" />
      <circle cx="32" cy="84" r="2.6" fill="#e9cd8f" />
      <path d="M32 87 v8 M27 87 v6 M37 87 v6" stroke="#c9bfa8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

type BloomItem = {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  size: number;
  rotation: number;
  color: string;
};

const BLOOM_COLORS = [
  "text-primary",
  "text-tint-peach-foreground",
  "text-tint-rose-foreground",
  "text-tint-lavender-foreground",
  "text-tint-mint-foreground",
  "text-tint-butter-foreground",
];

const BLOOM_EVENT = "planner-bloom";

/** Fires a petal burst wherever an action succeeds (see src/lib/bloom.ts). */
export function BloomOverlay() {
  const [items, setItems] = useState<BloomItem[]>([]);

  useEffect(() => {
    const handleBloom = () => {
      const stamp = Date.now();
      const burst: BloomItem[] = Array.from({ length: 9 }, (_, index) => {
        const angle = -160 + index * 18;
        const distance = 70 + Math.round(Math.random() * 90);
        return {
          id: stamp + index,
          x: 50,
          y: 58,
          tx: Math.round(Math.cos((angle * Math.PI) / 180) * distance),
          ty: Math.round(Math.sin((angle * Math.PI) / 180) * distance * 0.55),
          size: 18 + Math.round(Math.random() * 16),
          rotation: angle,
          color: BLOOM_COLORS[index % BLOOM_COLORS.length],
        };
      });

      setItems((previous) => [...previous, ...burst]);
      window.setTimeout(() => {
        const ids = new Set(burst.map((item) => item.id));
        setItems((previous) => previous.filter((item) => !ids.has(item.id)));
      }, 1400);
    };

    window.addEventListener(BLOOM_EVENT, handleBloom);
    return () => window.removeEventListener(BLOOM_EVENT, handleBloom);
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {items.map((item) => (
        <span
          key={item.id}
          className={`bloom-flower absolute ${item.color}`}
          style={
            {
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: item.size,
              height: item.size,
              "--tx": `${item.tx}px`,
              "--ty": `${item.ty}px`,
            } as CSSProperties
          }
        >
          <FlowerMark className="size-full" />
        </span>
      ))}
    </div>
  );
}

/* ── Motif tradisional (bukan doodle) — geometri kawung/ceplok ─────── */

/**
 * Rosette kawung/ceplok kuningan — ornamen sudut pengganti stiker lama.
 * Murni geometri motif batik: kelopak bulat mengelilingi inti cokelat.
 */
export function SekarSudut({ className }: { className?: string }) {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {angles.map((angle) => (
        <ellipse
          key={angle}
          cx="20"
          cy="9"
          rx="4.2"
          ry="7"
          fill="none"
          stroke="#a5854a"
          strokeWidth="1.1"
          opacity="0.85"
          transform={`rotate(${angle} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="5" fill="none" stroke="#a5854a" strokeWidth="1.1" />
      <circle cx="20" cy="20" r="1.8" fill="#a5854a" />
    </svg>
  );
}

/**
 * Pembatas motif — dua garis kuningan dengan deretan kawung kecil dan
 * kuncup melati di tengah. Pembuka tiap halaman ala pelaminan.
 */
export function MotifDivider({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 40"
      className={className}
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* dua garis emas antik tipis — gaya rule premium */}
      <path d="M8 14 H392" stroke="#a5854a" strokeWidth="1" opacity="0.7" />
      <path d="M8 26 H392" stroke="#a5854a" strokeWidth="1" opacity="0.35" />
      {/* belah ketupat kecil di tengah */}
      <path
        d="M200 10 L206 20 L200 30 L194 20 Z"
        fill="none"
        stroke="#a5854a"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="200" cy="20" r="1.6" fill="#a5854a" />
    </svg>
  );
}
