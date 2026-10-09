import type { ReactNode } from "react";

/**
 * StarBorder — bingkai cahaya berputar mengelilingi anaknya
 * (gaya React Bits "Star Border"). Dipakai di sekitar tombol utama:
 * ` <StarBorder><Button …/></StarBorder> `.
 */
export default function StarBorder({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`star-border ${className}`}>{children}</span>;
}
