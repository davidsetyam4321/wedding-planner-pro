/**
 * Doodle tangan ala Tracky — motif ilustrasi buku catatan: garis berlekuk,
 * panah melengkung, bintang kilau, blob organik, dan maskot kelinci.
 * Semua SVG inline (tanpa request) berwarna navy/coral/mint/butter.
 * Murni dekoratif: selalu aria-hidden dan pointer-events-none.
 */

type DoodleProps = { className?: string };

/** Garis berlekuk coral — underline untuk satu frasa di headline. */
export function Squiggle({ className }: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 14"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        d="M4 9 C 26 2, 46 13, 68 7 S 112 2, 135 8 S 176 3, 196 7"
        stroke="#ff5858"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Panah melengkung bergaya tulisan tangan — penunjuk anotasi. */
export function CurvedArrow({ className }: DoodleProps) {
  return (
    <svg className={className} viewBox="0 0 90 70" fill="none" aria-hidden="true">
      <path
        d="M8 10 C 42 8, 70 24, 74 56"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M62 46 L 75 59 L 80 42"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Bintang kilau kecil — satu warna isi. */
export function DoodleStar({ className }: DoodleProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2 C 13 8, 16 11, 22 12 C 16 13, 13 16, 12 22 C 11 16, 8 13, 2 12 C 8 11, 11 8, 12 2 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Blob organik — isi mint/soft blue, dipakai sebagai atmosfer sudut. */
export function Blob({ className }: DoodleProps) {
  return (
    <svg className={className} viewBox="0 0 60 58" fill="none" aria-hidden="true">
      <path
        d="M31 3 C 47 5, 58 19, 53 34 C 48 49, 31 57, 17 51 C 3 45, -2 27, 6 15 C 12 6, 22 2, 31 3 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Maskot kelinci — garis navy, telinga dalam coral, pipi rose.
 * Diletakkan mengintip dari tepi kartu (persis pola ilustrasi Tracky).
 */
export function Bunny({ className }: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 130"
      fill="none"
      aria-hidden="true"
    >
      {/* telinga */}
      <path
        d="M42 58 C 34 36, 33 14, 44 8 C 55 3, 59 24, 55 50"
        fill="#ffffff"
        stroke="#151b31"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M78 58 C 86 36, 87 14, 76 8 C 65 3, 61 24, 65 50"
        fill="#ffffff"
        stroke="#151b31"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M46 50 C 43 34, 43 20, 47 15"
        stroke="#ff5858"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M74 50 C 77 34, 77 20, 73 15"
        stroke="#ff5858"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* kepala */}
      <path
        d="M60 46 C 84 46, 97 63, 95 81 C 93 101, 79 113, 60 113 C 41 113, 27 101, 25 81 C 23 63, 36 46, 60 46 Z"
        fill="#ffffff"
        stroke="#151b31"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* pipi */}
      <circle cx="40" cy="90" r="5.5" fill="#ffe4e0" />
      <circle cx="80" cy="90" r="5.5" fill="#ffe4e0" />
      {/* mata + hidung */}
      <circle cx="48" cy="77" r="4" fill="#151b31" />
      <circle cx="72" cy="77" r="4" fill="#151b31" />
      <path
        d="M56 87 L 64 87 L 60 92 Z"
        fill="#ff5858"
        stroke="#ff5858"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* kumis */}
      <path
        d="M30 84 L 40 86 M30 92 L 40 90 M90 84 L 80 86 M90 92 L 80 90"
        stroke="#151b31"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
