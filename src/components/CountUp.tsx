import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

function formatValue(value: number, precision: number, separator: string) {
  const text = new Intl.NumberFormat("en-US", {
    useGrouping: Boolean(separator),
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
  return separator ? text.replace(/,/g, separator) : text;
}

export default function CountUp({
  to, from = 0, direction = "up", delay = 0, duration = 0.8,
  className = "", startWhen = true, separator = "", onStart, onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const latestValue = useRef(direction === "down" ? to : from);
  const reducedMotion = useReducedMotion();
  const inView = useInView(ref, { once: true });
  const target = direction === "down" ? from : to;
  const precision = Math.max(
    (String(to).split(".")[1] ?? "").length,
    (String(from).split(".")[1] ?? "").length,
  );
  // Nilai yang sudah menetap — dipakai saat React merender ulang. Selama
  // animasi berjalan, teks ditulis langsung ke node supaya tidak ada render
  // per frame.
  const [settled, setSettled] = useState(() =>
    formatValue(direction === "down" ? to : from, precision, separator),
  );
  const callbacks = useRef({ onStart, onEnd });
  useEffect(() => { callbacks.current = { onStart, onEnd }; }, [onStart, onEnd]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const render = (value: number) => {
      latestValue.current = value;
      element.textContent = formatValue(value, precision, separator);
    };
    if (reducedMotion) return;
    if (!inView || !startWhen) return;
    const controls = animate(latestValue.current, target, {
      duration: Math.max(0, duration), delay: Math.max(0, delay), ease: "easeOut",
      onPlay: () => callbacks.current.onStart?.(),
      onUpdate: render,
      onComplete: () => {
        render(target);
        setSettled(formatValue(target, precision, separator));
        callbacks.current.onEnd?.();
      },
    });
    return () => controls.stop();
  }, [target, precision, separator, reducedMotion, inView, startWhen, duration, delay]);

  return (
    <span className={className}>
      <span className="sr-only">{formatValue(target, precision, separator)}</span>
      <span ref={ref} aria-hidden="true">
        {reducedMotion ? formatValue(target, precision, separator) : settled}
      </span>
    </span>
  );
}
