import { FlowerMark, Petals } from "@/components/Decor";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative flex min-h-screen flex-col items-center justify-center p-6"
    >
      <Petals />
      <div className="clay grad-warm relative w-full max-w-sm overflow-hidden p-8 text-center">
        <FlowerMark className="float-slow pointer-events-none absolute -right-4 -top-4 size-24 text-primary/20" />
        <FlowerMark className="sway pointer-events-none absolute -left-4 bottom-2 size-16 text-tint-rose-foreground/20" />
        <p className="num relative text-5xl font-extrabold text-primary">404</p>
        <h1 className="h-card relative mt-3">Halaman tidak ditemukan</h1>
        <p className="meta relative mt-1.5">
          Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>
        <div className="relative mt-5 flex flex-col gap-2">
          <Button asChild className="rounded-2xl">
            <Link to="/">Kembali ke beranda</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl">
            <Link to="/app">Buka aplikasi</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
