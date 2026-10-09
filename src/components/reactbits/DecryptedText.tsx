import { useEffect, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*+";

/**
 * DecryptedText — teks "didekripsi" huruf acak menuju teks aslinya
 * (gaya React Bits). Menghormati prefers-reduced-motion (langsung tampil).
 */
export default function DecryptedText({
  text,
  speed = 28,
  className = "",
}: {
  text: string;
  /** ms per langkah pengungkapan. */
  speed?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      setDisplay(text);
      return;
    }

    let frame = 0;
    const total = text.length;
    const timer = window.setInterval(() => {
      frame += 1;
      const revealed = Math.floor(frame / 2);
      setDisplay(
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < revealed) return char;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join(""),
      );
      if (revealed >= total) {
        window.clearInterval(timer);
        setDisplay(text);
      }
    }, speed);

    return () => {
      window.clearInterval(timer);
    };
  }, [text, speed]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
