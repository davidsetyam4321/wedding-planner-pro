/**
 * Latar hero ala "toko tanaman di dinding bersinar" (gaya Hero-28 React Bits,
 * diterjemahkan ke tema nature SatuJanji): dinding krem memantulkan cahaya
 * pagi, dan deretan tanaman membuang bayangan panjangnya ke dinding.
 *
 * Semua bentuk tanaman digambar sendiri sebagai SVG — tidak ada gambar eksternal.
 * Warna memakai CSS variable (--pl-*) supaya lapisan bayangan bisa memaksa
 * satu warna zaitun gelap.
 */

/** Daun runcing dari titik dasar (0,0) ke arah atas — diputar pakai rotate(). */
function leaf(length: number, width: number): string {
  const l = length;
  const w = width;
  return [
    "M0 0",
    `C ${-w} ${-l * 0.32}, ${-w * 0.72} ${-l * 0.74}, 0 ${-l}`,
    `C ${w * 0.72} ${-l * 0.74}, ${w} ${-l * 0.32}, 0 0`,
    "Z",
  ].join(" ");
}

/** Pot trapesium dengan bibir dan tanah di mulutnya. */
function Pot({
  w,
  h,
  rim,
  body,
  edge,
  soil = "var(--pl-soil, #6b4b32)",
}: {
  w: number;
  h: number;
  rim: number;
  body: string;
  edge: string;
  soil?: string;
}) {
  const top = -h;
  return (
    <>
      {/* bayangan kontak di lantai */}
      <ellipse cx="0" cy="3" rx={w + 9} ry="6" fill="rgba(72, 84, 50, 0.26)" />
      <path
        d={`M${-(w - 7)} ${top} L${w - 7} ${top} L${w - 14} 0 L${-(w - 14)} 0 Z`}
        fill={body}
      />
      <rect
        x={-w}
        y={top - rim}
        width={w * 2}
        height={rim}
        rx={rim * 0.4}
        fill={edge}
      />
      <ellipse cx="0" cy={top - rim / 2} rx={w - 9} ry={rim * 0.38} fill={soil} />
    </>
  );
}

const LEAF_A = "var(--pl-leaf, #4f7d52)";
const LEAF_B = "var(--pl-leaf2, #6f9f61)";

/** Tanaman lidah mertil — bilah tegak ramping. */
function SnakePlant() {
  const blades: [number, number][] = [
    [-11, 116],
    [-5, 100],
    [1, 126],
    [7, 94],
    [12, 106],
  ];
  return (
    <>
      <Pot
        w={30}
        h={42}
        rim={11}
        body="var(--pl-pot3, #d9ccb4)"
        edge="var(--pl-pot2, #bfae90)"
        soil="var(--pl-soil, #6f5a41)"
      />
      <g transform="translate(0 -50)">
        {blades.map(([a, l], i) => (
          <path
            key={i}
            d={leaf(l, 8.5)}
            transform={`rotate(${a})`}
            fill={i % 2 ? LEAF_A : LEAF_B}
          />
        ))}
      </g>
    </>
  );
}

/** Rumput kecil di gundukan tanah. */
function GrassTuft() {
  const blades: [number, number][] = [
    [-30, 30],
    [-19, 40],
    [-8, 35],
    [3, 46],
    [13, 37],
    [23, 42],
    [34, 28],
  ];
  return (
    <>
      <ellipse cx="0" cy="-2" rx="24" ry="6" fill="var(--pl-soil, #7a5a3c)" />
      <g transform="translate(0 -6)">
        {blades.map(([a, l], i) => (
          <path
            key={i}
            d={leaf(l, 4.5)}
            transform={`rotate(${a})`}
            fill={i % 2 ? LEAF_A : LEAF_B}
          />
        ))}
      </g>
    </>
  );
}

/** Palem — melengkung ke segala arah, tanaman tertinggi di deretan. */
function PalmPlant() {
  const fronds: [number, number][] = [
    [-78, 70],
    [-56, 84],
    [-34, 94],
    [-12, 98],
    [10, 96],
    [32, 92],
    [54, 82],
    [76, 72],
  ];
  return (
    <>
      <Pot
        w={36}
        h={46}
        rim={12}
        body="var(--pl-pot, #c4714f)"
        edge="var(--pl-pot, #a95c3f)"
      />
      <g transform="translate(0 -56)">
        {fronds.map(([a, l], i) => (
          <path
            key={i}
            d={leaf(l - (i % 2) * 6, 14)}
            transform={`rotate(${a})`}
            fill={i % 2 ? LEAF_A : LEAF_B}
          />
        ))}
        <path d={leaf(84, 11)} fill={LEAF_B} />
      </g>
    </>
  );
}

/** Perdu rondel dengan bunga berry merah. */
function BushPlant() {
  const outer = [-150, -120, -90, -63, -36, -9, 18, 45, 72, 99, 126, 153];
  const inner = [-135, -81, -27, 27, 81, 135];
  return (
    <>
      <Pot
        w={26}
        h={34}
        rim={9}
        body="var(--pl-pot3, #e3d7c0)"
        edge="var(--pl-pot2, #c9b994)"
      />
      <g transform="translate(0 -42)">
        {outer.map((a, i) => (
          <path
            key={`o${i}`}
            d={leaf(i % 2 ? 36 : 44, 11)}
            transform={`rotate(${a})`}
            fill={i % 2 ? LEAF_A : LEAF_B}
          />
        ))}
        {inner.map((a, i) => (
          <path
            key={`i${i}`}
            d={leaf(26, 9)}
            transform={`rotate(${a})`}
            fill={LEAF_A}
          />
        ))}
        <circle cx="-18" cy="-64" r="4" fill="var(--pl-berry, #cf372d)" />
        <circle cx="10" cy="-76" r="3.6" fill="var(--pl-berry, #cf372d)" />
        <circle cx="21" cy="-52" r="3.2" fill="var(--pl-berry, #cf372d)" />
      </g>
    </>
  );
}

/** Tanaman berdaun lebar. */
function BroadPlant() {
  const broad: [number, number, number][] = [
    [-64, 64, 24],
    [-34, 78, 27],
    [-2, 86, 29],
    [32, 76, 26],
    [62, 62, 23],
  ];
  return (
    <>
      <Pot
        w={34}
        h={44}
        rim={11}
        body="var(--pl-pot2, #b98a5e)"
        edge="var(--pl-pot2, #9c7048)"
      />
      <g transform="translate(0 -52)">
        {broad.map(([a, l, w], i) => (
          <path
            key={i}
            d={leaf(l, w)}
            transform={`rotate(${a})`}
            fill={i % 2 ? LEAF_A : LEAF_B}
          />
        ))}
        <path d={leaf(52, 18)} transform="rotate(-18)" fill={LEAF_B} />
        <path d={leaf(48, 17)} transform="rotate(16)" fill={LEAF_A} />
      </g>
    </>
  );
}

/** Bibit mungil dalam pot kecil. */
function SprigPlant() {
  const leaves: [number, number][] = [
    [-40, 34],
    [-18, 44],
    [4, 50],
    [26, 40],
    [46, 30],
  ];
  return (
    <>
      <Pot
        w={18}
        h={24}
        rim={7}
        body="var(--pl-pot3, #ded2bb)"
        edge="var(--pl-pot2, #c2b294)"
      />
      <g transform="translate(0 -30)">
        {leaves.map(([a, l], i) => (
          <path
            key={i}
            d={leaf(l, 9)}
            transform={`rotate(${a})`}
            fill={i % 2 ? LEAF_A : LEAF_B}
          />
        ))}
      </g>
    </>
  );
}

const PALETTE = {
  snake: SnakePlant,
  grass: GrassTuft,
  palm: PalmPlant,
  bush: BushPlant,
  broad: BroadPlant,
  sprig: SprigPlant,
} as const;

type PlantId = keyof typeof PALETTE;

/**
 * Posisi & karakter goyangan tiap tanaman di kanvas 1440×340 (garis tanah y=330).
 * Durasi/delay berbeda supaya goyangannya tidak serempak.
 */
const LAYOUT: { id: PlantId; x: number; s: number; dur: number; delay: string }[] =
  [
    { id: "snake", x: 260, s: 1.5, dur: 7.6, delay: "-1.4s" },
    { id: "grass", x: 445, s: 1.3, dur: 6.4, delay: "-3.1s" },
    { id: "palm", x: 645, s: 1.6, dur: 8.4, delay: "-0.6s" },
    { id: "bush", x: 875, s: 1.4, dur: 6.9, delay: "-2.4s" },
    { id: "broad", x: 1095, s: 1.5, dur: 7.9, delay: "-4.2s" },
    { id: "sprig", x: 1310, s: 1.2, dur: 6.1, delay: "-5.4s" },
  ];

function GardenArt({ sway = true }: { sway?: boolean }) {
  return (
    <svg
      viewBox="0 0 1440 340"
      preserveAspectRatio="xMidYMax slice"
      className="h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      {LAYOUT.map(({ id, x, s, dur, delay }) => {
        const Plant = PALETTE[id];
        return (
          <g key={`${id}-${x}`} transform={`translate(${x} 330) scale(${s})`}>
            <g
              className={sway ? "plant-body" : undefined}
              style={
                sway
                  ? { animationDuration: `${dur}s`, animationDelay: delay }
                  : undefined
              }
            >
              <Plant />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

/** Dinding krem memantulkan cahaya pagi — LATAR hero di balik teks & header. */
export function SunlitWall({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`sunlit-wall absolute inset-0 -z-10 ${className}`}
    />
  );
}

/**
 * Deretan tanaman di dasar hero: lapisan badan (bergoyang lembut) + lapisan
 * bayangan panjang yang memanjang ke kiri-atas dinding — cahaya dari kanan atas.
 */
export function PlantRow() {
  return (
    <div
      aria-hidden="true"
      className="nature-plants absolute inset-x-0 bottom-0 -z-10 mx-auto h-44 max-w-6xl sm:h-56 md:h-72"
    >
      <div className="plant-cast">
        <GardenArt sway={false} />
      </div>
      <GardenArt />
    </div>
  );
}
