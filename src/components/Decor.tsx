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

const PETALS = Array.from({ length: 16 }, (_, index) => ({
  left: (index * 6.3 + 3) % 100,
  delay: (index * 2.1) % 16,
  duration: 18 + (index % 5) * 4,
  size: 9 + (index % 5) * 4,
  drift: (index % 2 === 0 ? 1 : -1) * (26 + (index % 3) * 24),
  opacity: 0.24 + (index % 4) * 0.07,
  fill: WEDDING_FILLS[index % WEDDING_FILLS.length],
  shape: PETAL_SHAPES[index % PETAL_SHAPES.length],
}));

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
              "--petal-drift": `${petal.drift}px`,
              "--petal-opacity": petal.opacity,
            } as CSSProperties
          }
        >
          {petal.shape === "bud" ? (
            <MelatiBud fill={petal.fill} />
          ) : petal.shape === "bloom" ? (
            <MelatiBloom fill={petal.fill} />
          ) : petal.shape === "petal" ? (
            <RosePetal fill={petal.fill} />
          ) : (
            <FlowerMark className="size-full text-primary" />
          )}
        </span>
      ))}
    </div>
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
