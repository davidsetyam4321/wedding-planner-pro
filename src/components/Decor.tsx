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
      <circle cx="12" cy="12" r="2.3" fill="var(--color-cloud-white)" fillOpacity="0.75" />
    </svg>
  );
}

/** Tunas dua daun — aksen botanikal ringan. */
export function SprigMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 21 C 12 15, 12.6 9, 16.4 3.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M13 12.4 C 9.8 12.8, 7.4 11, 6.8 8.4 C 10 7.8, 12.4 9.6, 13 12.4 Z"
        fill="currentColor"
      />
      <path
        d="M14.4 8.2 C 12 7, 10.8 4.6, 11.4 2.4 C 14 3.2, 15.2 5.6, 14.4 8.2 Z"
        fill="currentColor"
      />
      <path
        d="M12.6 16 C 10.2 17, 7.4 16, 6.4 13.8 C 9.2 13, 11.8 14, 12.6 16 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Dua cincin bertaut + bintang kecil — simbol janji pernikahan. */
export function RingsMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="9.4" cy="13.6" r="5.1" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="15.2" cy="10.8" r="5.1" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M15.2 2.6 L 16.3 4.7 L 18.6 5.1 L 16.9 6.7 L 17.3 9 L 15.2 7.9 L 13.1 9 L 13.5 6.7 L 11.8 5.1 L 14.1 4.7 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Mahkota daun bundar — untuk empty state & penutup. */
export function WreathMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="13.6"
        r="7.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeDasharray="2.6 3.2"
      />
      <path
        d="M12 2.4 C 14.8 4.2, 15.2 6.8, 12 8.6 C 8.8 6.8, 9.2 4.2, 12 2.4 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Buket mini — tiga kembang bertangkai. */
export function BouquetMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 13.4 L12 20.6" />
        <path d="M9.2 12.2 C 7.7 14.6, 7.2 17.6, 7.8 20.2" />
        <path d="M14.8 12.2 C 16.3 14.6, 16.8 17.6, 16.2 20.2" />
      </g>
      <circle cx="8" cy="9.2" r="3" fill="currentColor" />
      <circle cx="16" cy="9.8" r="2.6" fill="currentColor" />
      <circle cx="12" cy="6.2" r="3.2" fill="currentColor" />
    </svg>
  );
}

/** Ranting daun melengkung — ornamen pemisah. */
export function BranchMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M3 18 C 8 16.6, 14.4 13, 21 6.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7.6 15.4 C 7 12.8, 8.4 10.6, 10.6 10 C 11.2 12.6, 9.8 14.8, 7.6 15.4 Z"
        fill="currentColor"
      />
      <path
        d="M13.2 11.8 C 13.4 9.2, 15.2 7.4, 17.4 7.4 C 17.2 10, 15.4 11.8, 13.2 11.8 Z"
        fill="currentColor"
      />
      <path
        d="M4.8 17.6 C 3.4 15.6, 4 13.2, 5.6 12 C 7 14, 6.4 16.4, 4.8 17.6 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Burung kecil di angkasa — siluet minimal Cora. */
export function BirdMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 16"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path
        d="M2 12 C 8 4, 12 4, 16 9 C 20 4, 24 4, 30 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Kembang & daun gugur (tema nature) ─────────────────────────── */

type FallerShape = "bloom" | "leaf" | "bouquet" | "petal" | "mark";

/** Kembang lima kelopak dalam warna solid — pengganti awan. */
function SoftBloom({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full">
      <g fill={fill}>
        <ellipse cx="12" cy="6.4" rx="3.4" ry="4.6" />
        <ellipse cx="12" cy="6.4" rx="3.4" ry="4.6" transform="rotate(72 12 12)" />
        <ellipse cx="12" cy="6.4" rx="3.4" ry="4.6" transform="rotate(144 12 12)" />
        <ellipse cx="12" cy="6.4" rx="3.4" ry="4.6" transform="rotate(216 12 12)" />
        <ellipse cx="12" cy="6.4" rx="3.4" ry="4.6" transform="rotate(288 12 12)" />
      </g>
      <circle cx="12" cy="12" r="2.6" fill="var(--color-bloom)" fillOpacity="0.55" />
    </svg>
  );
}

/** Daun runcing dengan tulang daun tipis. */
function LeafMark({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full">
      <path d="M12 2 C 18 7, 19 14, 12 22 C 5 14, 6 7, 12 2 Z" fill={fill} />
      <path
        d="M12 4 L12 20"
        stroke="var(--color-cloud-white)"
        strokeOpacity="0.55"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Buket mini — tiga kembang kecil bertangkai daun. */
function MiniBouquet({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full">
      <g fill="var(--color-leaf)" fillOpacity="0.9">
        <path d="M9 14 C 6 16, 5 19, 6 21 C 8 20, 9 17, 9 14 Z" />
        <path d="M15 14 C 18 16, 19 19, 18 21 C 16 20, 15 17, 15 14 Z" />
      </g>
      <path
        d="M12 13 L12 20"
        stroke="var(--color-leaf)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="8" cy="9" r="3.4" fill={fill} />
      <circle cx="16" cy="9.5" r="3" fill={fill} />
      <circle cx="12" cy="6" r="3.6" fill={fill} />
    </svg>
  );
}

/** Kelopak putih tunggal — dipertahankan agar ritual "bloom" tetap hidup. */
function WhitePetal({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-full">
      <path
        d="M12 2.6c4.7 3.3 7.1 7.1 7.1 10.9 0 4.3-3.2 7.4-7.1 8.4-3.9-1-7.1-4.1-7.1-8.4 0-3.8 2.4-7.6 7.1-10.9Z"
        fill={fill}
        fillOpacity="0.85"
      />
    </svg>
  );
}

/** Warna kembang gugur — tint palet lewat CSS variable. */
const NATURE_FILLS = [
  "var(--color-petal)",
  "var(--color-berry-tint)",
  "var(--color-cloud-white)",
  "var(--color-sky-tint)",
  "var(--color-tint-mint)",
];

const FALLER_SHAPES: FallerShape[] = [
  "bloom",
  "petal",
  "leaf",
  "bloom",
  "bouquet",
  "mark",
  "leaf",
  "petal",
];

const FALLERS = Array.from({ length: 18 }, (_, index) => ({
  left: (index * 5.7 + 2) % 100,
  delay: (index * 2.7) % 22,
  duration: 22 + (index % 6) * 4,
  size: 14 + (index % 5) * 5,
  drift: (index % 2 === 0 ? 1 : -1) * (30 + (index % 4) * 26),
  opacity: 0.18 + (index % 4) * 0.05,
  blur: index % 4 === 0 ? 1.6 : 0,
  fill: NATURE_FILLS[index % NATURE_FILLS.length],
  shape: FALLER_SHAPES[index % FALLER_SHAPES.length],
}));

function renderFaller(shape: FallerShape, fill: string) {
  if (shape === "bloom") return <SoftBloom fill={fill} />;
  if (shape === "leaf") return <LeafMark fill={fill} />;
  if (shape === "bouquet") return <MiniBouquet fill={fill} />;
  if (shape === "petal") return <WhitePetal fill={fill} />;
  return <FlowerMark className="size-full text-primary/20" />;
}

/** Kembang & daun jatuh perlahan di belakang halaman — sangat samar. */
export function Petals() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {FALLERS.map((faller, index) => (
        <span
          key={index}
          className="petal absolute top-0"
          style={
            {
              left: `${faller.left}%`,
              width: faller.size * 1.4,
              height: faller.size,
              animationDelay: `${faller.delay}s`,
              animationDuration: `${faller.duration}s`,
              filter: faller.blur ? `blur(${faller.blur}px)` : undefined,
              "--petal-drift": `${faller.drift}px`,
              "--petal-opacity": faller.opacity,
            } as CSSProperties
          }
        >
          {renderFaller(faller.shape, faller.fill)}
        </span>
      ))}
    </div>
  );
}

const FRONT_FALLERS = Array.from({ length: 6 }, (_, index) => ({
  left: (index * 16.7 + 5) % 100,
  delay: -(index * 5.5),
  duration: 34 + (index % 4) * 6,
  size: 46 + (index % 4) * 14,
  drift: (index % 2 === 0 ? 1 : -1) * (54 + (index % 3) * 30),
  opacity: 0.08 + (index % 3) * 0.03,
  blur: index % 2 === 0 ? 7 : 4,
  fill: NATURE_FILLS[(index + 2) % NATURE_FILLS.length],
}));

/**
 * Lapisan bokeh kembang di DEPAN konten — besar, blur, sangat transparan.
 * pointer-events-none: klik tetap menembus ke konten di bawahnya.
 */
export function PetalsFront() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
    >
      {FRONT_FALLERS.map((faller, index) => (
        <span
          key={index}
          className="petal absolute top-0"
          style={
            {
              left: `${faller.left}%`,
              width: faller.size * 1.6,
              height: faller.size,
              animationDelay: `${faller.delay}s`,
              animationDuration: `${faller.duration}s`,
              filter: `blur(${faller.blur}px)`,
              "--petal-drift": `${faller.drift}px`,
              "--petal-opacity": faller.opacity,
            } as CSSProperties
          }
        >
          {renderFaller("bouquet", faller.fill)}
        </span>
      ))}
    </div>
  );
}

/**
 * Garis pemisah hairline Cora — satu garis #dadada dengan titik atmosphere
 * biru di tengah. Pengganti GarlandDivider.
 */
export function GarlandDivider({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 40"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path d="M8 20 H190" stroke="var(--color-fog)" strokeWidth="1" />
      <path d="M210 20 H392" stroke="var(--color-fog)" strokeWidth="1" />
      <circle cx="200" cy="20" r="3" stroke="var(--color-atmosphere-blue)" strokeWidth="1.4" />
    </svg>
  );
}

/** Awan kecil menggantung — ornamen vertikal minimal. */
export function MelatiBandul({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 100"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path d="M32 3 v14" stroke="var(--color-fog)" strokeWidth="1.2" />
      <g fill="var(--color-sky-tint)">
        <ellipse cx="24" cy="30" rx="10" ry="7.5" />
        <ellipse cx="38" cy="40" rx="11" ry="8.5" />
        <ellipse cx="30" cy="52" rx="12" ry="9" />
      </g>
      <path d="M28 62 q4 4 8 0" stroke="var(--color-atmosphere-blue)" strokeWidth="1.4" strokeLinecap="round" />
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
  "text-cerulean-sky",
  "text-atmosphere-blue",
  "text-midnight-navy",
  "text-deep-cerulean",
  "text-berry-red",
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

/* ── Ornamen Cora (pengganti motif Jawa) ─────────────────────────────── */

/**
 * Rosette kawung lama diganti stempel bunga — satu-satunya aksen berry.
 * Dipakai sebagai badge kecil dan penanda penting.
 */
export function SekarSudut({ className }: { className?: string }) {
  return <FlowerMark className={className} />;
}

/**
 * Pembatas section: hairline #dadada dengan berlian atmosphere di tengah —
 * rule premium 1px, tanpa motif.
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
      <path d="M8 20 H188" stroke="var(--color-fog)" strokeWidth="1" />
      <path d="M212 20 H392" stroke="var(--color-fog)" strokeWidth="1" />
      <path
        d="M200 13 L207 20 L200 27 L193 20 Z"
        fill="none"
        stroke="var(--color-atmosphere-blue)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
