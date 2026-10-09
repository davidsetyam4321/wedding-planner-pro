import { useEffect, type ReactNode } from "react";

/**
 * ClickSpark — percikan cahaya saat diklik, mengikuti titik klik
 * (gaya React Bits). Dipasang global: mendengarkan pointerdown di document
 * dan merender percikan berumur pendek via WAAPI — ringan, tanpa state React
 * per klik.
 */
export default function ClickSpark({
  children,
  sparks = 8,
  sparkColor = "var(--color-bloom)",
  sparkSize = 22,
  radius = 34,
  duration = 480,
}: {
  children?: ReactNode;
  /** Jumlah garis percikan per klik. */
  sparks?: number;
  sparkColor?: string;
  /** Panjang tiap garis percikan, px. */
  sparkSize?: number;
  /** Jarak maksimum garis dari titik klik, px. */
  radius?: number;
  /** ms umur percikan. */
  duration?: number;
}) {
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    const handler = (event: PointerEvent) => {
      const burst = document.createElement("div");
      burst.setAttribute("aria-hidden", "true");
      burst.style.cssText =
        "position:fixed;left:0;top:0;z-index:9999;pointer-events:none;";

      for (let i = 0; i < sparks; i += 1) {
        const angle = (Math.PI * 2 * i) / sparks;
        const line = document.createElement("span");
        const startX = event.clientX + Math.cos(angle) * 6;
        const startY = event.clientY + Math.sin(angle) * 6;
        line.style.cssText = [
          "position:absolute",
          `left:${startX}px`,
          `top:${startY}px`,
          `width:${sparkSize}px`,
          "height:2px",
          `background:${sparkColor}`,
          "border-radius:2px",
          `transform:rotate(${angle}rad) scaleX(0)`,
          "transform-origin:0 50%",
          "opacity:1",
        ].join(";");
        burst.appendChild(line);

        const travel = radius - 6;
        line.animate(
          [
            {
              transform: `rotate(${angle}rad) scaleX(0.15)`,
              opacity: 1,
            },
            {
              transform: `rotate(${angle}rad) translateX(${travel}px) scaleX(1)`,
              opacity: 0,
            },
          ],
          { duration, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" },
        );
      }

      document.body.appendChild(burst);
      window.setTimeout(() => burst.remove(), duration + 60);
    };

    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [sparks, sparkColor, sparkSize, radius, duration]);

  return children ? <>{children}</> : null;
}
