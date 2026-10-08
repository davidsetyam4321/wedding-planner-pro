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

/**
 * Kawan kedua: kuncup melati berkarakter — badan putih gading, daun sage,
 * pipi blush, dan kuncup emas di kepala. Maskot utama ala nikahan Jawa.
 */
export function MelatiBuddy({ className }: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 120"
      fill="none"
      aria-hidden="true"
    >
      {/* kuncup emas di kepala */}
      <circle cx="50" cy="11" r="6" fill="#e9cd8f" stroke="#151b31" strokeWidth="3" />
      {/* badan kuncup */}
      <path
        d="M50 8 C 72 26, 82 52, 80 74 C 78 98, 66 112, 50 114 C 34 112, 22 98, 20 74 C 18 52, 28 26, 50 8 Z"
        fill="#fffdf6"
        stroke="#151b31"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* lipatan kelopak */}
      <path
        d="M34 34 C 42 52, 44 76, 40 98 M66 34 C 58 52, 56 76, 60 98"
        stroke="#151b31"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
        fill="none"
      />
      {/* daun pangkal */}
      <path
        d="M24 96 C 30 111, 42 118, 50 117 C 44 107, 34 99, 24 96 Z"
        fill="#a9d9bf"
        stroke="#151b31"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M76 96 C 70 111, 58 118, 50 117 C 56 107, 66 99, 76 96 Z"
        fill="#a9d9bf"
        stroke="#151b31"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* pipi */}
      <ellipse cx="30" cy="74" rx="6" ry="4" fill="#ffb6ab" />
      <ellipse cx="70" cy="74" rx="6" ry="4" fill="#ffb6ab" />
      {/* mata + senyum */}
      <circle cx="39" cy="63" r="4.5" fill="#151b31" />
      <circle cx="61" cy="63" r="4.5" fill="#151b31" />
      <path
        d="M43 76 Q50 83, 57 76"
        stroke="#151b31"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Kawan ketiga: burung kecil (perkutut) — paruh emas, sayap blush,
 * pipi merah muda. Sesuai nuansa nikahan Jawa yang tenang.
 */
export function Bird({ className }: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 116 104"
      fill="none"
      aria-hidden="true"
    >
      {/* ekor */}
      <path
        d="M26 60 L4 66 L26 74 Z"
        fill="#ffd9d2"
        stroke="#151b31"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* badan */}
      <path
        d="M30 58 C 32 38, 50 27, 68 31 C 86 35, 97 50, 93 66 C 89 84, 70 93, 50 89 C 34 85, 28 73, 30 58 Z"
        fill="#ffffff"
        stroke="#151b31"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* kepala */}
      <circle cx="86" cy="34" r="17" fill="#ffffff" stroke="#151b31" strokeWidth="4" />
      {/* paruh */}
      <path
        d="M101 31 L114 36 L101 42 Z"
        fill="#e9cd8f"
        stroke="#151b31"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* mata + pipi */}
      <circle cx="91" cy="29" r="3.6" fill="#151b31" />
      <ellipse cx="80" cy="41" rx="5" ry="3.4" fill="#ffb6ab" />
      {/* sayap */}
      <path
        d="M44 55 C 55 46, 72 49, 76 62 C 69 74, 50 73, 44 55 Z"
        fill="#ffd9d2"
        stroke="#151b31"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* kaki */}
      <path
        d="M54 91 v9 M67 91 v9"
        stroke="#151b31"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
