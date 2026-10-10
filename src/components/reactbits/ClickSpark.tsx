import { useEffect, type ReactNode } from "react";

/**
 * ClickSpark — percikan cahaya saat diklik, mengikuti titik klik
 * (gaya React Bits). Hanya pada aksi beratribut data-celebrate="true":
 * tidak memicu percikan saat mengetik atau memakai form. Node dan timer
 * dibersihkan saat unmount; reduced motion tidak memicu efek.
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
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const bursts = new Set<HTMLDivElement>();
    const timers = new Set<number>();
    const handler = (event: PointerEvent) => {
      const target = event.target;
      if (reduced.matches || !event.isPrimary || event.button !== 0 ||
        !(target instanceof Element) ||
        !target.closest('[data-celebrate="true"]') ||
        typeof Element.prototype.animate !== "function") return;
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
      bursts.add(burst);
      const timer = window.setTimeout(() => {
        burst.remove(); bursts.delete(burst); timers.delete(timer);
      }, duration + 60);
      timers.add(timer);
    };

    document.addEventListener("pointerdown", handler);
    return () => {
      document.removeEventListener("pointerdown", handler);
      timers.forEach((timer) => window.clearTimeout(timer));
      bursts.forEach((burst) => burst.remove());
    };
  }, [sparks, sparkColor, sparkSize, radius, duration]);

  return children ? <>{children}</> : null;
}
