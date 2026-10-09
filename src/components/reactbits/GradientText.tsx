import type { CSSProperties, ReactNode } from "react";

/**
 * GradientText — teks bergradien berjalan (gaya React Bits).
 * Gradien default memakai warna palet (midnight-navy → bloom → leaf),
 * jadi ikut berubah saat pengguna mengganti palet.
 */
export default function GradientText({
  children,
  className = "",
  gradient,
  speed = 7,
}: {
  children: ReactNode;
  className?: string;
  /** Override gradien CSS (default: gradasi brand dari palet). */
  gradient?: string;
  /** Detik per satu putaran gradien. */
  speed?: number;
}) {
  const gradientValue =
    gradient ??
    "linear-gradient(110deg, var(--color-midnight-navy) 0%, var(--color-bloom) 32%, var(--color-leaf) 66%, var(--color-midnight-navy) 100%)";
  return (
    <span
      className={`gradient-text ${className}`}
      style={
        {
          "--gradient-value": gradientValue,
          "--gradient-speed": `${speed}s`,
        } as CSSProperties
      }
    >
      {children}
    </span>
  );
}
