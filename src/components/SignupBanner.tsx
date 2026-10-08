import { Button } from "@/components/ui/button";
import { Mail, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

/** Penanda “jangan tampilkan lagi” di perangkat ini. */
const DISMISS_KEY = "satujanji:banner-email";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Ajakan masuk dengan email untuk pengguna anonim yang sudah mengisi data.
 *
 * Workspace anonim hanya hidup di perangkat ini. Setelah beberapa data diisi
 * (onboarding selesai + ada isinya), nilainya sudah cukup besar untuk
 * ditawarkan penyimpanan permanen — sekali klik ke Pengaturan.
 */
export function SignupBanner({ show }: { show: boolean }) {
  const [hidden, setHidden] = useState(readDismissed);

  if (!show || hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Kalau storage diblokir, banner cukup ditutup untuk sesi ini.
    }
  };

  return (
    <section className="clay relative mb-4 overflow-hidden p-4">
      <button
        type="button"
        aria-label="Tutup ajakan"
        onClick={dismiss}
        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
      <div className="flex items-start gap-3">
        <span className="clay-sm flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-tint-lavender-foreground">
          <Mail className="size-4" />
        </span>
        <div className="min-w-0 pr-4">
          <p className="text-sm font-extrabold leading-tight">
            Simpan ruang kerja kalian
          </p>
          <p className="meta mt-1">
            Data ini baru tersimpan di perangkat ini. Masuk dengan email supaya
            tidak hilang, bisa dibuka dari perangkat lain, dan bisa dibagikan ke
            pasangan lewat kode undangan.
          </p>
          <Button asChild size="sm" className="mt-2.5 rounded-xl">
            <Link to="/app/pengaturan">Masuk dengan email</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
