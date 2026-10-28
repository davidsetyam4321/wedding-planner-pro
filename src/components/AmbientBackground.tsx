import { useEffect, useRef } from "react";

/**
 * Atmosfer global berlapis — pengganti latar datar.
 *
 * Layer 1: aurora mesh dari token palet aktif (brand, accent, positive, paper),
 *          bergerak lambat 19–25 detik, hanya transform.
 * Layer 2: spotlight kursor (desktop saja) yang menulis dua CSS variable,
 *          di-throttle lewat requestAnimationFrame supaya tidak memicu render.
 * Layer 3: grain halus + geometri kawung besar yang bernapas di tepi atas.
 *
 * Semua efek berhenti saat tab tersembunyi, saat toggle "Efek visual dan
 * animasi" dimatikan, atau saat pengguna meminta gerak minimal.
 */
export function AmbientBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let frame = 0;
    let nextX = 0;
    let nextY = 0;

    const paint = () => {
      frame = 0;
      node.style.setProperty("--mouse-x", `${nextX}px`);
      node.style.setProperty("--mouse-y", `${nextY}px`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (document.documentElement.dataset.effects === "off") return;
      nextX = event.clientX;
      nextY = event.clientY;
      node.dataset.awake = "true";
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    const handleVisibility = () => {
      node.dataset.paused = document.visibilityState === "hidden" ? "true" : "false";
    };

    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (finePointer && !reducedMotion) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div ref={ref} className="ambient" aria-hidden="true">
      <div className="ambient__wash" />
      <div className="ambient__blob ambient__blob--brand" />
      <div className="ambient__blob ambient__blob--accent" />
      <div className="ambient__blob ambient__blob--sage" />
      <div className="ambient__blob ambient__blob--paper" />
      <div className="ambient__batik" />
      <div className="ambient__spotlight" />
      <div className="ambient__grain" />
    </div>
  );
}
