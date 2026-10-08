import BlurText from "@/components/BlurText";
import { FlowerMark, Petals, PetalsFront } from "@/components/Decor";
import Magnet from "@/components/Magnet";
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
      <PetalsFront />
      <div className="clay grad-warm relative w-full max-w-sm overflow-hidden p-8 text-center">
        <FlowerMark className="float-slow pointer-events-none absolute -right-4 -top-4 size-24 text-primary/20" />
        <FlowerMark className="sway pointer-events-none absolute -left-4 bottom-2 size-16 text-tint-rose-foreground/20" />
        <p className="num relative text-5xl font-extrabold text-primary">404</p>
        <h1 className="h-card relative mt-3">
          <BlurText
            text="Halaman tidak ditemukan"
            direction="bottom"
            delay={20}
            className="justify-center"
          />
        </h1>
        <p className="meta relative mt-1.5">
          Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>
        <div className="relative mt-5 flex flex-col gap-2">
          <Magnet padding={60} magnetStrength={2.5}>
            <Button asChild className="rounded-2xl">
              <Link to="/">Kembali ke beranda</Link>
            </Button>
          </Magnet>
          <Button asChild variant="outline" className="rounded-2xl">
            <Link to="/app">Buka aplikasi</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
