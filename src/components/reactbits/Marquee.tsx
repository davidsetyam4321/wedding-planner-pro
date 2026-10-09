import { Fragment, type CSSProperties, type ReactNode } from "react";

/**
 * Marquee — deret elemen berjalan tanpa jeda (gaya React Bits).
 * Konten diduplikasi untuk putaran mulus; hover menjeda.
 */
export default function Marquee({
  children,
  speed = 38,
  gap = 16,
  reverse = false,
  pauseOnHover = true,
  className = "",
}: {
  children: ReactNode;
  /** Detik per putaran penuh. */
  speed?: number;
  /** Jarak antar anak, px. */
  gap?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`marquee ${pauseOnHover ? "marquee--hover-pause" : ""} ${reverse ? "marquee--reverse" : ""} ${className}`}
      style={
        {
          "--marquee-speed": `${speed}s`,
          "--marquee-gap": `${gap}px`,
        } as CSSProperties
      }
    >
      <div className="marquee__track">
        {[0, 1].map((copy) => (
          <Fragment key={copy}>
            <div className="flex shrink-0 items-stretch" style={{ gap }}>
              {children}
            </div>
            {/* Salinan untuk putaran mulus — disembunyikan dari pembaca layar */}
            <div
              aria-hidden="true"
              className="flex shrink-0 items-stretch"
              style={{ gap }}
            >
              {children}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
