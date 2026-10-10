import AnimatedContent from "@/components/AnimatedContent";
import BlurText from "@/components/BlurText";
import CountUp from "@/components/CountUp";
import {
  GarlandDivider,
  MotifDivider,
  Petals,
  PetalsFront,
} from "@/components/Decor";
import {
  RingsMark,
  WreathMark,
} from "@/components/Decor";
import Magnet from "@/components/Magnet";
import GradientText from "@/components/reactbits/GradientText";
import Rotate from "@/components/reactbits/Rotate";
import ShinyText from "@/components/reactbits/ShinyText";
import StarBorder from "@/components/reactbits/StarBorder";
import FadeContent from "@/components/FadeContent";
import PulseHeart from "@/components/PulseHeart";
import { Stagger, StaggerItem } from "@/components/Shared";
import SpotlightCard from "@/components/SpotlightCard";
import { Button } from "@/components/ui/button";
import { FEATURES } from "@/lib/features";
import {
  ArrowRight,
  DoorOpen,
  HeartHandshake,
  Mail,
  RefreshCw,
  Sparkles,
  Wallet,
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

/** Nilai utama yang disampaikan tanpa kutipan atau klaim pengguna yang belum diverifikasi. */
const PLANNER_PILLARS = [
  {
    title: "Rencana yang jelas",
    description: "Checklist, tenggat, dan rundown tersusun dalam satu alur.",
  },
  {
    title: "Keuangan terbuka",
    description: "Anggaran, pengeluaran, dan setoran mudah dipantau bersama.",
  },
  {
    title: "Kerja tim berdua",
    description: "Workspace yang sama mengikuti perubahan di kedua perangkat.",
  },
];

/**
 * Halaman publik Cora: hero bertema nature — foto asli tanaman & bayangannya
 * di dinding, lalu ritme botanical → putih → botanical → putih → CTA.
 * Palet selalu default (Burgundy Garden); palet kustom hanya untuk /app.
 */
export function LandingPage() {
  const [bannerOpen, setBannerOpen] = useState(true);

  return (
    <div className="relative min-h-screen">
      <Petals />
      <PetalsFront />

      {/* ── Banner pengumuman (midnight navy, melebar penuh) ─────────── */}
      {bannerOpen && (
        <div className="relative z-50 bg-midnight-navy">
          <div className="mx-auto flex w-full max-w-[1200px] items-center justify-center px-12 py-2.5 text-center text-sm font-medium text-white">
            <span>
              Ruang kerja berdua kini terbuka untuk siapa pun — mulai gratis,
              tanpa kartu.{" "}
              <a
                href="#cara-kerja"
                className="font-semibold text-atmosphere-blue underline-offset-4 hover:underline"
              >
                Lihat caranya
              </a>
            </span>
            <button
              type="button"
              aria-label="Tutup pengumuman"
              onClick={() => setBannerOpen(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-colors hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <main>
        {/* ── Hero nature: foto asli tanaman membuang bayangan di dinding ── */}
        <section className="plant-hero isolate relative flex min-h-screen w-full items-center justify-center px-5 pb-28 pt-24 text-center">
          <div aria-hidden="true" className="photo-veil absolute inset-0 z-0" />

          {/* Header menempel di atas dinding — persis di bawah pita pengumuman */}
          <header className="absolute inset-x-0 top-0 z-40">
            <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-4">
              <Link
                to="/"
                className="flex items-center gap-2.5 rounded-full border border-ink/10 bg-white/60 px-3 py-1.5 backdrop-blur-sm"
              >
                <span className="flex size-7 items-center justify-center rounded-full border border-leaf/30">
                  <RingsMark className="size-4 text-leaf" />
                </span>
                <span className="text-base font-semibold tracking-tight text-midnight-navy">
                  SatuJanji
                </span>
              </Link>
              <div className="flex items-center gap-3">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-ink hover:bg-ink/5 hover:text-ink"
                >
                  <Link to="/auth">Masuk dengan email</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-primary text-primary-foreground shadow-none hover:bg-deep-cerulean"
                >
                  <Link to="/app">
                    Buka aplikasi <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          <div className="relative z-10 mx-auto max-w-4xl">
            <FadeContent
              blur
              duration={900}
              delay={150}
              className="relative inline-block"
            >
              <span className="chip border-primary/25 bg-white/75 text-primary backdrop-blur-sm">
                <Sparkles className="size-3.5" />{" "}
                <ShinyText text="Perencana pernikahan untuk berdua" />
              </span>
            </FadeContent>

            <FadeContent
              blur
              duration={1200}
              delay={300}
              className="relative mx-auto mt-7"
            >
              <h1 className="font-serif text-[44px] font-light leading-[1.02] text-midnight-navy sm:text-[56px] md:text-[68px]">
                Rencanakan hari bahagia Anda,{" "}
                <span className="elegant relative inline-block text-[1.06em] italic text-leaf">
                  berdua.
                </span>
              </h1>
            </FadeContent>

            <BlurText
              text="Satu ruang kerja bersama untuk budget, tabungan, checklist, daftar tamu, vendor, dan rundown — tersinkron real-time di kedua perangkat Anda berdua."
              className="mx-auto mt-7 max-w-2xl text-body-lg leading-normal text-ink/70"
              direction="bottom"
              delay={30}
            />

            <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
              <Magnet padding={70} magnetStrength={2.5}>
                <StarBorder>
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary px-7 text-primary-foreground shadow-none hover:bg-deep-cerulean"
                  >
                    <Link to="/app">
                      Mulai merencanakan <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </StarBorder>
              </Magnet>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary/45 bg-transparent px-6 text-primary hover:bg-primary/10 hover:text-primary"
              >
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
                  <span
                    key={item}
                    className="meta flex items-center gap-1.5 text-ink/70"
                  >
                    <span className="size-1.5 rounded-full bg-leaf" />
                    {item}
                  </span>
                ),
              )}
            </FadeContent>
          </div>

        </section>

        {/* ── Perencanaan inti — copy faktual, tanpa testimoni buatan ─────── */}
        <section className="bg-cloud-white px-5 py-24">
          <div className="mx-auto max-w-[1200px]">
            <FadeContent blur duration={900} className="text-center">
              <p className="label text-stone">Dibuat untuk rencana bersama</p>
              <h2 className="mx-auto mt-2 max-w-2xl font-serif text-3xl font-light leading-tight md:text-[40px]">
                Satu ruang untuk menyatukan semua detail
              </h2>
            </FadeContent>
            <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
              {PLANNER_PILLARS.map((pillar, index) => {
                const Mark = [DoorOpen, Wallet, HeartHandshake][index];
                return (
                  <StaggerItem key={pillar.title}>
                    <article className="clay h-full rounded-xl p-6">
                      <span className="flex size-10 items-center justify-center rounded-full bg-sky-tint text-midnight-navy">
                        <Mark className="size-5" />
                      </span>
                      <h3 className="mt-4 text-base font-semibold text-ink">{pillar.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-graphite">{pillar.description}</p>
                    </article>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        </section>

        {/* ── Foto floral asli: headline mengambang + preview produk ──── */}
        <section className="floral-canvas isolate relative w-full px-5 py-28 text-center">
          <div aria-hidden="true" className="photo-dim absolute inset-0 z-0" />

          <FadeContent blur duration={900} className="relative z-10">
            <h2 className="mx-auto max-w-3xl font-serif text-3xl font-light leading-tight text-white md:text-[45px]">
              Hitung mundur, dana, dan tugas{" "}
              <GradientText className="elegant italic" speed={8}>
                terlihat sekilas
              </GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-body-lg text-white/80">
              Ringkasan hari-H, progres budget, dan sisa tugas diperbarui
              real-time — sama persis di layar Anda dan pasangan.
            </p>
          </FadeContent>

          {/* Preview mini dashboard — kartu putih mengambang di langit */}
          <AnimatedContent distance={80} threshold={0.15} className="relative z-10">
            <div className="mx-auto mt-12 max-w-md rotate-[-2deg] rounded-xl bg-cloud-white p-6 shadow-float lg:max-w-lg">
              <p className="label text-stone">Menuju hari pernikahan</p>
              <p className="num mt-1 font-serif text-5xl font-light text-ink">
                H-<CountUp to={328} />
              </p>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-mist-gray">
                <div className="fill-botanical h-full w-2/3 rounded-full" />
              </div>
              <p className="mt-2 text-sm text-graphite">
                Rp 42 jt dari target Rp 64 jt
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Budget", "Tabungan", "Checklist"].map((label) => (
                  <div key={label} className="clay-sm bg-mist-gray p-2.5">
                    <p className="label">{label}</p>
                    <p className="num mt-0.5 text-xs font-semibold">
                      <CountUp to={68} />%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedContent>
        </section>

        {/* ── Section putih: fitur ──────────────────────────────────────── */}
        <section id="fitur" className="bg-cloud-white px-5 py-24">
          <div className="mx-auto max-w-[1200px]">
            <FadeContent
              blur
              duration={900}
              className="flex flex-wrap items-end justify-between gap-2"
            >
              <div>
                <p className="label text-stone">Fitur lengkap</p>
                <SplitText
                  tag="h2"
                  textAlign="left"
                  className="mt-2 font-serif text-3xl font-light md:text-[40px] pb-1"
                  text="Semua yang Anda butuhkan dalam satu tempat"
                  delay={25}
                />
              </div>
              <span className="meta">
                <ShinyText text="9 modul siap dipakai" className="text-primary" />
              </span>
            </FadeContent>

            <Stagger className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              {FEATURES.map((feature) => (
                <StaggerItem key={feature.to}>
                  <Link
                    to="/app"
                    className="clay clay-press block h-full rounded-xl"
                  >
                    <SpotlightCard
                      className="h-full rounded-xl p-5"
                      spotlightColor="color-mix(in srgb, var(--color-bloom) 10%, transparent)"
                    >
                      <span className="flex size-9 items-center justify-center rounded-full bg-sky-tint">
                        <feature.icon className="size-4.5 text-midnight-navy" />
                      </span>
                      <p className="mt-3 text-sm font-semibold leading-tight text-ink">
                        {feature.label}
                      </p>
                      <p className="mt-1 text-[12px] leading-snug text-graphite">
                        {feature.desc}
                      </p>
                    </SpotlightCard>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        <MotifDivider className="mx-auto block h-9 w-full max-w-sm" />

        {/* ── Section putih: cara kerja ─────────────────────────────────── */}
        <section id="cara-kerja" className="bg-cloud-white px-5 pb-24">
          <div className="mx-auto max-w-[1200px]">
            <p className="label text-stone">Cara kerja</p>
            <SplitText
              tag="h2"
              textAlign="left"
              className="mt-2 font-serif text-3xl font-light md:text-[40px] pb-1"
              text="Tiga langkah menuju rencana yang rapi"
              delay={25}
            />

            <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
              {STEPS.map((step) => (
                <StaggerItem key={step.step}>
                  <Rotate className="h-full" maxRotateX={8} maxRotateY={10}>
                  <div className="clay h-full rounded-xl">
                    <SpotlightCard
                      className="h-full rounded-xl p-6"
                      spotlightColor="color-mix(in srgb, var(--color-bloom) 10%, transparent)"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex size-10 items-center justify-center rounded-full bg-sky-tint text-midnight-navy">
                          <step.icon className="size-5" />
                        </span>
                        <span className="num font-serif text-3xl font-light text-fog">
                          {step.step}
                        </span>
                      </div>
                      <p className="mt-4 text-base font-semibold text-ink">
                        {step.title}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-graphite">
                        {step.desc}
                      </p>
                    </SpotlightCard>
                  </div>
                  </Rotate>
                </StaggerItem>
              ))}
            </Stagger>

            {/* pita sinkronisasi — kartu navy di section putih */}
            <AnimatedContent distance={80} threshold={0.15}>
              <div className="relative mt-14 overflow-hidden rounded-2xl bg-midnight-navy p-8 shadow-float md:p-12">
                <div className="grid items-center gap-8 md:grid-cols-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-atmosphere-blue/50 bg-white/10 px-3 py-1.5 text-xs font-medium text-atmosphere-blue">
                      <RefreshCw className="size-3.5" /> Sinkron real-time
                    </span>
                    <h3 className="mt-4 font-serif text-3xl font-light leading-tight text-white">
                      Dua perangkat, satu rencana
                    </h3>
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
                        <span className="size-1.5 shrink-0 rounded-full bg-atmosphere-blue" />
                        {event}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedContent>
          </div>
        </section>

        <GarlandDivider className="mx-auto block h-10 w-full max-w-sm" />

        {/* ── CTA akhir: latar buket floral asli ───────────────────────── */}
        <section className="bouquet-canvas isolate relative w-full px-5 py-32 text-center">
          <div aria-hidden="true" className="photo-dim absolute inset-0 z-0" />
          <AnimatedContent distance={60} threshold={0.2} className="relative z-10">
            <h2 className="mx-auto max-w-3xl font-serif text-4xl font-light leading-[1.05] text-white md:text-[55px]">
              Siap merencanakan{" "}
              <ShinyText
                text="hari bahagia?"
                className="elegant inline-block italic text-white"
              />
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-body-lg text-white/80">
              Buka ruang kerja Anda dan mulai susun rencana bersama pasangan —
              hanya butuh semenit.
            </p>
            <div className="mt-9 flex justify-center">
              <Magnet padding={80} magnetStrength={2.2}>
                <Button
                  asChild
                  size="lg"
                  className="bg-midnight-navy px-8 text-white shadow-none hover:bg-deep-cerulean"
                >
                  <Link to="/app">
                    Buka SatuJanji <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </Magnet>
            </div>
            <div className="mt-8 flex justify-center">
              <PulseHeart
                showCount={false}
                size={38}
                label="Suka"
                likedColor="var(--color-bloom)"
                pillColor="var(--color-midnight-navy)"
                textColor="#ffffff"
              />
            </div>
          </AnimatedContent>
        </section>
      </main>

      {/* ── Footer solid di atas burgundy ────────────────────────────── */}
      <footer className="relative border-t border-white/20 bg-midnight-navy">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-3 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full border border-white/50">
              <WreathMark className="size-4 text-white" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">
              SatuJanji
            </span>
          </div>
          <p className="meta text-white/80">
            Perencana pernikahan untuk berdua · © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
