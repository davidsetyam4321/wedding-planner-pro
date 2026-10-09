import { useRef, type CSSProperties, type ReactNode } from "react";

/**
 * GlareHover — sapuan cahaya melingkar yang mengikuti kursor saat hover
 * (gaya React Bits). Warna cahaya bisa memakai CSS variable palet.
 */
export default function GlareHover({
  children,
  className = "",
  glareColor = "var(--color-cloud-white)",
  glareSize = 260,
  transitionDuration = 550,
}: {
  children: ReactNode;
  className?: string;
  glareColor?: string;
  glareSize?: number;
  transitionDuration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--y", `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={`glare-hover ${className}`}
      style={
        {
          "--glare-color": glareColor,
          "--glare-size": `${glareSize}px`,
          "--glare-fade": `${transitionDuration}ms`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
