import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

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
  const callbacks = useRef({ onStart, onEnd });
  useEffect(() => { callbacks.current = { onStart, onEnd }; }, [onStart, onEnd]);

  const format = (value: number) => {
    const text = new Intl.NumberFormat("en-US", {
      useGrouping: Boolean(separator),
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(value);
    return separator ? text.replace(/,/g, separator) : text;
  };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const render = (value: number) => {
      latestValue.current = value;
      const text = new Intl.NumberFormat("en-US", {
        useGrouping: Boolean(separator),
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(value);
      element.textContent = separator ? text.replace(/,/g, separator) : text;
    };
    if (reducedMotion) { render(target); return; }
    if (!inView || !startWhen) return;
    const controls = animate(latestValue.current, target, {
      duration: Math.max(0, duration), delay: Math.max(0, delay), ease: "easeOut",
      onPlay: () => callbacks.current.onStart?.(),
      onUpdate: render,
      onComplete: () => { render(target); callbacks.current.onEnd?.(); },
    });
    return () => controls.stop();
  }, [target, precision, separator, reducedMotion, inView, startWhen, duration, delay]);

  return (
    <span className={className}>
      <span className="sr-only">{format(target)}</span>
      <span ref={ref} aria-hidden="true">{format(reducedMotion ? target : latestValue.current)}</span>
    </span>
  );
}
