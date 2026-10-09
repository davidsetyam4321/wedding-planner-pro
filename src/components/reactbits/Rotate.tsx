import { useEffect, useRef, type ReactNode } from "react";

/**
 * Rotate — kartu miring 3D mengikuti kursor (gaya React Bits).
 * Otomatis nonaktif saat pengguna meminta reduced-motion.
 */
export default function Rotate({
  children,
  className = "",
  maxRotateX = 10,
  maxRotateY = 12,
  scale = 1.02,
  speed = 420,
}: {
  children: ReactNode;
  className?: string;
  maxRotateX?: number;
  maxRotateY?: number;
  scale?: number;
  /** ms transisi mengikuti kursor. */
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || reducedRef.current) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * maxRotateX).toFixed(2)}deg) rotateY(${(px * maxRotateY).toFixed(2)}deg) scale(${scale})`;
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  return (
    <div className={`perspective-host ${className}`}>
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        className="rotate-tilt"
        style={{ transition: `transform ${speed}ms cubic-bezier(0.2, 0.8, 0.2, 1)` }}
      >
        {children}
      </div>
    </div>
  );
}
