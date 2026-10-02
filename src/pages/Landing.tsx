import { FlowerMark, Petals } from "@/components/Decor";
import { Stagger, StaggerItem } from "@/components/Shared";
import { Button } from "@/components/ui/button";
import { FEATURES } from "@/lib/features";
import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { Link } from "react-router";

const STEPS = [
  {
    step: "01",
    title: "Buka ruang kerja",
    desc: "Aplikasi langsung menyiapkan ruang kerja privat untuk Anda — tanpa pendaftaran yang rumit.",
    emoji: "🌸",
  },
  {
    step: "02",
    title: "Undang pasangan",
    desc: "Bagikan kode undangan 6 karakter agar pasangan bergabung ke ruang kerja yang sama.",
    emoji: "💌",
  },
  {
    step: "03",
    title: "Rencanakan bersama",
    desc: "Budget, checklist, tamu, vendor, dan rundown diperbarui real-time di kedua perangkat.",
    emoji: "✨",
  },
];

/** Halaman publik: memperkenalkan produk lalu mengarahkan ke aplikasi. */
export function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <Petals />

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="clay grad-warm clay-sm flex size-9 items-center justify-center rounded-xl">
              <FlowerMark className="size-5 text-primary" />
            </span>
            <span className="font-serif text-base font-semibold">
              Planner Wedding
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="#fitur"
              className="hidden text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Fitur
            </a>
            <a
              href="#cara-kerja"
              className="hidden text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Cara kerja
            </a>
            <Button asChild size="sm" className="rounded-2xl">
              <Link to="/app">
                Buka aplikasi <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="mx-auto w-full max-w-5xl px-5 pb-4 pt-12 md:pt-20">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <span className="clay-inset inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Perencana pernikahan untuk berdua
              </span>
              <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.1] md:text-5xl">
                Rencanakan hari bahagia Anda,{" "}
                <span className="text-primary">berdua</span>.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                Satu ruang kerja bersama untuk budget, tabungan, checklist,
                daftar tamu, vendor, dan rundown — tersinkron real-time di kedua
                perangkat Anda berdua.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="rounded-2xl">
                  <Link to="/app">
                    Mulai merencanakan <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-2xl"
                >
                  <a href="#cara-kerja">Lihat cara kerja</a>
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5">
                {["8 modul lengkap", "2 perangkat, 1 data", "Tanpa ribet"].map(
                  (item) => (
                    <span
                      key={item}
                      className="meta flex items-center gap-1.5"
                    >
                      <span className="size-1.5 rounded-full bg-tint-mint-foreground" />
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            {/* Preview mini dashboard */}
            <div className="clay grad-warm relative overflow-hidden p-5">
              <FlowerMark className="float-slow pointer-events-none absolute -right-4 -top-4 size-24 text-primary/15" />
              <FlowerMark className="sway pointer-events-none absolute -left-4 bottom-2 size-16 text-tint-rose-foreground/20" />
              <div className="relative">
                <p className="label text-muted-foreground">
                  Menuju hari pernikahan
                </p>
                <p className="num mt-1 text-4xl font-extrabold text-primary">
                  H-328
                </p>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/70">
                  <div className="h-full w-2/3 rounded-full bg-primary" />
                </div>
                <p className="meta mt-1.5">Rp 42 jt dari target Rp 64 jt</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Budget", surface: "grad-mint", text: "text-tint-mint-foreground" },
                    { label: "Tabungan", surface: "grad-lavender", text: "text-tint-lavender-foreground" },
                    { label: "Checklist", surface: "grad-peach", text: "text-tint-peach-foreground" },
                  ].map((tile) => (
                    <div
                      key={tile.label}
                      className={`clay-sm ${tile.surface} p-2.5 ${tile.text}`}
                    >
                      <p className="label opacity-80">{tile.label}</p>
                      <p className="num mt-0.5 text-xs font-extrabold">68%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Fitur ─────────────────────────────────────────────────── */}
        <section id="fitur" className="mx-auto w-full max-w-5xl px-5 pt-14">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="label text-muted-foreground">Fitur lengkap</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold md:text-3xl">
                Semua yang Anda butuhkan dalam satu tempat
              </h2>
            </div>
            <span className="meta">8 modul siap dipakai</span>
          </div>

          <Stagger className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {FEATURES.map((feature) => (
              <StaggerItem key={feature.to}>
                <Link
                  to="/app"
                  className={`clay clay-press block h-full p-4 ${feature.surface}`}
                >
                  <div className="flex items-center justify-between">
                    <feature.icon className="size-5" />
                    <span className="text-lg">{feature.emoji}</span>
                  </div>
                  <p className="mt-2.5 text-sm font-extrabold leading-tight">
                    {feature.label}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug opacity-80">
                    {feature.desc}
                  </p>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* ── Cara kerja ────────────────────────────────────────────── */}
        <section id="cara-kerja" className="mx-auto w-full max-w-5xl px-5 pt-16">
          <p className="label text-muted-foreground">Cara kerja</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold md:text-3xl">
            Tiga langkah menuju rencana yang rapi
          </h2>

          <Stagger className="mt-6 grid gap-3 md:grid-cols-3">
            {STEPS.map((step) => (
              <StaggerItem key={step.step}>
                <div className="clay h-full p-5">
                  <div className="flex items-center justify-between">
                    <span className="clay-sm flex size-10 items-center justify-center rounded-2xl bg-white/70 text-lg">
                      {step.emoji}
                    </span>
                    <span className="num text-2xl font-extrabold text-primary/25">
                      {step.step}
                    </span>
                  </div>
                  <p className="mt-3 font-serif text-lg font-semibold">
                    {step.title}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* ── Sinkronisasi ──────────────────────────────────────────── */}
        <section className="mx-auto w-full max-w-5xl px-5 pt-16">
          <div className="clay grad-mint relative overflow-hidden p-6 text-tint-mint-foreground md:p-8">
            <FlowerMark className="sway pointer-events-none absolute -right-5 -top-5 size-28 text-white/30" />
            <div className="relative grid items-center gap-6 md:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-bold">
                  <RefreshCw className="size-3.5" /> Sinkron real-time
                </span>
                <h2 className="mt-3 font-serif text-2xl font-semibold md:text-3xl">
                  Dua perangkat, satu rencana
                </h2>
                <p className="mt-2 text-sm leading-relaxed opacity-85">
                  Setiap perubahan — setoran tabungan, tugas selesai, RSVP
                  tamu — langsung tampil di perangkat pasangan Anda. Tanpa
                  refresh, tanpa kirim ulang.
                </p>
              </div>
              <div className="space-y-2">
                {[
                  "Andra menambah setoran Rp 2.000.000",
                  "Rina menandai “Pesan katering” selesai",
                  "RSVP keluarga diperbarui menjadi Hadir",
                ].map((event) => (
                  <div
                    key={event}
                    className="flex items-center gap-2.5 rounded-2xl bg-white/75 px-3.5 py-2.5 text-xs font-semibold text-foreground"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-tint-mint-foreground" />
                    {event}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA akhir ─────────────────────────────────────────────── */}
        <section className="mx-auto w-full max-w-5xl px-5 pb-16 pt-16">
          <div className="clay grad-warm relative overflow-hidden p-8 text-center">
            <FlowerMark className="float-slow pointer-events-none absolute -right-4 -top-4 size-24 text-primary/20" />
            <h2 className="relative font-serif text-2xl font-semibold md:text-3xl">
              Siap merencanakan hari bahagia?
            </h2>
            <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Buka ruang kerja Anda dan mulai susun rencana bersama pasangan
              — hanya butuh semenit.
            </p>
            <div className="relative mt-5 flex justify-center">
              <Button asChild size="lg" className="rounded-2xl">
                <Link to="/app">
                  Buka Planner Wedding <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-5 py-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="clay grad-warm clay-sm flex size-8 items-center justify-center rounded-lg">
              <FlowerMark className="size-4 text-primary" />
            </span>
            <span className="font-serif text-sm font-semibold">
              Planner Wedding
            </span>
          </div>
          <p className="meta">Perencana pernikahan untuk berdua · © 2026</p>
        </div>
      </footer>
    </div>
  );
}
