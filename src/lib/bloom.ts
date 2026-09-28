/**
 * Triggers the flower-bloom celebration rendered by <BloomOverlay />.
 * Safe to call anywhere: it no-ops on the server and when the visitor asked
 * for reduced motion.
 */
export function bloom(): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  window.dispatchEvent(new CustomEvent("planner-bloom"));
}
