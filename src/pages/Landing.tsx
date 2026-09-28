import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FolderTree,
  Heart,
  ListChecks,
  PiggyBank,
  Terminal,
  Wallet,
} from "lucide-react";
import { Link, Navigate } from "react-router";

const FEATURES = [
  {
    icon: Wallet,
    id: "01",
    title: "Budget per kategori",
    body: "Bagi anggaran ke venue, katering, dekorasi, dan lainnya. Tandai pengeluaran yang sudah lunas agar sisa dana selalu akurat.",
  },
  {
    icon: PiggyBank,
    id: "02",
    title: "Tabungan bersama",
    body: "Catat setoran rutin kalian dan lihat progres menuju target dana pernikahan bertambah dari minggu ke minggu.",
  },
  {
    icon: ListChecks,
    id: "03",
    title: "Checklist persiapan",
    body: "Dari survey venue sampai kirim undangan — semua tugas tercatat rapi dengan progres yang mudah dipantau.",
  },
  {
    icon: FolderTree,
    id: "04",
    title: "Mood board",
    body: "Simpan referensi dekorasi, baju, dan makeup per kategori. Maksimal 3 foto per kotak, tanpa screenshot menumpuk.",
  },
];

const STEPS = [
  { id: "$", text: "Isi nama kalian dan tanggal pernikahan" },
  { id: "$", text: "Atur target dana dan alokasi anggaran" },
  { id: "$", text: "Nabung, centang tugas, kumpulkan referensi" },
  { id: "$", text: "Pantau semuanya dari satu dashboard" },
];

/** Landing page for Planner Wedding — light terminal theme. */
export default function Landing() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="cursor-blink text-sm text-muted-foreground">memuat sesi</p>
      </main>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen"
    >
      {/* Top bar */}
      <header className="scanline-top border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center border border-primary/40 bg-background text-primary">
              <Heart className="size-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">planner_wedding</span>
          </div>
          <Button asChild size="sm">
            <Link to="/auth">Masuk</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-14 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="panel mx-auto max-w-2xl"
        >
          <div className="panel-header justify-between">
            <span className="flex items-center gap-1.5">
              <Terminal className="size-3.5" /> planner --wedding
            </span>
            <span className="normal-case tracking-normal">v1.0</span>
          </div>
          <div className="space-y-3 p-6 text-sm leading-relaxed sm:p-8">
            <p className="text-muted-foreground">
              <span className="text-primary">$</span> planner init --couple="kamu &amp; pasangan"
            </p>
            <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">
              Rencanakan pernikahan kalian{" "}
              <span className="text-primary">berdua</span>, tanpa spreadsheet berantakan.
            </h1>
            <p className="text-muted-foreground">
              Budget, tabungan, checklist, dan mood board dalam satu aplikasi
              yang ringan dipakai berdua. Cukup masuk dengan email — datanya
              aman tersimpan.
            </p>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button asChild className="flex-1 sm:flex-none">
                <Link to="/auth">
                  Mulai gratis <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 sm:flex-none">
                <Link to="/auth">Masuk ke akun</Link>
              </Button>
            </div>
            <p className="cursor-blink pt-1 text-[11px] text-muted-foreground">
              siap merencanakan
            </p>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 pb-10">
        <p className="prompt-label text-xs text-muted-foreground">fitur</p>
        <h2 className="mt-0.5 mb-4 text-lg font-semibold">Empat fitur inti</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <div className="panel h-full p-4">
                <div className="flex items-center justify-between">
                  <feature.icon className="size-4 text-primary" />
                  <span className="text-[10px] text-muted-foreground">
                    {feature.id}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-semibold">{feature.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 pb-12">
        <p className="prompt-label text-xs text-muted-foreground">cara pakai</p>
        <h2 className="mt-0.5 mb-4 text-lg font-semibold">Mulai dalam empat langkah</h2>
        <div className="panel">
          <div className="panel-header">sesi.txt</div>
          <ul className="divide-y divide-border text-sm">
            {STEPS.map((step, index) => (
              <li key={index} className="flex items-start gap-3 px-4 py-3">
                <span className="text-primary">{step.id}</span>
                <span className="flex-1">
                  <span className="mr-2 text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}.
                  </span>
                  {step.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="panel scanline-top p-6 text-center sm:p-8">
          <h2 className="text-lg font-semibold">Siap memulai?</h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
            Buat akun dengan email, ajak pasanganmu buka aplikasi yang sama, dan
            mulai susun rencana pernikahan hari ini juga.
          </p>
          <Button asChild className="mt-4">
            <Link to="/auth">
              Mulai sekarang <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-[11px] text-muted-foreground">
        <span className="prompt-label">planner_wedding</span>
        dibuat dengan hati untuk hari bahagiamu
      </footer>
    </motion.div>
  );
}
