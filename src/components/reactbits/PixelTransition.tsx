import { useEffect, useMemo, useState } from "react";

const COLS = 12;
const ROWS = 8;
const COUNT = COLS * ROWS;

/**
 * PixelTransition — foto terungkap lewat blok piksel bertahap
 * (gaya React Bits). Tiga fase: blok menutup → foto muncul → blok
 * mencair berurutan. Cocok untuk foto pasangan.
 */
export default function PixelTransition({
  src,
  alt,
  className = "",
  duration = 560,
}: {
  src: string;
  alt: string;
  className?: string;
  /** ms rentang pencairan blok. */
  duration?: number;
}) {
  const [phase, setPhase] = useState<"cover" | "reveal" | "done">("cover");
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reducedMotion) return;
    const showPhoto = window.setTimeout(() => setPhase("reveal"), 140);
    const finish = window.setTimeout(
      () => setPhase("done"),
      140 + duration + 520,
    );
    return () => {
      window.clearTimeout(showPhoto);
      window.clearTimeout(finish);
    };
  }, [src, duration, reducedMotion]);

  // Urutan blok deterministik per src — konsisten di setiap muat.
  const order = useMemo(() => {
    const seed = src.length * 17 + 7;
    return Array.from({ length: COUNT }, (_, index) => index).sort(
      (a, b) => ((a * 37 + seed) % 101) - ((b * 37 + seed) % 101),
    );
  }, [src]);

  const grid = {
    gridTemplateColumns: `repeat(${COLS}, 1fr)`,
    gridTemplateRows: `repeat(${ROWS}, 1fr)`,
  } as const;

  const renderBlocks = (variant: "in" | "out") => (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 grid ${variant === "out" ? "pixel-out-layer" : ""}`}
      style={grid}
    >
      {order.map((index) => (
        <span
          key={index}
          className={variant === "in" ? "pixel-block" : "pixel-block pixel-block--out"}
          style={{
            backgroundColor: "var(--color-mist-gray)",
            animationDelay: `${(index / order.length) * duration}ms`,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        style={{
          opacity: phase === "cover" ? 0 : 1,
          transition: "opacity 220ms ease",
        }}
      />
      {!reducedMotion && phase === "cover" && renderBlocks("in")}
      {!reducedMotion && phase === "reveal" && renderBlocks("out")}
    </div>
  );
}
