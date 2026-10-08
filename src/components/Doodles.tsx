/**
 * Ornamen & karakter Jawa — pengganti doodle lama, senada dengan foto
 * gapura ukiran: pengantin Jawa, Semar, gunungan (kayon), dan lengkung
 * janur berumbai. Garis tinta jati (#3a2317), aksen kuningan/terakota.
 * Semua SVG inline (tanpa request) berwarna penuh ala wayang.
 * Murni dekoratif: selalu aria-hidden dan pointer-events-none.
 */

type DoodleProps = { className?: string };

/** Garis berlekuk terakota — underline untuk satu frasa di headline. */
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
        stroke="#b4553a"
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

/** Blob organik — isi satu warna, dipakai sebagai atmosfer sudut. */
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
 * Gunungan (kayon) — gunung kehidupan khas wayang: daun runcing emas,
 * pohon di tengah, gerbang merah bata di pangkal. Pembuka section ala
 * dalang mengangkat kayon.
 */
export function Gunungan({ className }: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 160"
      fill="none"
      aria-hidden="true"
    >
      {/* daun runcing */}
      <path
        d="M50 5 C 67 33, 87 61, 87 93 C 87 126, 71 150, 50 156 C 29 150, 13 126, 13 93 C 13 61, 33 33, 50 5 Z"
        fill="#f7e7bd"
        stroke="#3a2317"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M50 14 C 64 38, 80 63, 80 93 C 80 121, 67 142, 50 148 C 33 142, 20 121, 20 93 C 20 63, 36 38, 50 14 Z"
        fill="#e9cd8f"
        opacity="0.55"
      />
      {/* batang pohon */}
      <path
        d="M50 138 V 84"
        stroke="#7b4530"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* tajuk */}
      <circle cx="50" cy="70" r="17" fill="#8fa756" stroke="#3a2317" strokeWidth="3" />
      <circle cx="34" cy="84" r="10" fill="#a9c36b" stroke="#3a2317" strokeWidth="3" />
      <circle cx="66" cy="84" r="10" fill="#a9c36b" stroke="#3a2317" strokeWidth="3" />
      {/* bunga kuningan di tajuk */}
      <circle cx="45" cy="66" r="2.6" fill="#d8b45c" />
      <circle cx="56" cy="73" r="2.6" fill="#d8b45c" />
      <circle cx="66" cy="82" r="2.4" fill="#d8b45c" />
      {/* gerbang merah bata di pangkal */}
      <path
        d="M39 138 C 39 126, 44 120, 50 120 C 56 120, 61 126, 61 138 Z"
        fill="#b4553a"
        stroke="#3a2317"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* akar */}
      <path
        d="M34 145 Q50 151, 66 145"
        stroke="#7b4530"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Pengantin Jawa — paes hitam, cunduk mentul emas, ronce melati,
 * kebaya marun dengan selendang kuningan.
 */
export function PengantinWanita({ className }: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 110 132"
      fill="none"
      aria-hidden="true"
    >
      {/* sanggul + rambut */}
      <ellipse cx="55" cy="50" rx="35" ry="31" fill="#241609" />
      <ellipse cx="20" cy="44" rx="11" ry="13" fill="#241609" />
      <ellipse cx="90" cy="44" rx="11" ry="13" fill="#241609" />
      {/* cunduk mentul emas */}
      <g stroke="#d8b45c" strokeWidth="3" strokeLinecap="round">
        <path d="M40 24 V 10" />
        <path d="M55 20 V 4" />
        <path d="M70 24 V 10" />
      </g>
      <circle cx="40" cy="8" r="4" fill="#d8b45c" stroke="#3a2317" strokeWidth="2" />
      <circle cx="55" cy="3" r="4.5" fill="#d8b45c" stroke="#3a2317" strokeWidth="2" />
      <circle cx="70" cy="8" r="4" fill="#d8b45c" stroke="#3a2317" strokeWidth="2" />
      {/* wajah */}
      <ellipse cx="55" cy="56" rx="25" ry="24" fill="#fbe8d6" />
      {/* paes (alis hitam memanjang) */}
      <path
        d="M33 46 C 42 38, 68 38, 77 46"
        stroke="#241609"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* mata + pipi + senyum */}
      <circle cx="46" cy="57" r="3.6" fill="#241609" />
      <circle cx="64" cy="57" r="3.6" fill="#241609" />
      <ellipse cx="37" cy="66" rx="5" ry="3.4" fill="#f4a891" />
      <ellipse cx="73" cy="66" rx="5" ry="3.4" fill="#f4a891" />
      <path
        d="M50 68 Q55 73, 60 68"
        stroke="#a63a2b"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* ronce melati di sisi sanggul */}
      <g fill="#fffdf7" stroke="#ddd0b8" strokeWidth="1.4">
        <circle cx="86" cy="56" r="3.2" />
        <circle cx="88" cy="65" r="3.2" />
        <circle cx="88" cy="74" r="3.2" />
        <circle cx="86" cy="83" r="3.2" />
        <circle cx="83" cy="91" r="3.2" />
      </g>
      {/* badan kebaya */}
      <path
        d="M31 94 C 35 80, 44 75, 55 75 C 66 75, 75 80, 79 94 L 87 128 L 23 128 Z"
        fill="#a63a2b"
        stroke="#3a2317"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* selendang kuningan melintang */}
      <path
        d="M32 99 C 47 108, 63 108, 78 99"
        stroke="#d8b45c"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M32 99 C 47 108, 63 108, 78 99"
        stroke="#3a2317"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      {/* motif jarik emas di bawah */}
      <path
        d="M30 116 h50 M34 122 h42"
        stroke="#d8b45c"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Pengantin pria Jawa — kuluk mahkota emas, beskap putih gading,
 * motif batik parang di pangkal.
 */
export function PengantinPria({ className }: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 110 132"
      fill="none"
      aria-hidden="true"
    >
      {/* kuluk / mahkota emas */}
      <path
        d="M32 34 L38 12 L47 24 L55 6 L63 24 L72 12 L78 34 Z"
        fill="#d8b45c"
        stroke="#3a2317"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <circle cx="55" cy="6" r="4" fill="#b4553a" stroke="#3a2317" strokeWidth="2" />
      {/* rambut */}
      <ellipse cx="55" cy="50" rx="31" ry="27" fill="#241609" />
      {/* wajah */}
      <ellipse cx="55" cy="56" rx="24" ry="23" fill="#fbe8d6" />
      {/* alis */}
      <path
        d="M39 48 Q46 44, 52 48 M58 48 Q64 44, 71 48"
        stroke="#241609"
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* mata + pipi + senyum */}
      <circle cx="46" cy="57" r="3.6" fill="#241609" />
      <circle cx="64" cy="57" r="3.6" fill="#241609" />
      <ellipse cx="37" cy="65" rx="5" ry="3.4" fill="#f4a891" />
      <ellipse cx="73" cy="65" rx="5" ry="3.4" fill="#f4a891" />
      <path
        d="M50 67 Q55 72, 60 67"
        stroke="#3a2317"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* beskap putih gading */}
      <path
        d="M31 94 C 35 80, 44 75, 55 75 C 66 75, 75 80, 79 94 L 87 128 L 23 128 Z"
        fill="#fffdf7"
        stroke="#3a2317"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* kancing & lipatan emas */}
      <circle cx="55" cy="92" r="3.4" fill="#d8b45c" stroke="#3a2317" strokeWidth="2" />
      <circle cx="55" cy="104" r="3.4" fill="#d8b45c" stroke="#3a2317" strokeWidth="2" />
      <path
        d="M55 78 V 90"
        stroke="#3a2317"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* motif parang di pangkal */}
      <g stroke="#7b4530" strokeWidth="3.4" strokeLinecap="round">
        <path d="M32 116 l10 -7" />
        <path d="M46 122 l10 -7" />
        <path d="M62 116 l10 -7" />
        <path d="M72 124 l8 -6" />
      </g>
      {/* kalung kuningan */}
      <path
        d="M43 80 Q55 90, 67 80"
        stroke="#d8b45c"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Semar — semar gendeng: badan putih gading bulat, kuncuk hitam,
 * jarik cokelat sogan. Pepunden yang lucu tiap halaman.
 */
export function Semar({ className }: DoodleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 132"
      fill="none"
      aria-hidden="true"
    >
      {/* kuncuk (jambul) */}
      <path
        d="M48 30 C 46 16, 54 6, 64 8 C 74 10, 77 20, 71 28"
        fill="#241609"
        stroke="#3a2317"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* badan bulat */}
      <ellipse cx="60" cy="80" rx="42" ry="40" fill="#fffdf7" stroke="#3a2317" strokeWidth="3.5" />
      {/* wajah */}
      <circle cx="47" cy="66" r="4" fill="#241609" />
      <circle cx="71" cy="66" r="4" fill="#241609" />
      <path
        d="M39 57 Q46 52, 53 56 M65 56 Q73 52, 80 57"
        stroke="#241609"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="38" cy="76" rx="6" ry="4" fill="#f4a891" />
      <ellipse cx="82" cy="76" rx="6" ry="4" fill="#f4a891" />
      <path
        d="M48 80 Q60 92, 72 80"
        stroke="#3a2317"
        strokeWidth="3.6"
        strokeLinecap="round"
        fill="none"
      />
      {/* jarik sogan melilit badan */}
      <path
        d="M22 98 C 40 110, 80 110, 98 98 L 100 118 C 80 130, 40 130, 20 118 Z"
        fill="#7b4530"
        stroke="#3a2317"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <g fill="#d8b45c">
        <circle cx="38" cy="112" r="3" />
        <circle cx="58" cy="118" r="3" />
        <circle cx="78" cy="112" r="3" />
        <circle cx="48" cy="106" r="2.4" />
        <circle cx="68" cy="106" r="2.4" />
      </g>
      {/* lengan memeluk perut */}
      <path
        d="M24 86 C 34 96, 44 100, 52 100"
        stroke="#3a2317"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M96 86 C 86 96, 76 100, 68 100"
        stroke="#3a2317"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* kaki pendek */}
      <path
        d="M44 126 v6 M76 126 v6"
        stroke="#3a2317"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Lengkung janur berumbai — dua pelengkap janur saling menyilang seperti
 * gapura di foto, dengan untaian melati kecil menggantung dan bandul emas.
 */
export function JanurArch({ className }: DoodleProps) {
  const strands = Array.from({ length: 7 }, (_, index) => ({
    x: 46 + index * 22,
    y: 52 + Math.abs(3 - index) * 9,
    len: 34 - Math.abs(3 - index) * 6,
  }));
  return (
    <svg
      className={className}
      viewBox="0 0 400 130"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* lengkung janur kiri & kanan — saling silang di puncak */}
      <path
        d="M10 126 C 26 44, 118 8, 236 18"
        stroke="#b9c98c"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M390 126 C 374 44, 282 8, 164 18"
        stroke="#cbd9a1"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* untaian melati menggantung di sepanjang lengkung */}
      <g stroke="#e9cd8f" strokeWidth="3" strokeLinecap="round">
        {strands.map((strand) => (
          <path
            key={`l-${strand.x}`}
            d={`M${strand.x} ${strand.y} v${strand.len}`}
          />
        ))}
        {strands.map((strand) => (
          <path
            key={`r-${400 - strand.x}`}
            d={`M${400 - strand.x} ${strand.y} v${strand.len}`}
          />
        ))}
      </g>
      <g fill="#fffdf7" stroke="#ddd0b8" strokeWidth="1.2">
        {strands.map((strand) => (
          <circle key={`kl-${strand.x}`} cx={strand.x} cy={strand.y + strand.len} r="3.4" />
        ))}
        {strands.map((strand) => (
          <circle
            key={`kr-${400 - strand.x}`}
            cx={400 - strand.x}
            cy={strand.y + strand.len}
            r="3.4"
          />
        ))}
      </g>
      {/* bandul emas di puncak silang */}
      <path d="M200 14 v14" stroke="#cdc1a6" strokeWidth="3" />
      <path
        d="M200 30 L208 42 L200 54 L192 42 Z"
        fill="#e9cd8f"
        stroke="#3a2317"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M200 56 v10" stroke="#cdc1a6" strokeWidth="3" />
      <circle cx="200" cy="70" r="4" fill="#d8b45c" />
    </svg>
  );
}
