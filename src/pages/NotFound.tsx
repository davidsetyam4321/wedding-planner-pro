import BlurText from "@/components/BlurText";
import {
  BranchMark,
  Petals,
  PetalsFront,
  SekarSudut,
  WreathMark,
} from "@/components/Decor";
import Magnet from "@/components/Magnet";
import Aurora from "@/components/reactbits/Aurora";
import DecryptedText from "@/components/reactbits/DecryptedText";
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
      <Aurora className="pointer-events-none fixed inset-0 -z-10" />
      <Petals />
      <PetalsFront />
      <SekarSudut className="pointer-events-none absolute left-6 top-10 hidden size-8 rotate-12 sm:block" />
      <div className="clay grad-warm relative w-full max-w-sm overflow-hidden p-8 text-center">
        <WreathMark className="float-slow pointer-events-none absolute -right-4 -top-4 size-24 text-primary/20" />
        <BranchMark className="sway pointer-events-none absolute -left-4 bottom-2 size-16 text-leaf/30" />
        <p className="num relative text-5xl font-extrabold text-primary">
          <DecryptedText text="404" speed={70} />
        </p>
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
