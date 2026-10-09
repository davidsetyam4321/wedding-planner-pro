import { useEffect, useState } from "react";

/** Bintang kilau kecil mengikuti maskot — murni dekoratif. */
function DoodleStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2 C 13 8, 16 11, 22 12 C 16 13, 13 16, 12 22 C 11 16, 8 13, 2 12 C 8 11, 11 8, 12 2 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Kelinci doodle garis navy — maskot beranda. */
function Bunny({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 130" fill="none" aria-hidden="true">
      <path d="M42 58 C 34 36, 33 14, 44 8 C 55 3, 59 24, 55 50" fill="#ffffff" stroke="var(--color-midnight-navy)" strokeWidth="4" strokeLinecap="round" />
      <path d="M78 58 C 86 36, 87 14, 76 8 C 65 3, 61 24, 65 50" fill="#ffffff" stroke="var(--color-midnight-navy)" strokeWidth="4" strokeLinecap="round" />
      <path d="M46 50 C 43 34, 43 20, 47 15" stroke="var(--color-atmosphere-blue)" strokeWidth="3" strokeLinecap="round" />
      <path d="M74 50 C 77 34, 77 20, 73 15" stroke="var(--color-atmosphere-blue)" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 46 C 84 46, 97 63, 95 81 C 93 101, 79 113, 60 113 C 41 113, 27 101, 25 81 C 23 63, 36 46, 60 46 Z" fill="#ffffff" stroke="var(--color-midnight-navy)" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="40" cy="90" r="5.5" fill="var(--color-sky-tint)" />
      <circle cx="80" cy="90" r="5.5" fill="var(--color-sky-tint)" />
      <circle cx="48" cy="77" r="4" fill="var(--color-midnight-navy)" />
      <circle cx="72" cy="77" r="4" fill="var(--color-midnight-navy)" />
      <path d="M56 87 L 64 87 L 60 92 Z" fill="var(--color-berry-red)" stroke="var(--color-berry-red)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M30 84 L 40 86 M30 92 L 40 90 M90 84 L 80 86 M90 92 L 80 90" stroke="var(--color-midnight-navy)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Kuncup melati berkarakter — badan gading, daun sage, kuncup atmosphere. */
function MelatiBuddy({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 120" fill="none" aria-hidden="true">
      <circle cx="50" cy="11" r="6" fill="var(--color-atmosphere-blue)" stroke="var(--color-midnight-navy)" strokeWidth="3" />
      <path d="M50 8 C 72 26, 82 52, 80 74 C 78 98, 66 112, 50 114 C 34 112, 22 98, 20 74 C 18 52, 28 26, 50 8 Z" fill="var(--color-cloud-white)" stroke="var(--color-midnight-navy)" strokeWidth="4" strokeLinejoin="round" />
      <path d="M34 34 C 42 52, 44 76, 40 98 M66 34 C 58 52, 56 76, 60 98" stroke="var(--color-midnight-navy)" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" fill="none" />
      <path d="M24 96 C 30 111, 42 118, 50 117 C 44 107, 34 99, 24 96 Z" fill="var(--color-sky-tint)" stroke="var(--color-midnight-navy)" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M76 96 C 70 111, 58 118, 50 117 C 56 107, 66 99, 76 96 Z" fill="var(--color-sky-tint)" stroke="var(--color-midnight-navy)" strokeWidth="3.5" strokeLinejoin="round" />
      <ellipse cx="30" cy="74" rx="6" ry="4" fill="var(--color-petal)" />
      <ellipse cx="70" cy="74" rx="6" ry="4" fill="var(--color-petal)" />
      <circle cx="39" cy="63" r="4.5" fill="var(--color-midnight-navy)" />
      <circle cx="61" cy="63" r="4.5" fill="var(--color-midnight-navy)" />
      <path d="M43 76 Q50 83, 57 76" stroke="var(--color-midnight-navy)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Burung kecil — paruh atmosphere, sayap sky tint. */
function Bird({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 116 104" fill="none" aria-hidden="true">
      <path d="M26 60 L4 66 L26 74 Z" fill="var(--color-sky-tint)" stroke="var(--color-midnight-navy)" strokeWidth="4" strokeLinejoin="round" />
      <path d="M30 58 C 32 38, 50 27, 68 31 C 86 35, 97 50, 93 66 C 89 84, 70 93, 50 89 C 34 85, 28 73, 30 58 Z" fill="#ffffff" stroke="var(--color-midnight-navy)" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="86" cy="34" r="17" fill="#ffffff" stroke="var(--color-midnight-navy)" strokeWidth="4" />
      <path d="M101 31 L114 36 L101 42 Z" fill="var(--color-atmosphere-blue)" stroke="var(--color-midnight-navy)" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="91" cy="29" r="3.6" fill="var(--color-midnight-navy)" />
      <ellipse cx="80" cy="41" rx="5" ry="3.4" fill="var(--color-petal)" />
      <path d="M44 55 C 55 46, 72 49, 76 62 C 69 74, 50 73, 44 55 Z" fill="var(--color-sky-tint)" stroke="var(--color-midnight-navy)" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M54 91 v9 M67 91 v9" stroke="var(--color-midnight-navy)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

type CharacterComponent = (props: { className?: string }) => React.JSX.Element;

/**
 * Satu karakter doodle berbeda untuk tiap rute — kejutan kecil yang membuat
 * tiap halaman terasa punya "penghuni" sendiri. Selalu ada fallback.
 */
const CREW: Record<string, CharacterComponent> = {
  "/app": Bunny,
  "/app/budget": Bird,
  "/app/tabungan": MelatiBuddy,
  "/app/checklist": Bird,
  "/app/moodboard": MelatiBuddy,
  "/app/tamu": Bird,
  "/app/vendor": MelatiBuddy,
  "/app/rundown": Bird,
  "/app/seserahan": Bunny,
  "/app/pengaturan": MelatiBuddy,
};

/**
 * Maskot halaman: doodle khas Cora mengambang di sudut kanan bawah dengan
 * stiker hitung mundur ("H-123"). pointer-events-none + aria-hidden — murni
 * dekoratif, tidak pernah menghalangi klik atau pembaca layar.
 */
export function PageMascot({
  pathname,
  daysLabel,
}: {
  pathname: string;
  daysLabel?: string;
}) {
  const [visible, setVisible] = useState(false);
  const Character = CREW[pathname] ?? MelatiBuddy;

  // Fade-in setelah mount supaya tidak bertabrakan dengan FadeContent utama.
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), 500);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed bottom-24 right-3 z-20 flex items-end gap-1.5 transition-opacity duration-700 lg:bottom-6 lg:right-6 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {daysLabel && (
        <span className="relative mb-8 rounded-2xl border border-white/80 bg-white/85 px-2.5 py-1 text-[11px] font-extrabold tracking-tight text-midnight-navy shadow-sm backdrop-blur-md">
          {daysLabel}
          <span className="absolute -bottom-1 -right-1 size-2 rotate-45 border-b border-r border-white/80 bg-white/85" />
        </span>
      )}
      <span className="relative block">
        <DoodleStar className="absolute -left-3 -top-3 size-3.5 text-brass-gold" />
        <Character className="bobbing block size-16 drop-shadow-[0_4px_6px_color-mix(in_srgb,var(--color-cerulean-sky)_18%,transparent)] lg:size-20" />
      </span>
    </div>
  );
}
