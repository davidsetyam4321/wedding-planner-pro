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

const PETAL_COLORS = [
  "text-primary",
  "text-tint-rose-foreground",
  "text-tint-lavender-foreground",
  "text-tint-peach-foreground",
  "text-tint-mint-foreground",
  "text-tint-butter-foreground",
];

const PETALS = Array.from({ length: 14 }, (_, index) => ({
  left: (index * 7.1 + 3) % 100,
  delay: (index * 1.9) % 14,
  duration: 16 + (index % 5) * 3,
  size: 10 + (index % 4) * 6,
  drift: (index % 2 === 0 ? 1 : -1) * (24 + (index % 3) * 22),
  opacity: 0.16 + (index % 4) * 0.06,
  color: PETAL_COLORS[index % PETAL_COLORS.length],
}));

/** Soft petals drifting down behind the app. Purely decorative. */
export function Petals() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {PETALS.map((petal, index) => (
        <span
          key={index}
          className={`petal absolute top-0 ${petal.color}`}
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
          <FlowerMark className="size-full" />
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
