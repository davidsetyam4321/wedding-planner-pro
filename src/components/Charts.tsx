import { cn } from "@/lib/utils";
import { useId, type ReactNode } from "react";

/**
 * Palet grafik SatuJanji: inkwell navy → coral emphasis (sumber tunggal
 * untuk semua halaman — donut Budget, bar Tabungan, dst).
 */
export const CHART_COLORS = [
  "#3a2317",
  "#b4553a",
  "#7a6247",
  "#d8b45c",
  "#8fa756",
  "#ff8f8f",
  "#3f4d6e",
  "#d7f5ea",
];

type TipRow = {
  name?: string | number;
  value?: number | string;
  color?: string;
};

/**
 * Tooltip recharts bergaya kaca SatuJanji — dipakai semua grafik lewat
 * `<Tooltip content={<ChartTip format={...} />} />`.
 */
export function ChartTip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: TipRow[];
  label?: string | number;
  /** Dipanggil hanya untuk nilai numerik. */
  format?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/80 bg-white/85 px-3 py-2 text-xs shadow-[0_12px_28px_-10px_rgba(13,92,150,0.35)] backdrop-blur-md">
      {label !== undefined && label !== "" && (
        <p className="label text-muted-foreground">{label}</p>
      )}
      <ul
        className={cn(
          "space-y-0.5",
          label !== undefined && label !== "" && "mt-1",
        )}
      >
        {payload.map((row, index) => (
          <li key={index} className="flex items-center gap-2">
            {row.color && (
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
              />
            )}
            <span className="font-semibold">{row.name}</span>
            <span className="num ml-auto font-bold">
              {format && typeof row.value === "number"
                ? format(row.value)
                : (row.value ?? "")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Section grafik konsisten: kartu `.clay` dengan judul + meta/aksi. */
export function ChartCard({
  title,
  meta,
  action,
  children,
  className,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("clay p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="h-card">{title}</h2>
        {action ?? (meta ? <span className="meta">{meta}</span> : null)}
      </div>
      {children}
    </section>
  );
}

/**
 * Gauge cincin SVG (gradien sage → champagne) untuk ringkasan interaktif
 * di Beranda. Id gradien unik per instan (aman dipakai banyak).
 */
export function RingGauge({
  value,
  size = 76,
  stroke = 7,
  label,
  caption,
}: {
  value: number;
  size?: number;
  stroke?: number;
  /** Isian tengah; bila kosong menampilkan persen. */
  label?: ReactNode;
  caption?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const gradId = `sj-gauge-${uid}`;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3a2317" />
              <stop offset="100%" stopColor="#b4553a" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-fog"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            className="transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {label ?? <span className="num text-sm font-extrabold">{pct}%</span>}
        </div>
      </div>
      {caption && (
        <span className="text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {caption}
        </span>
      )}
    </div>
  );
}
