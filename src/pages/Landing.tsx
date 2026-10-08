import AnimatedContent from "@/components/AnimatedContent";
import BlurText from "@/components/BlurText";
import CountUp from "@/components/CountUp";
import {
  GarlandDivider,
  MelatiBandul,
  MotifDivider,
  PetalsFront,
  SekarSudut,
} from "@/components/Decor";
import { FlowerMark, Petals } from "@/components/Decor";
import FadeContent from "@/components/FadeContent";
import Magnet from "@/components/Magnet";
import PulseHeart from "@/components/PulseHeart";
import { Stagger, StaggerItem } from "@/components/Shared";
import SoftAurora from "@/components/SoftAurora";
import SpotlightCard from "@/components/SpotlightCard";
import { Button } from "@/components/ui/button";
import { FEATURES } from "@/lib/features";
import { useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  DoorOpen,
  HeartHandshake,
  Mail,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import SplitText from "@/components/SplitText";

const STEPS = [
  {
    step: "01",
    title: "Buka ruang kerja",
    desc: "Aplikasi langsung menyiapkan ruang kerja privat untuk Anda — tanpa pendaftaran yang rumit.",
    icon: DoorOpen,
  },
  {
    step: "02",
    title: "Undang pasangan",
    desc: "Bagikan kode undangan 6 karakter agar pasangan bergabung ke ruang kerja yang sama.",
    icon: Mail,
  },
  {
    step: "03",
    title: "Rencanakan bersama",
    desc: "Budget, checklist, tamu, vendor, dan rundown diperbarui real-time di kedua perangkat.",
    icon: HeartHandshake,
  },
];

/**
 * Galeri nuansa Jawa — foto Wikimedia Commons (CC BY-SA),
 * daftar kredit lengkap di public/assets/CREDITS.md.
 */
const GALLERY = [
  {
    src: "/assets/gapura-ukiran.jpg",
    alt: "Ukiran pintu gapura kayu jati di Kotagede",
    caption: "Ukiran gapura",
  },
  {
    src: "/assets/pengantin-panggih.jpg",
    alt: "Prosesi panggih pengantin Jawa",
    caption: "Prosesi panggih",
  },
  {
    src: "/assets/janur-kuning.jpg",
    alt: "Detail janur kuning dekorasi",
    caption: "Janur kuning",
  },
  {
    src: "/assets/joglo.jpg",
    alt: "Rumah joglo Jawa",
    caption: "Joglo",
  },
  {
    src: "/assets/upacara-jawa.jpg",
    alt: "Upacara pernikahan Jawa dengan melati dan ornamen kuningan",
    caption: "Upacara Jawa",
  },
  {
    src: "/assets/gapura-keraton.jpg",
    alt: "Gapura Keraton Dermayu",
    caption: "Gapura keraton",
  },
  {
    src: "/assets/pengantin-resepsi.jpg",
    alt: "Resepsi pernikahan Jawa di Solo",
    caption: "Resepsi Solo",
  },
  {
    src: "/assets/wayang-semar.jpg",
    alt: "Wayang kulit Semar",
    caption: "Wayang Semar",
  },
  {
    src: "/assets/wayang-kayon.jpg",
    alt: "Kayon (gunungan wayang) karya dalang Kedu",
    caption: "Kayon / gunungan",
  },
  {
    src: "/assets/wayang-sinta.jpg",
    alt: "Wayang kulit Prinses Sinta",
    caption: "Wayang Sinta",
  },
  {
    src: "/assets/wayang-perform.jpg",
    alt: "Pertunjukan wayang kulit bersama dalang",
    caption: "Pertunjukan wayang",
  },
  {
    src: "/assets/gamelan.jpg",
    alt: "Memainkan gamelan Jawa",
    caption: "Gamelan",
  },
  {
    src: "/assets/keris.jpg",
    alt: "Keris pusaka dalam upacara pejenengan",
    caption: "Keris pusaka",
  },
  {
    src: "/assets/tumpeng.jpg",
    alt: "Nasi tumpeng tradisional",
    caption: "Tumpeng",
  },
  {
    src: "/assets/gebyok.jpg",
    alt: "Pintu gebyok berukir",
    caption: "Gebyok ukir",
  },
  {
    src: "/assets/bunga-dekorasi.jpg",
    alt: "Karangan bunga dekorasi pernikahan",
    caption: "Dekorasi bunga",
  },
  {
    src: "/assets/jamu.jpg",
    alt: "Jamu gendong — tradisi jamu Jawa",
    caption: "Jamu tradisi",
  },
];

/** Halaman publik: memperkenalkan produk lalu mengarahkan ke aplikasi. */
export function LandingPage() {
  const [bannerOpen, setBannerOpen] = useState(true);
  const reducedMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen">
      <Petals />
      <PetalsFront />

      {/* ── Banner pengumuman (Butter Yellow, melebar penuh) ─────────── */}
      {bannerOpen && (
        <div className="relative z-50 bg-brass-gold">
          <div className="mx-auto flex w-full max-w-[1200px] items-center justify-center px-12 py-2.5 text-center text-sm font-medium text-teak-ink">
            <span>
              Ruang kerja berdua kini terbuka untuk siapa pun — mulai gratis,
              tanpa kartu.{" "}
              <a
                href="#cara-kerja"
                className="font-semibold text-brick-accent underline-offset-4 hover:underline"
              >
                Lihat caranya
              </a>
            </span>
            <button
              type="button"
              aria-label="Tutup pengumuman"
              onClick={() => setBannerOpen(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-colors hover:bg-teak-ink/10"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Header minimal: logo kiri, satu tombol kanan ─────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-teak-ink">
              <FlowerMark className="size-5 text-white" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              SatuJanji
            </span>
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/app">
              Buka aplikasi <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <div aria-hidden="true" className="pita-h pita-kawung h-2.5 w-full" />
      </header>

      <main className="space-y-20 pb-24">
        {/* ── Hero: aurora lembut, headline display, anotasi tulis tangan ─ */}
        <section className="relative w-full px-5 pb-16 pt-24 text-center md:pt-32">
          {/* Full-bleed foto gapura ukiran — latar hero ala foto inspirasi */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
            <img
              src="/assets/gapura-ukiran.jpg"
              alt=""
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/78 to-background" />
          </div>
          {/* atmosfer romantic: sapuan aurora terakota → janur (react-bits) */}
          {!reducedMotion && (
            <div className="pointer-events-none absolute -inset-x-6 -top-16 -z-10 h-[130%] opacity-75">
              <SoftAurora
                lightMode
                speed={0.25}
                color1="#d4795f"
                color2="#b9c98c"
              />
            </div>
          )}
          {/* Aksara Jawa: “Sugeng Rawuh” (selamat datang) + bandul melati */}
          <p className="aksara relative mx-auto mt-2 text-sm tracking-[0.3em] text-teak-ink/75">
            ꦱꦸꦒꦼꦁꦫꦮꦸꦃ꧉
          </p>
          <MelatiBandul className="relative mx-auto mt-2 block h-16 w-11" />

          <FadeContent
            blur
            duration={900}
            delay={150}
            className="relative inline-block"
          >
            <span className="chip bg-tint-rose text-teak-ink">
              <Sparkles className="size-3.5" /> Perencana pernikahan untuk
              berdua
            </span>
          </FadeContent>

          <FadeContent
            blur
            duration={1200}
            delay={300}
            className="relative mx-auto mt-7 max-w-4xl"
          >
            <h1 className="font-serif text-[40px] leading-[1.04] sm:text-[56px] md:text-[64px] lg:text-[76px]">
              Rencanakan hari bahagia Anda,{" "}
              <span className="elegant relative inline-block text-[1.08em] text-brick-accent">
                berdua.
                <span className="ornamen-bawah absolute -bottom-2 left-0 block w-full" />
              </span>
            </h1>
          </FadeContent>

          <BlurText
            text="Satu ruang kerja bersama untuk budget, tabungan, checklist, daftar tamu, vendor, dan rundown — tersinkron real-time di kedua perangkat Anda berdua."
            className="mx-auto mt-7 max-w-2xl text-body-lg leading-normal text-slate"
            direction="bottom"
            delay={30}
          />

          <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
            <span className="pointer-events-none absolute right-4 -top-14 hidden items-end gap-1.5 md:flex">
              <span className="-rotate-6 font-serif text-sm text-teak-ink">
                gratis, lho!
              </span>
              <SekarSudut className="size-7" />
            </span>
            <Magnet padding={70} magnetStrength={2.5}>
              <Button asChild size="lg" className="px-7">
                <Link to="/app">
                  Mulai merencanakan <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Magnet>
            <Button asChild size="lg" variant="outline" className="px-6">
              <a href="#cara-kerja">Lihat cara kerja</a>
            </Button>
          </div>

          <FadeContent
            blur
            duration={900}
            delay={600}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {["9 modul lengkap", "2 perangkat, 1 data", "Tanpa ribet"].map(
              (item) => (
                <span key={item} className="meta flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-teak-ink" />
                  {item}
                </span>
              ),
            )}
          </FadeContent>
        </section>

        {/* Pita batik parang — keramaian ala kain selendang */}
        <div
          aria-hidden="true"
          className="pita-h pita-parang mx-auto h-4 w-full max-w-md"
        />

        {/* ── Dark feature card + kartu putih miring menumpuk ────────── */}
        <section className="mx-auto w-full max-w-[1200px] px-5">
          <AnimatedContent distance={80} threshold={0.15}>
            <div className="batik-sogan relative overflow-hidden rounded-3xl border border-white/10 bg-teak-ink p-8 shadow-[0_1px_4px_rgba(138,133,125,0.2)] md:p-12">
              {/* material foto ukiran kayu — tekstur gapura di balik konten */}
              <div
                aria-hidden="true"
                className="wood-carving pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
              />
              <img
                src="/assets/wayang-punokawan.jpg"
                alt=""
                aria-hidden
                className="absolute -right-2 -top-10 hidden size-28 rotate-[6deg] rounded-2xl border-2 border-brass-gold object-cover shadow-lg md:block"
              />
              <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
                <div>
                  <p className="label text-janur-green">
                    Satu layar untuk semuanya
                  </p>
                  <h2 className="mt-2 font-serif text-3xl leading-tight text-white md:text-4xl">
                    Hitung mundur, dana, dan tugas{" "}
                    <span className="elegant text-[1.06em] text-brick-accent">
                      terlihat sekilas
                    </span>
                  </h2>
                  <p className="mt-4 max-w-md text-white/70">
                    Ringkasan hari-H, progres budget, dan sisa tugas diperbarui
                    real-time — sama persis di layar Anda dan pasangan.
                  </p>
                  <Button
                    asChild
                    className="mt-7 bg-paper-white text-teak-ink shadow-none hover:bg-white/90"
                  >
                    <Link to="/app">
                      Buka ruang kerja <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>

                {/* Preview mini dashboard — kartu putih miring (-4°) */}
                <div className="relative">
                  <div className="rotate-[-4deg] rounded-2xl bg-paper-white p-5 shadow-[0_1px_4px_rgba(138,133,125,0.2)] lg:-mr-10">
                    <p className="label text-slate">Menuju hari pernikahan</p>
                    <p className="num mt-1 text-4xl font-extrabold text-teak-ink">
                      H-<CountUp to={328} />
                    </p>
                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-ash-canvas">
                      <div className="h-full w-2/3 rounded-full bg-teak-ink" />
                    </div>
                    <p className="mt-2 text-sm text-slate">
                      Rp 42 jt dari target Rp 64 jt
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        { label: "Budget", surface: "grad-mint" },
                        { label: "Tabungan", surface: "grad-lavender" },
                        { label: "Checklist", surface: "grad-peach" },
                      ].map((tile) => (
                        <div
                          key={tile.label}
                          className={`clay-sm ${tile.surface} p-2.5 text-teak-ink`}
                        >
                          <p className="label opacity-70">{tile.label}</p>
                          <p className="num mt-0.5 text-xs font-extrabold">
                            <CountUp to={68} />%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContent>
        </section>

        {/* ── Fitur: kartu putih + sorotan lembut saat disentuh ──────── */}
        <section id="fitur" className="mx-auto w-full max-w-[1200px] px-5">
          <FadeContent
            blur
            duration={900}
            className="flex flex-wrap items-end justify-between gap-2"
          >
            <div>
              <p className="label text-slate">Fitur lengkap</p>
              <SplitText
                tag="h2"
                textAlign="left"
                className="mt-2 font-serif text-3xl md:text-4xl pb-1"
                text="Semua yang Anda butuhkan dalam satu tempat"
                delay={25}
              />
            </div>
            <span className="meta">9 modul siap dipakai</span>
          </FadeContent>

          <Stagger className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {FEATURES.map((feature) => (
              <StaggerItem key={feature.to}>
                <Link
                  to="/app"
                  className={`clay clay-press block h-full ${feature.surface}`}
                >
                  <SpotlightCard
                    className="h-full rounded-2xl p-5"
                    spotlightColor="rgba(255, 255, 255, 0.55)"
                  >
                    <feature.icon className="size-5" />
                    <p className="mt-3 text-sm font-extrabold leading-tight">
                      {feature.label}
                    </p>
                    <p className="mt-1 text-[11px] leading-snug opacity-80">
                      {feature.desc}
                    </p>
                  </SpotlightCard>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* ── Galeri nuansa: aset foto Jawa (Wikimedia Commons, CC BY-SA) ─ */}
        <section className="mx-auto w-full max-w-[1200px] px-5">
          <FadeContent
            blur
            duration={900}
            className="flex flex-wrap items-end justify-between gap-2"
          >
            <div>
              <p className="label text-slate">Nuansa hari-H</p>
              <SplitText
                tag="h2"
                textAlign="left"
                className="mt-2 font-serif text-3xl md:text-4xl pb-1"
                text="Gapura, janur, dan pengantin Jawa"
                delay={25}
              />
            </div>
            <span className="meta">Foto: Wikimedia Commons · CC BY-SA</span>
          </FadeContent>

          <Stagger className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {GALLERY.map((item) => (
              <StaggerItem key={item.src}>
                <figure className="clay group relative block overflow-hidden rounded-2xl">
                  <img
                    src={item.src}
                    alt={item.alt}
                    loading="lazy"
                    className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-52"
                  />
                  <figcaption className="photo-scrim absolute inset-x-0 bottom-0 px-3 py-2 text-[11px] font-bold text-white">
                    {item.caption}
                  </figcaption>
                </figure>
              </StaggerItem>
            ))}
          </Stagger>

          <MotifDivider className="mx-auto mt-9 block h-9 w-full max-w-sm" />
        </section>

        <GarlandDivider className="mx-auto block h-20 w-full max-w-sm" />

        {/* ── Cara kerja: tiga langkah, ikon lucide seragam ───────────── */}
        <section id="cara-kerja" className="mx-auto w-full max-w-[1200px] px-5">
          <p className="label text-slate">Cara kerja</p>
          <SplitText
            tag="h2"
            textAlign="left"
            className="mt-2 font-serif text-3xl md:text-4xl pb-1"
            text="Tiga langkah menuju rencana yang rapi"
            delay={25}
          />

          <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((step) => (
              <StaggerItem key={step.step}>
                <div className="clay h-full">
                  <SpotlightCard
                    className="h-full rounded-2xl p-5"
                    spotlightColor="rgba(255, 255, 255, 0.5)"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-ash-canvas text-teak-ink">
                        <step.icon className="size-5" />
                      </span>
                      <span className="num text-2xl font-extrabold text-teak-ink/15">
                        {step.step}
                      </span>
                    </div>
                    <p className="mt-3 text-base font-semibold">{step.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate">
                      {step.desc}
                    </p>
                  </SpotlightCard>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* ── Dark feature card #2: sinkronisasi ─────────────────────── */}
        <section className="mx-auto w-full max-w-[1200px] px-5">
          <AnimatedContent distance={80} threshold={0.15}>
            <div className="batik-sogan relative overflow-hidden rounded-3xl border border-white/10 bg-teak-ink p-8 shadow-[0_1px_4px_rgba(138,133,125,0.2)] md:p-12">
              <div
                aria-hidden="true"
                className="wood-carving pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
              />
              <div className="relative z-10 grid items-center gap-8 md:grid-cols-2">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-janur-green px-3 py-1.5 text-xs font-medium text-teak-ink">
                    <RefreshCw className="size-3.5" /> Sinkron real-time
                  </span>
                  <SplitText
                    tag="h2"
                    textAlign="left"
                    className="mt-4 font-serif text-3xl leading-tight text-white md:text-4xl pb-1"
                    text="Dua perangkat, satu rencana"
                    delay={25}
                  />
                  <p className="mt-4 text-sm leading-relaxed text-white/70">
                    Setiap perubahan — setoran tabungan, tugas selesai, RSVP
                    tamu — langsung tampil di perangkat pasangan Anda. Tanpa
                    refresh, tanpa kirim ulang.
                  </p>
                </div>
                <div className="space-y-2.5">
                  {[
                    "Andra menambah setoran Rp 2.000.000",
                    "Rina menandai “Pesan katering” selesai",
                    "RSVP keluarga diperbarui menjadi Hadir",
                  ].map((event) => (
                    <div
                      key={event}
                      className="flex items-center gap-2.5 rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-white/90"
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-janur-green" />
                      {event}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedContent>
        </section>

        <GarlandDivider className="mx-auto block h-20 w-full max-w-xs" />

        {/* ── CTA akhir: display headline + tombol magnetis + hati ────── */}
        <section className="mx-auto w-full max-w-[1200px] px-5">
          <AnimatedContent distance={60} threshold={0.2}>
            <div className="relative text-center">
              <SekarSudut className="pointer-events-none absolute left-8 top-2 size-7" />
              <SekarSudut className="pointer-events-none absolute right-10 bottom-24 size-5" />
              <img
                src="/assets/pengantin-surakarta.jpg"
                alt=""
                aria-hidden
                className="pointer-events-none absolute -left-6 bottom-0 hidden h-40 w-32 -rotate-6 rounded-2xl border-2 border-brass-gold object-cover shadow-lg md:block"
              />
              <h2 className="mx-auto max-w-3xl font-serif text-[34px] leading-[1.1] md:text-5xl">
                Siap merencanakan{" "}
                <span className="elegant relative inline-block text-[1.08em] text-brick-accent">
                  hari bahagia?
                  <span className="ornamen-bawah absolute -bottom-2 left-0 block w-full" />
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-body-lg text-slate">
                Buka ruang kerja Anda dan mulai susun rencana bersama pasangan
                — hanya butuh semenit.
              </p>
              <div className="mt-8 flex justify-center">
                <Magnet padding={70} magnetStrength={2.5}>
                  <Button asChild size="lg" className="px-7">
                    <Link to="/app">
                      Buka SatuJanji <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </Magnet>
              </div>
              {/* denyut hati — sentuhan romantic kecil di bawah CTA */}
              <div className="mt-7 flex justify-center">
                <PulseHeart
                  showCount={false}
                  size={38}
                  label="Suka"
                  likedColor="#b4553a"
                  pillColor="#3a2317"
                  textColor="#ffffff"
                />
              </div>
            </div>
          </AnimatedContent>
        </section>
      </main>

      {/* ── Footer minimal ──────────────────────────────────────────── */}
      <footer className="border-t border-border/60">
        <div aria-hidden="true" className="pita-h pita-parang h-4 w-full" />
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-3 px-5 py-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-teak-ink">
              <FlowerMark className="size-4 text-white" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              SatuJanji
            </span>
          </div>
          <p className="aksara text-sm text-brick-accent">ꦩꦠꦸꦂꦤꦸꦮꦸꦤ꧀</p>
          <p className="meta">
            Perencana pernikahan untuk berdua · © 2026 · Foto: Wikimedia
            Commons (CC BY-SA)
          </p>
        </div>
      </footer>
    </div>
  );
}
