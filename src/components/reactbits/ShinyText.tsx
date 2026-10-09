import type { CSSProperties } from "react";

/**
 * ShinyText — kilau gradien berjalan di atas teks (gaya React Bits).
 * Gradien memakai `currentColor`, jadi otomatis mengikuti warna teks & palet.
 */
export default function ShinyText({
  text,
  speed = 4.5,
  className = "",
}: {
  text: string;
  /** Detik per satu putaran kilau. */
  speed?: number;
  className?: string;
}) {
  return (
    <span
      className={`shiny-text ${className}`}
      style={{ "--shiny-speed": `${speed}s` } as CSSProperties}
    >
      {text}
    </span>
  );
}
